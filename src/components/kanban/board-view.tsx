"use client";
// Flow DECK — board view: toolbar, search, filters, sort, view switching
import React, { useMemo } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Columns3,
  ListFilter,
  ListTodo,
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";
import { filterTask, getTaskMatchesQuery, sortTasks } from "@/lib/kanban/stats";
import { dueState } from "@/lib/kanban/datetime";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SortKey } from "@/lib/kanban/types";
import FilterBar from "./views/filter-bar";
import ListView from "./views/list-view";
import SmartViews from "./views/smart-views";
import { KanbanView } from "./kanban-view";

const SORT_KEYS: SortKey[] = ["manual", "created", "modified", "due", "priority", "title", "progress", "estimate"];

const VIEWS = [
  { id: "kanban", icon: Columns3 },
  { id: "list", icon: ListTodo },
  { id: "done", icon: CheckCircle2 },
  { id: "overdue", icon: TriangleAlert },
  { id: "soon", icon: CalendarClock },
] as const;

export function BoardView() {
  const { t } = useI18n();
  const data = useAppStore((s) => s.data);
  const ui = useAppStore((s) => s.ui);
  const setUI = useAppStore((s) => s.setUI);
  const setSearch = useAppStore((s) => s.setSearch);
  const setSort = useAppStore((s) => s.setSort);
  const toggleSortDir = useAppStore((s) => s.toggleSortDir);

  const board = data.boards.find((b) => b.id === data.activeBoardId);
  const columns = useMemo(
    () =>
      data.columns
        .filter((c) => c.boardId === data.activeBoardId && !c.archived)
        .sort((a, b) => a.order - b.order),
    [data.columns, data.activeBoardId]
  );

  const boardTasks = useMemo(
    () => data.tasks.filter((x) => x.boardId === data.activeBoardId && !x.archived),
    [data.tasks, data.activeBoardId]
  );

  const visibleTasks = useMemo(() => {
    const q = ui.search.trim();
    let list = boardTasks;
    if (q) list = list.filter((task) => getTaskMatchesQuery(task, board?.labels ?? [], q));
    list = list.filter((task) => filterTask(task, ui.filters, board?.labels ?? []));
    return sortTasks(list, ui.sortKey, ui.sortDir);
  }, [boardTasks, ui.search, ui.filters, ui.sortKey, ui.sortDir, board?.labels]);

  const counts = useMemo(
    () => ({
      total: boardTasks.length,
      done: boardTasks.filter((x) => x.status === "done").length,
      overdue: boardTasks.filter((x) => dueState(x) === "overdue").length,
    }),
    [boardTasks]
  );

  if (!board) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <Columns3 className="h-10 w-10 text-muted-foreground/50" />
        <p className="font-display text-lg font-semibold">{t("sidebar.empty")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Board header */}
      <div className="shrink-0 border-b bg-background/40 px-4 pb-3 pt-4 backdrop-blur-sm sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold tracking-tight sm:text-2xl">
              {board.name}
            </h1>
            {board.description ? (
              <p className="mt-0.5 max-w-2xl truncate text-sm text-muted-foreground">{board.description}</p>
            ) : null}
            <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t("sidebar.count", { count: counts.total })}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                {counts.done}
              </span>
              {counts.overdue > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <TriangleAlert className="h-3 w-3" />
                    {counts.overdue}
                  </span>
                </>
              )}
            </p>
          </div>

          <Button
            onClick={() => setUI({ newTaskOpen: true })}
            className="flow-gradient shrink-0 gap-1.5 border-0 px-3 font-semibold text-white hover:opacity-90 sm:gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs sm:text-sm">{t("task.new")}</span>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5" role="tablist" aria-label={t("view.kanban")}>
            {VIEWS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={ui.view === id}
                onClick={() => setUI({ view: id })}
                title={t(`view.${id}`)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  ui.view === id ? "flow-gradient text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{t(`view.${id}`)}</span>
              </button>
            ))}
          </div>

          {/* Board search */}
          <div className="relative min-w-[140px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="board-search"
              value={ui.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search.boardSearch")}
              className="h-8 pl-8 text-sm"
              aria-label={t("search.boardSearch")}
            />
          </div>

          <FilterBar labels={board.labels} columns={columns} />

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" aria-label={t("sort.label")}>
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t(`sort.${ui.sortKey}`)}</span>
                {ui.sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t("sort.label")}</DropdownMenuLabel>
              {SORT_KEYS.map((k) => (
                <DropdownMenuItem key={k} onClick={() => setSort(k)} className={cn(ui.sortKey === k && "bg-muted")}>
                  {t(`sort.${k}`)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortDir}>
                {ui.sortDir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {t(`sort.${ui.sortDir}`)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {ui.sortKey !== "manual" && (
            <Badge variant="outline" className="hidden gap-1 border-amber-500/40 text-[10px] text-amber-500 md:inline-flex">
              <ListFilter className="h-3 w-3" />
              {t("sort.dragHint")}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      {ui.view === "kanban" && (
        <KanbanView columns={columns} tasks={visibleTasks} board={board} dragEnabled={ui.sortKey === "manual"} />
      )}
      {ui.view === "list" && <ListView tasks={visibleTasks} columns={columns} labels={board.labels} />}
      {(ui.view === "done" || ui.view === "overdue" || ui.view === "soon") && (
        <SmartViews mode={ui.view} tasks={visibleTasks} columns={columns} labels={board.labels} />
      )}
    </div>
  );
}
