"use client";
// Flow DECK — filter bar (popover with toggle chips, switches and reset)
import { useCallback, useMemo } from "react";
import { Filter, RotateCcw, X } from "lucide-react";
import { useAppStore } from "@/lib/kanban/store";
import { useI18n } from "@/lib/i18n/context";
import type { Column, DueState, Label, Priority } from "@/lib/kanban/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#8b8b94",
  normal: "#2bd98a",
  high: "#f59e0b",
  urgent: "#ef4444",
};

const DUE_CHIP_STATES: DueState[] = ["overdue", "today", "soon", "future"];
const STATUS_OPTIONS = ["all", "open", "done"] as const;
const PRIORITY_CHIPS: Priority[] = ["urgent", "high", "normal", "low"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "border-transparent flow-gradient text-white"
          : "bg-muted/40 text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="size-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function FilterBar({
  labels,
  columns,
}: {
  labels: Label[];
  columns: Column[];
}) {
  const filters = useAppStore((s) => s.ui.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const { t } = useI18n();

  const activeCount = useMemo(
    () =>
      (filters.priorities.length > 0 ? 1 : 0) +
      (filters.labelIds.length > 0 ? 1 : 0) +
      (filters.dueStates.length > 0 ? 1 : 0) +
      (filters.status !== "all" ? 1 : 0) +
      (filters.blockedOnly ? 1 : 0) +
      (filters.hasSubtasks ? 1 : 0) +
      (filters.noDueDate ? 1 : 0) +
      (filters.columnIds.length > 0 ? 1 : 0),
    [filters]
  );

  const togglePriority = useCallback(
    (p: Priority) => {
      setFilters({
        priorities: filters.priorities.includes(p)
          ? filters.priorities.filter((x) => x !== p)
          : [...filters.priorities, p],
      });
    },
    [filters.priorities, setFilters]
  );

  const toggleLabel = useCallback(
    (id: string) => {
      setFilters({
        labelIds: filters.labelIds.includes(id)
          ? filters.labelIds.filter((x) => x !== id)
          : [...filters.labelIds, id],
      });
    },
    [filters.labelIds, setFilters]
  );

  const toggleDue = useCallback(
    (d: DueState) => {
      setFilters({
        dueStates: filters.dueStates.includes(d)
          ? filters.dueStates.filter((x) => x !== d)
          : [...filters.dueStates, d],
      });
    },
    [filters.dueStates, setFilters]
  );

  const toggleColumn = useCallback(
    (id: string) => {
      setFilters({
        columnIds: filters.columnIds.includes(id)
          ? filters.columnIds.filter((x) => x !== id)
          : [...filters.columnIds, id],
      });
    },
    [filters.columnIds, setFilters]
  );

  return (
    <div className="flex items-center gap-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" aria-label={t("filter.label")}>
            <Filter className="size-4" aria-hidden="true" />
            {t("filter.label")}
            {activeCount > 0 && (
              <span className="flow-gradient ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4" align="start">
          <div className="max-h-[70vh] space-y-5 overflow-y-auto scrollbar-slim pr-1">
            {/* Status */}
            <section>
              <p className="text-kicker mb-2">{t("filter.status")}</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <Chip
                    key={s}
                    active={filters.status === s}
                    onClick={() => setFilters({ status: s })}
                  >
                    {t(`filter.status.${s}`)}
                  </Chip>
                ))}
              </div>
            </section>

            {/* Priority */}
            <section>
              <p className="text-kicker mb-2">{t("filter.priority")}</p>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_CHIPS.map((p) => (
                  <Chip
                    key={p}
                    active={filters.priorities.includes(p)}
                    onClick={() => togglePriority(p)}
                  >
                    <Dot color={PRIORITY_COLORS[p]} />
                    {t(`priority.${p}`)}
                  </Chip>
                ))}
              </div>
            </section>

            {/* Labels */}
            <section>
              <p className="text-kicker mb-2">{t("filter.labels")}</p>
              {labels.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("views.noLabels")}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((l) => (
                    <Chip
                      key={l.id}
                      active={filters.labelIds.includes(l.id)}
                      onClick={() => toggleLabel(l.id)}
                    >
                      <Dot color={l.color} />
                      {l.name}
                    </Chip>
                  ))}
                </div>
              )}
            </section>

            {/* Due */}
            <section>
              <p className="text-kicker mb-2">{t("filter.due")}</p>
              <div className="flex flex-wrap gap-1.5">
                {DUE_CHIP_STATES.map((d) => (
                  <Chip
                    key={d}
                    active={filters.dueStates.includes(d)}
                    onClick={() => toggleDue(d)}
                  >
                    {t(`due.${d}`)}
                  </Chip>
                ))}
                <Chip
                  active={filters.noDueDate}
                  onClick={() => setFilters({ noDueDate: !filters.noDueDate })}
                >
                  {t("due.none")}
                </Chip>
              </div>
            </section>

            {/* Columns */}
            {columns.length > 0 && (
              <section>
                <p className="text-kicker mb-2">{t("filter.column")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {columns.map((c) => (
                    <Chip
                      key={c.id}
                      active={filters.columnIds.includes(c.id)}
                      onClick={() => toggleColumn(c.id)}
                    >
                      {c.name}
                    </Chip>
                  ))}
                </div>
              </section>
            )}

            {/* Switches */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="filter-blocked" className="text-sm">
                  {t("filter.blockedOnly")}
                </label>
                <Switch
                  id="filter-blocked"
                  checked={filters.blockedOnly}
                  onCheckedChange={(v) => setFilters({ blockedOnly: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="filter-subtasks" className="text-sm">
                  {t("filter.hasSubtasks")}
                </label>
                <Switch
                  id="filter-subtasks"
                  checked={filters.hasSubtasks}
                  onCheckedChange={(v) => setFilters({ hasSubtasks: v })}
                />
              </div>
            </section>

            {/* Footer */}
            <div className="flex justify-end border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={activeCount === 0}
                onClick={resetFilters}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {t("filter.reset")}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t("filter.reset")}
          title={t("filter.reset")}
          onClick={resetFilters}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
