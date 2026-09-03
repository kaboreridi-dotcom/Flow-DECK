"use client";
// Flow DECK — list view (tasks grouped by column) + reusable TaskRow
import { useMemo } from "react";
import {
  Ban,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Link2,
  ListChecks,
  MessageSquare,
} from "lucide-react";
import { useAppStore } from "@/lib/kanban/store";
import { useI18n } from "@/lib/i18n/context";
import { dueState, formatDueLabel, formatDuration } from "@/lib/kanban/datetime";
import type { Column, DueState, Label, Task } from "@/lib/kanban/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  low: "#8b8b94",
  normal: "#2bd98a",
  high: "#f59e0b",
  urgent: "#ef4444",
};

function dueColorClass(state: DueState): string {
  if (state === "overdue") return "text-red-500";
  if (state === "today") return "text-amber-500";
  if (state === "soon") return "text-orange-400";
  return "text-muted-foreground";
}

export function TaskRow({ task, labels }: { task: Task; labels: Label[] }) {
  const setUI = useAppStore((s) => s.setUI);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const { t, lang } = useI18n();

  const isDone = task.status === "done";
  const ds = dueState(task);
  const doneSubs = task.subtasks.filter((s) => s.done).length;
  const taskLabels = labels.filter((l) => task.labelIds.includes(l.id));
  const shownLabels = taskLabels.slice(0, 3);
  const extraLabels = taskLabels.length - shownLabels.length;

  return (
    <div className="group flex w-full items-center gap-2 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/30">
      {/* Done toggle — kept outside the row button so the DOM stays valid */}
      <button
        type="button"
        aria-label={isDone ? t("task.reopen") : t("task.markDone")}
        onClick={(e) => {
          e.stopPropagation();
          toggleTaskDone(task.id);
        }}
        className={cn(
          "shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          isDone ? "text-primary" : "text-muted-foreground/50 hover:text-foreground"
        )}
      >
        {isDone ? (
          <CheckCircle2 className="size-[18px]" aria-hidden="true" />
        ) : (
          <Circle className="size-[18px]" aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setUI({ openTaskId: task.id })}
        aria-label={`${t("task.openDetails")}: ${task.title}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          title={t(`priority.${task.priority}`)}
          aria-hidden="true"
        />

        <span
          className={cn(
            "min-w-0 truncate text-sm",
            isDone && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </span>

        {task.blocked && (
          <span
            className="inline-flex shrink-0 items-center text-red-500"
            title={t("task.blocked")}
          >
            <Ban className="size-3.5" aria-hidden="true" />
            <span className="sr-only">{t("task.blocked")}</span>
          </span>
        )}

        {shownLabels.map((l) => (
          <span
            key={l.id}
            className="hidden shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex"
            title={l.name}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: l.color }}
              aria-hidden="true"
            />
            <span className="max-w-24 truncate">{l.name}</span>
          </span>
        ))}
        {extraLabels > 0 && (
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
            {t("task.overflow", { count: extraLabels })}
          </span>
        )}

        {task.subtasks.length > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-foreground"
            title={t("task.subtasksCount", { done: doneSubs, total: task.subtasks.length })}
          >
            <ListChecks className="size-3.5" aria-hidden="true" />
            {doneSubs}/{task.subtasks.length}
          </span>
        )}

        {task.comments.length > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-foreground"
            title={t("task.comments")}
          >
            <MessageSquare className="size-3.5" aria-hidden="true" />
            {task.comments.length}
          </span>
        )}

        {task.links.length > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-foreground"
            title={t("task.links")}
          >
            <Link2 className="size-3.5" aria-hidden="true" />
            {task.links.length}
          </span>
        )}

        <span className="ml-auto hidden shrink-0 items-center gap-2.5 sm:flex">
          {ds !== "none" && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium",
                dueColorClass(ds)
              )}
            >
              <Calendar className="size-3" aria-hidden="true" />
              {formatDueLabel(task.dueDate, lang, ds)}
            </span>
          )}
          {task.estimateMinutes != null && (
            <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              {formatDuration(task.estimateMinutes, lang)}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

export default function ListView({
  tasks,
  columns,
  labels,
}: {
  tasks: Task[];
  columns: Column[];
  labels: Label[];
}) {
  const { t } = useI18n();

  const groups = useMemo(
    () =>
      columns.map((column) => ({
        column,
        items: tasks.filter((x) => x.columnId === column.id),
      })),
    [columns, tasks]
  );

  return (
    <div className="space-y-6">
      {groups.map(({ column, items }) => (
        <section key={column.id} className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <h3 className="font-display text-sm font-semibold tracking-tight">
              {column.name}
            </h3>
            <Badge variant="secondary" className="text-[10px]">
              {items.length}
            </Badge>
            {column.taskLimit != null && column.taskLimit > 0 && (
              <Badge variant="outline" className="text-[10px] font-normal">
                {t("col.limitReached", { limit: column.taskLimit })}
              </Badge>
            )}
          </div>
          <div className="rounded-xl border bg-card py-1">
            {items.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-muted-foreground">
                {t("col.empty")}
              </p>
            ) : (
              items.map((task) => <TaskRow key={task.id} task={task} labels={labels} />)
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
