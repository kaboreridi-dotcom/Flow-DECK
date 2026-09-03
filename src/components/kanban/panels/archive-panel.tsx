"use client";
// Flow DECK — archives dialog (tasks / columns / boards)
import { useMemo } from "react";
import { Archive, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/kanban/store";
import { useI18n } from "@/lib/i18n/context";
import type { Board, Column, Task } from "@/lib/kanban/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center">
      <Archive className="size-8 text-muted-foreground/50" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export default function ArchivePanel() {
  const open = useAppStore((s) => s.ui.archiveOpen);
  const setUI = useAppStore((s) => s.setUI);
  const data = useAppStore((s) => s.data);
  const unarchiveTask = useAppStore((s) => s.unarchiveTask);
  const unarchiveColumn = useAppStore((s) => s.unarchiveColumn);
  const unarchiveBoard = useAppStore((s) => s.unarchiveBoard);
  const { t } = useI18n();

  const boardNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of data.boards) map.set(b.id, b.name);
    return map;
  }, [data.boards]);

  const columnNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of data.columns) map.set(c.id, c.name);
    return map;
  }, [data.columns]);

  const archivedTasks = useMemo(
    () =>
      data.tasks
        .filter((x) => x.archived)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [data.tasks]
  );
  const archivedColumns = useMemo(
    () =>
      data.columns
        .filter((x) => x.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.columns]
  );
  const archivedBoards = useMemo(
    () =>
      data.boards
        .filter((x) => x.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.boards]
  );

  const restoreTask = (task: Task) => {
    unarchiveTask(task.id);
    toast.success(t("archive.taskRestored", { title: task.title }));
  };
  const restoreColumn = (col: Column) => {
    unarchiveColumn(col.id);
    toast.success(t("archive.columnRestored", { name: col.name }));
  };
  const restoreBoard = (board: Board) => {
    unarchiveBoard(board.id);
    toast.success(t("archive.boardRestored", { name: board.name }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => setUI({ archiveOpen: o })}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold tracking-tight">
            {t("archive.title")}
          </DialogTitle>
          <DialogDescription>{t("archive.subtitle")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tasks" className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="tasks">
              {t("archive.tab.tasks")}
              {archivedTasks.length > 0 && (
                <Badge variant="secondary" className="px-1.5 text-[10px]">
                  {archivedTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="columns">
              {t("archive.tab.columns")}
              {archivedColumns.length > 0 && (
                <Badge variant="secondary" className="px-1.5 text-[10px]">
                  {archivedColumns.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="boards">
              {t("archive.tab.boards")}
              {archivedBoards.length > 0 && (
                <Badge variant="secondary" className="px-1.5 text-[10px]">
                  {archivedBoards.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tasks */}
          <TabsContent value="tasks">
            {archivedTasks.length === 0 ? (
              <EmptyState text={t("archive.empty.tasks")} />
            ) : (
              <ul className="max-h-[55vh] space-y-2 overflow-y-auto scrollbar-slim pr-1">
                {archivedTasks.map((task) => {
                  const boardName = boardNames.get(task.boardId) ?? "";
                  const columnName = columnNames.get(task.columnId) ?? "";
                  const where = [boardName, columnName].filter(Boolean).join(" · ");
                  return (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {task.title}
                          </span>
                          {task.status === "done" && (
                            <Badge variant="secondary" className="text-[10px]">
                              {t("task.done")}
                            </Badge>
                          )}
                        </div>
                        {where && (
                          <p className="truncate text-xs text-muted-foreground">
                            {where}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("archive.restoreTask")}
                        onClick={() => restoreTask(task)}
                      >
                        <Undo2 className="size-4" aria-hidden="true" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          {/* Columns */}
          <TabsContent value="columns">
            {archivedColumns.length === 0 ? (
              <EmptyState text={t("archive.empty.columns")} />
            ) : (
              <ul className="max-h-[55vh] space-y-2 overflow-y-auto scrollbar-slim pr-1">
                {archivedColumns.map((col) => (
                  <li
                    key={col.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="truncate text-sm font-medium">{col.name}</span>
                      {boardNames.get(col.boardId) && (
                        <p className="truncate text-xs text-muted-foreground">
                          {boardNames.get(col.boardId)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("archive.restoreColumn")}
                      onClick={() => restoreColumn(col)}
                    >
                      <Undo2 className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* Boards */}
          <TabsContent value="boards">
            {archivedBoards.length === 0 ? (
              <EmptyState text={t("archive.empty.boards")} />
            ) : (
              <ul className="max-h-[55vh] space-y-2 overflow-y-auto scrollbar-slim pr-1">
                {archivedBoards.map((board) => (
                  <li
                    key={board.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="truncate text-sm font-medium">{board.name}</span>
                      {board.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {board.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("archive.restoreBoard")}
                      onClick={() => restoreBoard(board)}
                    >
                      <Undo2 className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
