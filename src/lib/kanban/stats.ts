// Flow DECK — derived data: search, filters, sort, statistics
import type {
  AppData,
  Board,
  Column,
  Filters,
  Priority,
  SortDir,
  SortKey,
  Task,
} from "./types";
import { PRIORITY_ORDER } from "./types";
import { dueState } from "./datetime";

export function taskProgress(task: Task): number {
  if (task.status === "done") return 100;
  if (task.subtasks.length === 0) return 0;
  const done = task.subtasks.filter((s) => s.done).length;
  return Math.round((done / task.subtasks.length) * 100);
}

export function searchTask(task: Task, labels: { id: string; name: string }[], q: string): boolean {
  const needle = q.toLowerCase();
  if (task.title.toLowerCase().includes(needle)) return true;
  if (task.description.toLowerCase().includes(needle)) return true;
  if (task.subtasks.some((s) => s.title.toLowerCase().includes(needle))) return true;
  if (task.comments.some((c) => c.text.toLowerCase().includes(needle))) return true;
  if (task.links.some((l) => l.title.toLowerCase().includes(needle) || l.url.toLowerCase().includes(needle))) return true;
  if (labels.some((l) => task.labelIds.includes(l.id) && l.name.toLowerCase().includes(needle))) return true;
  return false;
}

export function getTaskMatchesQuery(task: Task, boardLabels: { id: string; name: string }[], q: string): boolean {
  if (!q.trim()) return true;
  return searchTask(task, boardLabels, q.trim());
}

export function filterTask(task: Task, filters: Filters, boardLabels: { id: string; name: string }[]): boolean {
  if (filters.status === "open" && task.status !== "open") return false;
  if (filters.status === "done" && task.status !== "done") return false;
  if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
  if (filters.labelIds.length > 0 && !filters.labelIds.some((id) => task.labelIds.includes(id))) return false;
  if (filters.blockedOnly && !task.blocked) return false;
  if (filters.hasSubtasks && task.subtasks.length === 0) return false;
  if (filters.noDueDate && task.dueDate != null) return false;
  if (filters.columnIds.length > 0 && !filters.columnIds.includes(task.columnId)) return false;
  if (filters.dueStates.length > 0) {
    const ds = dueState(task);
    if (!filters.dueStates.includes(ds)) return false;
  }
  return true;
}

export function sortTasks(tasks: Task[], key: SortKey, dir: SortDir): Task[] {
  const arr = [...tasks];
  const mul = dir === "asc" ? 1 : -1;
  switch (key) {
    case "created":
      return arr.sort((a, b) => (a.createdAt - b.createdAt) * mul);
    case "modified":
      return arr.sort((a, b) => (a.updatedAt - b.updatedAt) * mul);
    case "due":
      return arr.sort((a, b) => ((a.dueDate ?? Infinity) - (b.dueDate ?? Infinity)) * mul);
    case "priority":
      return arr.sort((a, b) => (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * mul);
    case "title":
      return arr.sort((a, b) => a.title.localeCompare(b.title) * mul);
    case "progress":
      return arr.sort((a, b) => (taskProgress(a) - taskProgress(b)) * mul);
    case "estimate":
      return arr.sort((a, b) => ((a.estimateMinutes ?? Infinity) - (b.estimateMinutes ?? Infinity)) * mul);
    default:
      return arr.sort((a, b) => (a.order - b.order) * (dir === "desc" ? -1 : 1));
  }
}

export interface BoardStats {
  total: number;
  done: number;
  open: number;
  overdue: number;
  today: number;
  soon: number;
  blocked: number;
  completionRate: number;
  byPriority: Record<Priority, number>;
  byLabel: { id: string; name: string; color: string; count: number }[];
  avgSubtaskProgress: number;
  totalEstimate: number; // minutes
  totalSpent: number; // minutes
  archivedTasks: number;
}

export function computeBoardStats(
  board: Board | undefined,
  columns: Column[],
  tasks: Task[]
): BoardStats {
  const boardTasks = board ? tasks.filter((t) => t.boardId === board.id && !t.archived) : [];
  const now = Date.now();
  const stats: BoardStats = {
    total: boardTasks.length,
    done: 0,
    open: 0,
    overdue: 0,
    today: 0,
    soon: 0,
    blocked: 0,
    completionRate: 0,
    byPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
    byLabel: [],
    avgSubtaskProgress: 0,
    totalEstimate: 0,
    totalSpent: 0,
    archivedTasks: 0,
  };
  let subtaskTasks = 0;
  let progressSum = 0;
  for (const t of boardTasks) {
    if (t.status === "done") stats.done += 1;
    else stats.open += 1;
    const ds = dueState(t, now);
    if (ds === "overdue") stats.overdue += 1;
    if (ds === "today") stats.today += 1;
    if (ds === "soon") stats.soon += 1;
    if (t.blocked && t.status !== "done") stats.blocked += 1;
    stats.byPriority[t.priority] += 1;
    if (t.subtasks.length > 0) {
      subtaskTasks += 1;
      progressSum += taskProgress(t);
    }
    if (t.estimateMinutes != null) stats.totalEstimate += t.estimateMinutes;
    stats.totalSpent += t.spentMinutes;
  }
  const archived = board ? tasks.filter((t) => t.boardId === board.id && t.archived).length : 0;
  stats.archivedTasks = archived;
  stats.completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  stats.avgSubtaskProgress = subtaskTasks > 0 ? Math.round(progressSum / subtaskTasks) : 0;
  if (board) {
    stats.byLabel = board.labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      count: boardTasks.filter((t) => t.labelIds.includes(l.id)).length,
    }));
  }
  return stats;
}

/** Composite "needs attention" score for the productivity panel. */
export function attentionScore(t: Task, now: number = Date.now()): number {
  let score = 0;
  const ds = dueState(t, now);
  if (ds === "overdue") score += 4;
  else if (ds === "today") score += 2;
  else if (ds === "soon") score += 1;
  if (t.blocked) score += 3;
  if (t.priority === "urgent") score += 2;
  else if (t.priority === "high") score += 1;
  if (t.status === "open" && now - t.updatedAt > 7 * 24 * 3600 * 1000) score += 1;
  return score;
}

export function selectBoardColumns(data: AppData, boardId: string | null): Column[] {
  if (!boardId) return [];
  return data.columns
    .filter((c) => c.boardId === boardId && !c.archived)
    .sort((a, b) => a.order - b.order);
}

export function selectBoardTasks(data: AppData, boardId: string | null): Task[] {
  if (!boardId) return [];
  return data.tasks.filter((t) => t.boardId === boardId && !t.archived);
}

export function findTask(data: AppData, id: string | null): Task | undefined {
  if (!id) return undefined;
  return data.tasks.find((t) => t.id === id);
}
