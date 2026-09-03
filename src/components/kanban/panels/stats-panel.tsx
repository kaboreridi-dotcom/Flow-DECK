"use client";
// Flow DECK — statistics dialog (board-level metrics)
import { useMemo } from "react";
import { CalendarClock, Hourglass, Timer } from "lucide-react";
import { useAppStore } from "@/lib/kanban/store";
import { computeBoardStats, selectBoardColumns } from "@/lib/kanban/stats";
import { formatDuration } from "@/lib/kanban/datetime";
import { useI18n } from "@/lib/i18n/context";
import type { AppData, Priority } from "@/lib/kanban/types";
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

const PRIORITY_BARS: Priority[] = ["urgent", "normal", "high", "low"];

function BarRow({
  label,
  count,
  denominator,
  color,
  dot,
}: {
  label: string;
  count: number;
  denominator: number;
  color: string;
  dot?: boolean;
}) {
  const pct = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex min-w-24 shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
        {dot && (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        )}
        <span className="truncate">{label}</span>
      </span>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
        role="presentation"
      >
        <div
          className="h-2 rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">
        {count}
      </span>
    </div>
  );
}

export default function StatsPanel() {
  const open = useAppStore((s) => s.ui.statsOpen);
  const setUI = useAppStore((s) => s.setUI);
  const tasks = useAppStore((s) => s.data.tasks);
  const columns = useAppStore((s) => s.data.columns);
  const boards = useAppStore((s) => s.data.boards);
  const activeBoardId = useAppStore((s) => s.data.activeBoardId);
  const { t, lang } = useI18n();

  const computed = useMemo(() => {
    const board = boards.find((b) => b.id === activeBoardId);
    if (!board) return null;
    // selectBoardColumns expects the full AppData shape — pass a minimal view.
    const dataView: AppData = {
      version: 1,
      boards,
      columns,
      tasks,
      trash: [],
      activeBoardId,
      prefs: { view: "kanban", sortKey: "manual", sortDir: "asc" },
    };
    const boardColumns = selectBoardColumns(dataView, activeBoardId);
    return { board, stats: computeBoardStats(board, boardColumns, tasks) };
  }, [tasks, columns, boards, activeBoardId]);

  const stats = computed?.stats;

  const tiles = stats
    ? [
        { label: t("stats.tile.total"), value: stats.total },
        { label: t("stats.tile.done"), value: stats.done },
        { label: t("stats.tile.open"), value: stats.open },
        { label: t("stats.tile.overdue"), value: stats.overdue, danger: stats.overdue > 0 },
        { label: t("stats.tile.blocked"), value: stats.blocked },
        { label: t("stats.tile.upcoming"), value: stats.today + stats.soon },
      ]
    : [];

  const maxPriority = stats
    ? Math.max(1, ...PRIORITY_BARS.map((p) => stats.byPriority[p]))
    : 1;
  const maxLabel = stats
    ? Math.max(1, ...stats.byLabel.map((l) => l.count))
    : 1;

  return (
    <Dialog open={open} onOpenChange={(o) => setUI({ statsOpen: o })}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold tracking-tight">
            {t("stats.title")}
          </DialogTitle>
          <DialogDescription>{t("stats.subtitle")}</DialogDescription>
        </DialogHeader>

        {!stats || !computed ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("stats.noBoard")}
          </p>
        ) : (
          <div className="max-h-[70vh] space-y-6 overflow-y-auto scrollbar-slim pr-1">
            {/* Completion header */}
            <section className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-kicker">{t("stats.completion")}</p>
                  <h3 className="truncate font-display text-base font-semibold">
                    {computed.board.name}
                  </h3>
                </div>
                <span className="flow-gradient-text font-display text-2xl font-bold tabular-nums">
                  {stats.completionRate}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="flow-gradient h-3 rounded-full transition-[width] duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </section>

            {/* Stat tiles */}
            <section
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              aria-label={t("stats.title")}
            >
              {tiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-xl border bg-card px-3.5 py-3"
                >
                  <p
                    className={cn(
                      "font-display text-2xl font-bold tabular-nums",
                      tile.danger && "text-red-500"
                    )}
                  >
                    {tile.value}
                  </p>
                  <p className="text-kicker mt-0.5">{tile.label}</p>
                </div>
              ))}
            </section>

            {/* By priority */}
            <section className="space-y-2.5">
              <p className="text-kicker">{t("stats.byPriority")}</p>
              <div className="space-y-2">
                {PRIORITY_BARS.map((p) => (
                  <BarRow
                    key={p}
                    label={t(`priority.${p}`)}
                    count={stats.byPriority[p]}
                    denominator={maxPriority}
                    color={PRIORITY_COLORS[p]}
                  />
                ))}
              </div>
            </section>

            {/* By label */}
            <section className="space-y-2.5">
              <p className="text-kicker">{t("stats.byLabel")}</p>
              {stats.byLabel.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("stats.noLabels")}</p>
              ) : (
                <div className="space-y-2">
                  {stats.byLabel.map((label) => (
                    <BarRow
                      key={label.id}
                      label={label.name}
                      count={label.count}
                      denominator={maxLabel}
                      color={label.color}
                      dot
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Subtask progress */}
            <section className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-kicker">{t("stats.subtaskProgress")}</p>
                <span className="font-display text-sm font-semibold tabular-nums">
                  {stats.avgSubtaskProgress}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="flow-gradient h-2 rounded-full transition-[width] duration-500"
                  style={{ width: `${stats.avgSubtaskProgress}%` }}
                />
              </div>
            </section>

            {/* Time */}
            <section className="space-y-2.5">
              <p className="text-kicker">{t("stats.time")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="size-4 shrink-0" aria-hidden="true" />
                    {t("stats.estimated")}
                  </span>
                  <span className="font-display text-sm font-semibold tabular-nums">
                    {formatDuration(stats.totalEstimate, lang)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Hourglass className="size-4 shrink-0" aria-hidden="true" />
                    {t("stats.spent")}
                  </span>
                  <span className="font-display text-sm font-semibold tabular-nums">
                    {formatDuration(stats.totalSpent, lang)}
                  </span>
                </div>
              </div>
              {stats.today + stats.soon > 0 && (
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
                  {t("stats.tile.upcoming")} : {stats.today + stats.soon}
                </p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
