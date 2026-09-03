"use client";
// Flow DECK — kanban view: multi-container drag & drop (tasks + columns)
import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";
import type { Board, Column, Task } from "@/lib/kanban/types";
import { ColumnCard } from "./column-card";
import { TaskCard } from "./task-card";

export function KanbanView({
  columns,
  tasks,
  board,
  dragEnabled,
}: {
  columns: Column[];
  tasks: Task[];
  board: Board;
  dragEnabled: boolean;
}) {
  const { t } = useI18n();
  const setUI = useAppStore((s) => s.setUI);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const col of columns) map.set(col.id, []);
    for (const task of tasks) {
      const arr = map.get(task.columnId);
      if (arr) arr.push(task);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [columns, tasks]);

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const findTaskById = (id: string): Task | null => {
    for (const arr of tasksByColumn.values()) {
      const found = arr.find((x) => x.id === id);
      if (found) return found;
    }
    return null;
  };

  const onDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type;
    if (type === "task") {
      const task = findTaskById(String(event.active.id));
      setActiveTask(task);
    } else if (type === "column") {
      setActiveColumnId(String(event.active.id));
    }
    useAppStore.getState().beginBatch();
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const store = useAppStore.getState();
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    if (activeType !== "task") return;

    const taskId = String(active.id);
    const task = store.data.tasks.find((x) => x.id === taskId);
    if (!task) return;

    if (overType === "task") {
      const overTaskId = String(over.id);
      const overTask = store.data.tasks.find((x) => x.id === overTaskId);
      if (!overTask) return;
      if (overTask.columnId !== task.columnId || overTask.id !== task.id) {
        store.moveTaskNear(taskId, overTaskId);
      }
    } else if (overType === "column") {
      const toColumnId = String(over.id);
      if (toColumnId !== task.columnId) {
        const count = store.data.tasks.filter((x) => x.columnId === toColumnId && x.id !== taskId).length;
        store.moveTask(taskId, toColumnId, count);
      }
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const store = useAppStore.getState();
    const activeType = active.data.current?.type;

    if (!over) {
      store.cancelBatch();
      setActiveTask(null);
      setActiveColumnId(null);
      return;
    }

    if (activeType === "task") {
      // Cross-column / near-placement handled during dragOver; same-column fine-tune here.
      const overType = over.data.current?.type;
      const taskId = String(active.id);
      if (overType === "task") {
        const overTaskId = String(over.id);
        if (overTaskId !== taskId) store.moveTaskNear(taskId, overTaskId);
      } else if (overType === "column") {
        const toColumnId = String(over.id);
        const count = store.data.tasks.filter((x) => x.columnId === toColumnId && x.id !== taskId).length;
        store.moveTask(taskId, toColumnId, count);
      }
    } else if (activeType === "column") {
      const fromIndex = columns.findIndex((c) => c.id === String(active.id));
      const toIndex = columns.findIndex((c) => c.id === String(over.id));
      if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
        store.moveColumnTo(String(active.id), toIndex);
      }
    }

    store.commitBatch();
    setActiveTask(null);
    setActiveColumnId(null);
  };

  const onDragCancel = () => {
    useAppStore.getState().cancelBatch();
    setActiveTask(null);
    setActiveColumnId(null);
  };

  return (
    <div className="min-h-0 flex-1" aria-label={t("a11y.columns")}>
      <DndContext
        sensors={dragEnabled ? sensors : []}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex h-full gap-3 overflow-x-auto overflow-y-hidden p-4 scrollbar-slim sm:p-5">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((col) => (
              <ColumnCard
                key={col.id}
                column={col}
                tasks={tasksByColumn.get(col.id) ?? []}
                board={board}
                dragEnabled={dragEnabled}
              />
            ))}
          </SortableContext>

          {/* Add column */}
          <div className="w-[280px] shrink-0">
            <Button
              variant="outline"
              onClick={() => useAppStore.getState().addColumn(board.id, t("col.newColumnName"))}
              className="h-auto w-full justify-start gap-2 border-dashed text-muted-foreground hover:text-foreground"
              aria-label={t("col.add")}
            >
              <Plus className="h-4 w-4" />
              {t("col.add")}
            </Button>
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
          {activeTask ? (
            <div className="w-[272px] rotate-1 opacity-95">
              <TaskCard task={activeTask} labels={board.labels} dragging overlay />
            </div>
          ) : activeColumnId ? (
            <div className="w-[280px] opacity-90">
              <ColumnCard
                column={columns.find((c) => c.id === activeColumnId) ?? columns[0]}
                tasks={tasksByColumn.get(activeColumnId) ?? []}
                board={board}
                dragEnabled={false}
                overlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {columns.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("board.noColumns")}</p>
        </div>
      )}

      {/* Hidden helper so the "new task" button is reachable via keyboard in kanban view too */}
      <button
        type="button"
        className="sr-only"
        onClick={() => setUI({ newTaskOpen: true })}
        aria-label={t("task.new")}
      />
    </div>
  );
}
