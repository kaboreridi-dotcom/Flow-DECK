"use client";
// Flow DECK — top header: brand, board menu, search, undo/redo, language, theme
import React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Command,
  HelpCircle,
  KanbanSquare,
  Menu,
  MoreHorizontal,
  Moon,
  Pencil,
  Search,
  Sun,
  Undo2,
  Redo2,
  Archive,
  Copy,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/context";
import { useAppStore, buildBoardExport } from "@/lib/kanban/store";
import type { Lang } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";

function downloadExport(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AppHeader({ logoError }: { logoError?: (e: React.SyntheticEvent<HTMLImageElement>) => void }) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const data = useAppStore((s) => s.data);
  const past = useAppStore((s) => s.past.length);
  const future = useAppStore((s) => s.future.length);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const setUI = useAppStore((s) => s.setUI);
  const setActiveBoard = useAppStore((s) => s.setActiveBoard);
  const duplicateBoard = useAppStore((s) => s.duplicateBoard);
  const archiveBoard = useAppStore((s) => s.archiveBoard);
  const deleteBoard = useAppStore((s) => s.deleteBoard);

  const board = data.boards.find((b) => b.id === data.activeBoardId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exportBoard = () => {
    if (!board) return;
    const payload = buildBoardExport(data, board.id);
    if (!payload) return;
    const slug = board.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "board";
    downloadExport(payload, `flowdeck-${slug}-${new Date().toISOString().slice(0, 10)}.json`);
    toast.success(t("importExport.export.done"));
  };

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/70 px-3 backdrop-blur-md sm:px-4">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        onClick={() => setUI({ sidebarOpen: true })}
        aria-label={t("header.menu")}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Brand */}
      <a href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Flow DECK — accueil">
        <span className="flow-ring relative inline-flex h-8 w-8 overflow-hidden rounded-lg">
          <Image
            src="/flowdeck-logo.png"
            alt="Flow DECK"
            width={32}
            height={32}
            className="h-8 w-8 object-cover"
            onError={logoError}
            priority
          />
        </span>
        <span className="font-display hidden text-[15px] font-bold tracking-tight sm:inline">
          Flow<span className="flow-gradient-text"> DECK</span>
        </span>
      </a>

      {/* Board menu */}
      {board && (
        <div className="ml-1 flex min-w-0 items-center gap-1 sm:ml-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="max-w-[42vw] gap-2 px-2 font-display text-sm font-semibold sm:max-w-[300px]"
                aria-label={`${t("board.active")}: ${board.name}`}
              >
                <KanbanSquare className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{board.name}</span>
                <MoreHorizontal className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setUI({ settingsOpen: true })}>
                <Pencil className="h-4 w-4" /> {t("board.rename")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { duplicateBoard(board.id); toast.success(t("board.duplicated")); }}>
                <Copy className="h-4 w-4" /> {t("board.duplicate")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportBoard}>
                <Download className="h-4 w-4" /> {t("board.export")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { archiveBoard(board.id); toast.success(t("board.archivedBadge")); }}>
                <Archive className="h-4 w-4" /> {t("board.archive")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" /> {t("board.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("board.deleteConfirm.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("board.deleteConfirm.body", { name: board?.name ?? "" })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    deleteBoard(board?.id ?? "");
                    toast.success(t("board.deleted"));
                  }}
                >
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setUI({ globalSearchOpen: true })}
          className="gap-2 text-muted-foreground"
          aria-label={t("header.openGlobalSearch")}
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] uppercase">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </Button>

        <div className="mx-1 hidden items-center gap-0.5 sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => { if (past > 0) { undo(); toast.success(t("history.undone")); } }}
            disabled={past === 0}
            aria-label={t("common.undo")}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => { if (future > 0) { redo(); toast.success(t("history.redone")); } }}
            disabled={future === 0}
            aria-label={t("common.redo")}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Language switch */}
        <div
          className="flex items-center rounded-lg border bg-muted/40 p-0.5"
          role="group"
          aria-label={t("a11y.language")}
        >
          {(["fr", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                lang === l ? "flow-gradient text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={t("a11y.theme")}
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setUI({ shortcutsOpen: true })}
          aria-label={t("header.help")}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
