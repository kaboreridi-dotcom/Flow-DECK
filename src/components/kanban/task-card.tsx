"use client";
// Flow DECK — task card: sortable, compact info, quick actions
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Ban,
  Calendar,
  CheckCircle2,
  Circle,
  Link2,
  MessageSquare,
  Repeat,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";
import { taskProgress } from "@/lib/kanban/stats";
import { dueState, formatDueLabel } from "@/lib/kanban/datetime";
import type { Label, Task } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";

export const PRIORITY_COLORS: Record<Task["priority"], string> = {
  low: "#8b8b94",
  normal: "#2bd98a",
  high: "#f59e0b",
  urgent: "#ef4444",
};

export const DUE_COLORS: Record<string, string> = {
  overdue: "text-destructive",
  today: "text-amber-500",
  soon: "text-orange-400",
  future: "text-muted-foreground",
  none: "text-muted-foreground",
};

export function TaskCard({
  task,
  labels,
  disabled,
  dragging,
  overlay,
}: {
  task: Task;
  labels: Label[];
  disabled?: boolean;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const { t, lang } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task }, disabled: disabled || overlay });

  const taskLabels = labels.filter((l) => task.labelIds.includes(l.id));
  const ds = dueState(task);
  const progress = taskProgress(task);
  const subDone = task.subtasks.filter((s) => s.done).length;
  const timerRunning = task.timer.running;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging && !overlay ? 0.35 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`${t("a11y.taskCard")}: ${task.title}`}
      onClick={() => useAppStore.getState().setUI({ openTaskId: task.id })}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          useAppStore.getState().setUI({ openTaskId: task.id });
        }
      }}
      className={cn(
        "group relative cursor-grab rounded-xl border bg-card p-3 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        task.status === "done" && "opacity-70",
        dragging && "rotate-1 shadow-xl",
        overlay && "shadow-2xl",
        timerRunning && "flow-ring"
      )}
    >
      {/* Priority bar */}
      <span
        aria-hidden
        className="absolute inset-y-2 left-0 w-1 rounded-full"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />
      <span className="sr-only">{t(`priority.${task.priority}`)}</span>

      <div className="flex items-start gap-2 pl-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-1.5 -mt-1 h-6 w-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            useAppStore.getState().toggleTaskDone(task.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={task.status === "done" ? t("task.reopen") : t("task.markDone")}
        >
          {task.status === "done" ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/50" />
          )}
        </Button>
        <p
          className={cn(
            "line-clamp-2 flex-1 text-sm font-medium leading-snug",
            task.status === "done" && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-2.5">
        {taskLabels.slice(0, 3).map((l) => (
          <span
            key={l.id}
            className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name}
          </span>
        ))}
        {taskLabels.length > 3 && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {t("task.overflow", { count: taskLabels.length - 3 })}
          </span>
        )}
        {task.blocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
            <Ban className="h-2.5 w-2.5" />
            {t("task.blocked")}
          </span>
        )}
        {task.dueDate != null && ds !== "none" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
              DUE_COLORS[ds]
            )}
          >
            <Calendar className="h-2.5 w-2.5" />
            {formatDueLabel(task.dueDate, lang, ds)}
          </span>
        )}
        {task.recurrence && <Repeat className="h-3 w-3 text-muted-foreground" aria-label={t("task.recurrence")} />}
        {timerRunning && <Timer className="h-3 w-3 animate-flow-pulse text-primary" aria-label={t("task.timer")} />}
        {task.comments.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground" aria-label={t("task.comments")}>
            <MessageSquare className="h-2.5 w-2.5" />
            {task.comments.length}
          </span>
        )}
        {task.links.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground" aria-label={t("task.links")}>
            <Link2 className="h-2.5 w-2.5" />
            {task.links.length}
          </span>
        )}
        {task.estimateMinutes != null && (
          <span className="text-[10px] text-muted-foreground">
            ≈ {Math.round(task.estimateMinutes / 60) > 0 ? `${Math.round(task.estimateMinutes / 60)} h` : `${task.estimateMinutes} min`}
          </span>
        )}
      </div>

      {/* Subtask progress */}
      {task.subtasks.length > 0 && (
        <div className="mt-2 flex items-center gap-2 pl-2.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full flow-gradient transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
            {t("task.subtasksCount", { done: subDone, total: task.subtasks.length })}
          </span>
        </div>
      )}
    </div>
  );
}
