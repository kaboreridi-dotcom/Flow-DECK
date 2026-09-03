"use client";
// Flow DECK — productivity radar (attention sections for the active board)
import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/lib/kanban/store";
import { attentionScore } from "@/lib/kanban/stats";
import { DAY_MS, dueState, formatDueLabel } from "@/lib/kanban/datetime";
import { useI18n } from "@/lib/i18n/context";
import type { Priority, Task } from "@/lib/kanban/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#8b8b94",
  normal: "#2bd98a",
  high: "#f59e0b",
  urgent: "#ef4444",
};

type SectionKey =
  | "overdue"
  | "dueSoon"
  | "blocked"
  | "highPriority"
  | "recentModified"
  | "recentDone";

const SECTION_LIMIT = 8;

export default function FocusPanel() {
  const open = useAppStore((s) => s.ui.focusOpen);
  const setUI = useAppStore((s) => s.setUI);
  const data = useAppStore((s) => s.data);
  const { t, lang } = useI18n();

  const sections = useMemo(() => {
    const board = data.boards.find((b) => b.id === data.activeBoardId);
    if (!board) return null;
    const now = Date.now();
    const boardTasks = data.tasks.filter(
      (x) => x.boardId === board.id && !x.archived
    );

    const buckets: { key: SectionKey; items: Task[] }[] = [
      { key: "overdue", items: [] },
      { key: "dueSoon", items: [] },
      { key: "blocked", items: [] },
      { key: "highPriority", items: [] },
      { key: "recentModified", items: [] },
      { key: "recentDone", items: [] },
    ];
    const push = (key: SectionKey, task: Task) => {
      buckets.find((b) => b.key === key)?.items.push(task);
    };

    // First matching section wins → tasks are deduplicated across sections.
    for (const task of boardTasks) {
      const ds = dueState(task, now);
      if (ds === "overdue") {
        push("overdue", task);
      } else if (ds === "today" || ds === "soon") {
        push("dueSoon", task);
      } else if (task.blocked && task.status === "open") {
        push("blocked", task);
      } else if (
        (task.priority === "urgent" || task.priority === "high") &&
        task.status === "open"
      ) {
        push("highPriority", task);
      } else if (task.status === "open" && now - task.updatedAt <= 7 * DAY_MS) {
        push("recentModified", task);
      } else if (
        task.status === "done" &&
        task.completedAt != null &&
        now - task.completedAt <= 7 * DAY_MS
      ) {
        push("recentDone", task);
      }
    }

    return buckets.map((b) => ({
      ...b,
      items: [...b.items].sort((a, z) => attentionScore(z, now) - attentionScore(a, now)),
    }));
  }, [data.tasks, data.boards, data.activeBoardId]);

  const visibleSections = sections?.filter((s) => s.items.length > 0) ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => setUI({ focusOpen: o })}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold tracking-tight">
            {t("focus.title")}
          </DialogTitle>
          <DialogDescription>{t("focus.subtitle")}</DialogDescription>
        </DialogHeader>

        {!sections ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("focus.noBoard")}
          </p>
        ) : visibleSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center">
            <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
            <p className="max-w-xs text-sm font-medium">{t("focus.empty")}</p>
          </div>
        ) : (
          <div className="max-h-[65vh] space-y-6 overflow-y-auto scrollbar-slim pr-1">
            {visibleSections.map((section) => (
              <section key={section.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-kicker">{t(`focus.section.${section.key}`)}</p>
                  <Badge variant="secondary" className="px-1.5 text-[10px]">
                    {section.items.length}
                  </Badge>
                </div>
                <ul className="space-y-0.5">
                  {section.items.slice(0, SECTION_LIMIT).map((task) => {
                    const ds = dueState(task);
                    return (
                      <li
                        key={task.id}
                        className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-accent/40"
                      >
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                          aria-hidden="true"
                        />
                        <button
                          type="button"
                          onClick={() => setUI({ openTaskId: task.id, focusOpen: false })}
                          aria-label={t("focus.openTask", { title: task.title })}
                          className={cn(
                            "min-w-0 flex-1 truncate text-left text-sm transition-colors hover:text-primary",
                            task.status === "done" &&
                              "text-muted-foreground line-through decoration-border"
                          )}
                        >
                          {task.title}
                        </button>
                        {ds !== "none" && (
                          <span
                            className={cn(
                              "shrink-0 text-[11px] font-medium",
                              ds === "overdue" && "text-red-500",
                              ds === "today" && "text-amber-500",
                              ds === "soon" && "text-orange-400"
                            )}
                          >
                            {formatDueLabel(task.dueDate, lang, ds)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {section.items.length > SECTION_LIMIT && (
                  <span className="ml-1.5 inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t("task.overflow", { count: section.items.length - SECTION_LIMIT })}
                  </span>
                )}
              </section>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
