"use client";
// Flow DECK — smart views (done / overdue / due soon), built on the shared TaskRow
import { useMemo } from "react";
import { AlarmClock, CalendarClock, CheckCircle2 } from "lucide-react";
import { dueState } from "@/lib/kanban/datetime";
import { useI18n } from "@/lib/i18n/context";
import type { Column, Label, Task } from "@/lib/kanban/types";
import { TaskRow } from "./list-view";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SmartMode = "done" | "overdue" | "soon";

interface SmartMeta {
  icon: typeof CheckCircle2;
  title: string;
  subtitle: string;
  empty: string;
  tint: string;
}

export default function SmartViews({
  mode,
  tasks,
  columns: _columns,
  labels,
}: {
  mode: SmartMode;
  tasks: Task[];
  columns: Column[];
  labels: Label[];
}) {
  const { t } = useI18n();

  const filtered = useMemo(() => {
    if (mode === "done") {
      return tasks
        .filter((x) => x.status === "done")
        .sort(
          (a, b) =>
            (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt)
        );
    }
    const now = Date.now();
    return tasks
      .filter((x) => {
        const ds = dueState(x, now);
        return mode === "overdue" ? ds === "overdue" : ds === "today" || ds === "soon";
      })
      .sort((a, b) => (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity));
  }, [mode, tasks]);

  const meta: SmartMeta =
    mode === "done"
      ? {
          icon: CheckCircle2,
          title: t("views.smart.done.title"),
          subtitle: t("views.smart.done.subtitle"),
          empty: t("views.smart.done.empty"),
          tint: "text-white",
        }
      : mode === "overdue"
        ? {
            icon: AlarmClock,
            title: t("views.smart.overdue.title"),
            subtitle: t("views.smart.overdue.subtitle"),
            empty: t("views.smart.overdue.empty"),
            tint: "text-white",
          }
        : {
            icon: CalendarClock,
            title: t("views.smart.soon.title"),
            subtitle: t("views.smart.soon.subtitle"),
            empty: t("views.smart.soon.empty"),
            tint: "text-white",
          };

  const Icon = meta.icon;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="flex items-start justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flow-gradient flex size-9 shrink-0 items-center justify-center rounded-lg",
              meta.tint
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold tracking-tight">
              {meta.title}
            </h2>
            <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="mt-1 shrink-0">
          {t("views.count", { count: filtered.length })}
        </Badge>
      </div>

      {/* Task list / empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center">
          <Icon className="size-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="max-w-xs text-sm text-muted-foreground">{meta.empty}</p>
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto scrollbar-slim rounded-xl border bg-card py-1">
          {filtered.map((task) => (
            <TaskRow key={task.id} task={task} labels={labels} />
          ))}
        </div>
      )}
    </div>
  );
}
