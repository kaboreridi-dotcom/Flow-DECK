"use client";
// Flow DECK — global search (Cmd/Ctrl+K): boards, columns, tasks across the workspace
import React, { useMemo, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  CalendarClock,
  CheckCircle2,
  Columns3,
  LayoutGrid,
  TriangleAlert,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";
import { getTaskMatchesQuery } from "@/lib/kanban/stats";
import { dueState, formatDueLabel } from "@/lib/kanban/datetime";
import { cn } from "@/lib/utils";

export function GlobalSearchDialog() {
  const { t, lang } = useI18n();
  const open = useAppStore((s) => s.ui.globalSearchOpen);
  const setUI = useAppStore((s) => s.setUI);
  const data = useAppStore((s) => s.data);

  const [query, setQuery] = useState("");

  const close = (o: boolean) => {
    setUI({ globalSearchOpen: o });
    if (!o) setQuery("");
  };

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return { boards: [], columns: [], tasks: [] };
    const needle = q.toLowerCase();

    const boards = data.boards
      .filter((b) => !b.archived && b.name.toLowerCase().includes(needle))
      .slice(0, 6);

    const columns = data.columns
      .filter((c) => !c.archived && c.name.toLowerCase().includes(needle))
      .slice(0, 6);

    const labels = data.boards.flatMap((b) => b.labels);
    const tasks = data.tasks
      .filter((x) => !x.archived && getTaskMatchesQuery(x, labels, q))
      .sort((a, b) => {
        // Title matches first, then by update recency.
        const aTitle = a.title.toLowerCase().includes(needle) ? 0 : 1;
        const bTitle = b.title.toLowerCase().includes(needle) ? 0 : 1;
        return aTitle - bTitle || b.updatedAt - a.updatedAt;
      })
      .slice(0, 10);

    return { boards, columns, tasks };
  }, [query, data]);

  const goBoard = (boardId: string) => {
    useAppStore.getState().setActiveBoard(boardId);
    setUI({ globalSearchOpen: false });
  };

  const goTask = (taskId: string) => {
    const task = data.tasks.find((x) => x.id === taskId);
    if (!task) return;
    useAppStore.getState().setActiveBoard(task.boardId);
    setUI({ openTaskId: taskId, globalSearchOpen: false });
  };

  const empty = !results.boards.length && !results.columns.length && !results.tasks.length;

  return (
    <CommandDialog open={open} onOpenChange={close}>
      <CommandInput value={query} onValueChange={setQuery} placeholder={t("search.placeholder")} />
      <CommandList className="max-h-[55vh] scrollbar-slim">
        {empty && query.trim() ? <CommandEmpty>{t("search.empty")}</CommandEmpty> : null}
        {!query.trim() && (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">{t("search.hint")}</p>
        )}

        {results.boards.length > 0 && (
          <CommandGroup heading={t("search.boards")}>
            {results.boards.map((b) => (
              <CommandItem key={b.id} value={`${b.name} ${b.description}`.trim()} onSelect={() => goBoard(b.id)} className="gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <span className="truncate">{b.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.columns.length > 0 && (
          <CommandGroup heading={t("search.columns")}>
            {results.columns.map((c) => {
              const board = data.boards.find((b) => b.id === c.boardId);
              return (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${board?.name ?? ""}`.trim()}
                  onSelect={() => board && goBoard(board.id)}
                  className="gap-2"
                >
                  <Columns3 className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{board?.name}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {results.tasks.length > 0 && (
          <CommandGroup heading={t("search.tasks")}>
            {results.tasks.map((task) => {
              const board = data.boards.find((b) => b.id === task.boardId);
              const ds = dueState(task);
              return (
                <CommandItem key={task.id} value={`${task.title} ${task.description} ${board?.name ?? ""}`.trim()} onSelect={() => goTask(task.id)} className="gap-2">
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : ds === "overdue" ? (
                    <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
                  ) : ds !== "none" ? (
                    <CalendarClock className="h-4 w-4 shrink-0 text-amber-500" />
                  ) : (
                    <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={cn("truncate", task.status === "done" && "line-through text-muted-foreground")}>
                    {task.title}
                  </span>
                  <span className="ml-auto hidden shrink-0 items-center gap-2 text-xs text-muted-foreground sm:flex">
                    {task.dueDate != null && ds !== "none" && <span>{formatDueLabel(task.dueDate, lang, ds)}</span>}
                    <span className="max-w-[120px] truncate">{board?.name}</span>
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
