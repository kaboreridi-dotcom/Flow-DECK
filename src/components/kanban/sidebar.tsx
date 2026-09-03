"use client";
// Flow DECK — sidebar: boards list, tools; Sheet on mobile
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  BarChart3,
  Compass,
  Import,
  Keyboard,
  LayoutGrid,
  LayoutTemplate,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  ArrowDownUp,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";
import type { Board } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";

type BoardSort = "name" | "created" | "updated";

function BoardListContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const data = useAppStore((s) => s.data);
  const setUI = useAppStore((s) => s.setUI);
  const setActiveBoard = useAppStore((s) => s.setActiveBoard);
  const duplicateBoard = useAppStore((s) => s.duplicateBoard);
  const deleteBoard = useAppStore((s) => s.deleteBoard);
  const archiveBoard = useAppStore((s) => s.archiveBoard);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<BoardSort>("updated");
  const [pendingDelete, setPendingDelete] = useState<Board | null>(null);

  const boards = useMemo(() => {
    const active = data.boards.filter((b) => !b.archived);
    const q = query.trim().toLowerCase();
    const filtered = q ? active.filter((b) => b.name.toLowerCase().includes(q)) : active;
    const sorted = [...filtered];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "created") sorted.sort((a, b) => a.createdAt - b.createdAt);
    else sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    return sorted;
  }, [data.boards, query, sort]);

  const taskCount = (boardId: string) =>
    data.tasks.filter((x) => x.boardId === boardId && !x.archived).length;

  const switchTo = (id: string) => {
    setActiveBoard(id);
    onNavigate?.();
  };

  const cycleSort = () => {
    setSort((s) => (s === "updated" ? "name" : s === "name" ? "created" : "updated"));
  };

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      {/* New board */}
      <Button
        onClick={() => {
          useAppStore.getState().createBoard();
          toast.success(t("board.created"));
          onNavigate?.();
        }}
        className="flow-gradient justify-start gap-2 border-0 font-semibold text-white hover:opacity-90"
        aria-label={t("sidebar.newBoard")}
      >
        <Plus className="h-4 w-4" />
        {t("sidebar.newBoard")}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setUI({ templatesOpen: true })}
        className="justify-start gap-2"
      >
        <LayoutTemplate className="h-4 w-4 text-primary" />
        {t("sidebar.templates")}
      </Button>

      {/* Search + sort */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("sidebar.searchBoards")}
            className="h-8 pl-8 text-sm"
            aria-label={t("sidebar.searchBoards")}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={cycleSort}
          aria-label={t("sidebar.sortBoards")}
          title={t(`sidebar.sort.${sort}`)}
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Boards */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto scrollbar-slim" aria-label={t("a11y.sidebar")}>
        <p className="text-kicker px-1 pb-1">{t("header.boards")}</p>
        {boards.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">{t("sidebar.empty")}</p>
        )}
        {boards.map((b) => {
          const isActive = b.id === data.activeBoardId;
          return (
            <div
              key={b.id}
              className={cn(
                "group relative flex items-center rounded-lg border border-transparent transition-colors",
                isActive ? "border-border bg-muted/60" : "hover:bg-muted/40"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full flow-gradient" />
              )}
              <button
                type="button"
                onClick={() => switchTo(b.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-current={isActive ? "true" : undefined}
              >
                {isActive ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm", isActive ? "font-semibold" : "font-medium text-foreground/90")}>
                    {b.name}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {t("sidebar.count", { count: taskCount(b.id) })}
                  </span>
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label={`${b.name} — ${t("common.ok")}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => { duplicateBoard(b.id); toast.success(t("board.duplicated")); }}>
                    <Copy className="h-4 w-4" /> {t("board.duplicate")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { archiveBoard(b.id); toast.success(t("board.archivedBadge")); }}>
                    <Archive className="h-4 w-4" /> {t("board.archive")}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setPendingDelete(b)}>
                    <Trash2 className="h-4 w-4" /> {t("board.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </nav>

      {/* Tools */}
      <div className="space-y-1 border-t pt-3">
        <p className="text-kicker px-1 pb-1">{t("sidebar.section.tools")}</p>
        {[
          { icon: BarChart3, label: t("sidebar.stats"), action: () => setUI({ statsOpen: true }) },
          { icon: Compass, label: t("sidebar.focus"), action: () => setUI({ focusOpen: true }) },
          { icon: Archive, label: t("sidebar.archives"), action: () => setUI({ archiveOpen: true }) },
          { icon: Trash2, label: t("sidebar.trash"), action: () => setUI({ trashOpen: true }) },
          { icon: Import, label: t("sidebar.importExport"), action: () => setUI({ importExportOpen: true }) },
          { icon: Keyboard, label: t("sidebar.shortcuts"), action: () => setUI({ shortcutsOpen: true }) },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("board.deleteConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("board.deleteConfirm.body", { name: pendingDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  deleteBoard(pendingDelete.id);
                  toast.success(t("board.deleted"));
                }
                setPendingDelete(null);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AppSidebar() {
  const { t } = useI18n();
  const sidebarOpen = useAppStore((s) => s.ui.sidebarOpen);
  const setUI = useAppStore((s) => s.setUI);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar/60 backdrop-blur-sm md:block">
        <BoardListContent />
      </aside>

      {/* Mobile — controlled by header menu button */}
      <Sheet open={sidebarOpen} onOpenChange={(o) => setUI({ sidebarOpen: o })}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t("sidebar.title")}</SheetTitle>
          </SheetHeader>
          <BoardListContent onNavigate={() => setUI({ sidebarOpen: false })} />
        </SheetContent>
      </Sheet>
    </>
  );
}
