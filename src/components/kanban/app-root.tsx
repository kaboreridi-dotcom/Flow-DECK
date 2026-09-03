"use client";
// Flow DECK — application root: providers, hydration, shortcuts, URL sync, layout shell
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { LanguageProvider, useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";
import type { ViewMode } from "@/lib/kanban/types";
import { AppHeader } from "./header";
import { AppSidebar } from "./sidebar";
import { AppFooter } from "./footer";
import { BoardView } from "./board-view";
import { TaskDetailsDialog } from "./task-details-dialog";
import { NewTaskDialog } from "./new-task-dialog";
import { GlobalSearchDialog } from "./global-search-dialog";
import { BoardSettingsDialog } from "./board-settings-dialog";
import StatsPanel from "./panels/stats-panel";
import ArchivePanel from "./panels/archive-panel";
import TrashPanel from "./panels/trash-panel";
import TemplatesDialog from "./panels/templates-dialog";
import ImportExportDialog from "./panels/import-export-dialog";
import ShortcutsDialog from "./panels/shortcuts-dialog";
import FocusPanel from "./panels/focus-panel";
import { toast } from "sonner";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background" aria-hidden>
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-flow-pulse rounded-2xl flow-gradient opacity-20 blur-xl" />
        <img src="/flowdeck-logo.png" alt="" className="relative h-16 w-16 rounded-2xl object-cover" />
      </div>
      <p className="font-display text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">
        Flow&nbsp;Deck
      </p>
    </div>
  );
}

function Shortcuts() {
  const { t } = useI18n();
  const openTaskId = useAppStore((s) => s.ui.openTaskId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const store = useAppStore.getState();
      const ui = store.ui;
      const mod = e.ctrlKey || e.metaKey;

      // Global search: Ctrl/Cmd + K
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        store.setUI({ globalSearchOpen: !ui.globalSearchOpen });
        return;
      }
      if (isEditable(e.target)) return;

      // Undo / redo
      if (mod && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (store.past.length > 0) {
          store.undo();
          toast.success(t("history.undone"));
        }
        return;
      }
      if ((mod && e.shiftKey && e.key.toLowerCase() === "z") || (mod && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        if (store.future.length > 0) {
          store.redo();
          toast.success(t("history.redone"));
        }
        return;
      }

      switch (e.key) {
        case "n":
        case "N":
          if (!ui.openTaskId && !ui.globalSearchOpen) {
            e.preventDefault();
            store.setUI({ newTaskOpen: true });
          }
          break;
        case "/":
          if (!ui.openTaskId && !ui.globalSearchOpen) {
            e.preventDefault();
            const el = document.getElementById("board-search") as HTMLInputElement | null;
            el?.focus();
            el?.select();
          }
          break;
        case "?":
          e.preventDefault();
          store.setUI({ shortcutsOpen: true });
          break;
        case "Escape":
          if (openTaskId) store.setUI({ openTaskId: null });
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [t, openTaskId]);

  return null;
}

function UrlSync() {
  const hydrated = useAppStore((s) => s.hydrated);
  const activeBoardId = useAppStore((s) => s.data.activeBoardId);
  const openTaskId = useAppStore((s) => s.ui.openTaskId);
  const view = useAppStore((s) => s.ui.view);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse initial URL → state (once, after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const store = useAppStore.getState();
      const boardId = params.get("board");
      if (boardId && store.data.boards.some((b) => b.id === boardId && !b.archived)) {
        store.setActiveBoard(boardId);
      }
      const viewParam = params.get("view") as ViewMode | null;
      if (viewParam && ["kanban", "list", "done", "overdue", "soon"].includes(viewParam)) {
        store.setUI({ view: viewParam });
      }
      const taskParam = params.get("task");
      if (taskParam && store.data.tasks.some((x) => x.id === taskParam)) {
        store.setUI({ openTaskId: taskParam });
      }
    } catch {
      /* URL parsing is best-effort */
    }
  }, [hydrated]);

  // State → URL
  useEffect(() => {
    if (!hydrated) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const params = new URLSearchParams();
        if (activeBoardId) params.set("board", activeBoardId);
        if (view !== "kanban") params.set("view", view);
        if (openTaskId) params.set("task", openTaskId);
        const qs = params.toString();
        window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
      } catch {
        /* ignore */
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [hydrated, activeBoardId, openTaskId, view]);

  return null;
}

function StorageWatch() {
  const { t } = useI18n();
  useEffect(() => {
    const onStorageError = () => toast.error(t("error.storage"), { duration: 8000 });
    const onCorrupted = () => toast.error(t("error.corrupted"), { duration: 10000 });
    window.addEventListener("flowdeck:storage-error", onStorageError);
    window.addEventListener("flowdeck:corrupted", onCorrupted);
    return () => {
      window.removeEventListener("flowdeck:storage-error", onStorageError);
      window.removeEventListener("flowdeck:corrupted", onCorrupted);
    };
  }, [t]);
  return null;
}

function Shell() {
  const { t } = useI18n();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    // Small delay avoids layout flicker while fonts settle.
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [hydrate]);

  const onLogoError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  }, []);

  if (!hydrated || !ready) return <Splash />;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden" aria-label={t("a11y.main")}>
      <div className="ambient-glow" />
      <div className="grain pointer-events-none absolute inset-0" />
      <StorageWatch />
      <Shortcuts />
      <UrlSync />

      <AppHeader logoError={onLogoError} />

      <div className="relative z-10 flex min-h-0 flex-1">
        <AppSidebar />
        <main id="main" className="flex min-w-0 flex-1 flex-col" aria-label={t("a11y.boardArea")}>
          <BoardView />
        </main>
      </div>

      <AppFooter logoError={onLogoError} />

      {/* Overlays */}
      <TaskDetailsDialog />
      <NewTaskDialog />
      <GlobalSearchDialog />
      <BoardSettingsDialog />
      <StatsPanel />
      <ArchivePanel />
      <TrashPanel />
      <TemplatesDialog />
      <ImportExportDialog />
      <ShortcutsDialog />
      <FocusPanel />
      <SonnerToaster position="bottom-right" />
    </div>
  );
}

export default function FlowDeckApp() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LanguageProvider>
        <Shell />
      </LanguageProvider>
    </ThemeProvider>
  );
}
