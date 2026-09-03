// Flow DECK — date/time helpers
import type { DueState, Lang, Task } from "./types";
import { addDays, addWeeks, addMonths, isSameDay, differenceInCalendarDays } from "date-fns";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Normalized due state of a task. */
export function dueState(task: Pick<Task, "dueDate" | "status">, now: number = Date.now()): DueState {
  if (!task.dueDate) return "none";
  if (task.status === "done") return "none";
  const due = new Date(task.dueDate);
  const today = new Date(now);
  const days = differenceInCalendarDays(due, today);
  if (days < 0) return "overdue";
  if (days === 0 || isSameDay(due, today)) return "today";
  if (days <= 3) return "soon";
  return "future";
}

export function isOverdue(task: Pick<Task, "dueDate" | "status">, now: number = Date.now()): boolean {
  return dueState(task, now) === "overdue";
}

const LOCALES: Record<Lang, string> = { fr: "fr-FR", en: "en-US" };

export function formatDate(ts: number | null | undefined, lang: Lang): string {
  if (!ts) return "";
  return new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short", year: "numeric" }).format(ts);
}

export function formatDateTime(ts: number | null | undefined, lang: Lang): string {
  if (!ts) return "";
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);
}

export function formatDueLabel(due: number | null, lang: Lang, state: DueState): string {
  if (due == null) return "";
  const d = new Date(due);
  const today = new Date();
  const days = differenceInCalendarDays(d, today);
  if (state === "today") return lang === "fr" ? "Aujourd'hui" : "Today";
  if (state === "overdue") {
    const n = Math.abs(days);
    if (n === 1) return lang === "fr" ? "Hier" : "Yesterday";
    return lang === "fr" ? `Il y a ${n} j` : `${n}d ago`;
  }
  if (state === "soon" && days === 1) return lang === "fr" ? "Demain" : "Tomorrow";
  if (days > 0 && days <= 6) {
    return new Intl.DateTimeFormat(LOCALES[lang], { weekday: "long" }).format(d);
  }
  const sameYear = d.getFullYear() === today.getFullYear();
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(d);
}

/** Format minutes as a compact duration, e.g. 2h 05 or 45 min. */
export function formatDuration(minutes: number | null | undefined, lang: Lang): string {
  if (minutes == null || Number.isNaN(minutes)) return "";
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const sep = lang === "fr" ? "h" : "h";
  return m === 0 ? `${h}${sep === "h" ? " h" : "h"}` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** Format elapsed milliseconds for the timer (hh:mm:ss). */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function currentTimerMs(task: Pick<Task, "timer">, now: number = Date.now()): number {
  const t = task.timer;
  if (!t) return 0;
  return t.accumulatedMs + (t.running && t.startedAt ? Math.max(0, now - t.startedAt) : 0);
}

/** Compute the next occurrence timestamp for a recurrence. */
export function nextRecurrenceDate(
  freq: "daily" | "weekly" | "monthly" | "custom",
  interval: number,
  unit: "days" | "weeks" | "months" | undefined,
  base: number,
  now: number
): number {
  const from = base && base > now ? new Date(base) : new Date(now);
  const n = Math.max(1, Math.floor(interval) || 1);
  switch (freq) {
    case "daily":
      return addDays(from, n).getTime();
    case "weekly":
      return addWeeks(from, n).getTime();
    case "monthly":
      return addMonths(from, n).getTime();
    case "custom": {
      if (unit === "weeks") return addWeeks(from, n).getTime();
      if (unit === "months") return addMonths(from, n).getTime();
      return addDays(from, n).getTime();
    }
  }
}

export function toDateInputValue(ts: number | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateInputValue(v: string): number | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
}
