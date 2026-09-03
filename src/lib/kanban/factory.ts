// Flow DECK — factories & identity helpers
import type {
  Board,
  Column,
  Label,
  Priority,
  Recurrence,
  Subtask,
  Task,
  TaskComment,
  TaskLink,
} from "./types";

export function uid(prefix = ""): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${raw}` : raw;
}

export interface NewTaskInput {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  dueDate?: number | null;
  priority?: Priority;
  labelIds?: string[];
  order?: number;
  recurrence?: Recurrence | null;
  estimateMinutes?: number | null;
}

export function createTask(input: NewTaskInput): Task {
  const now = Date.now();
  return {
    id: uid("t"),
    boardId: input.boardId,
    columnId: input.columnId,
    title: input.title.trim(),
    description: input.description ?? "",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    dueDate: input.dueDate ?? null,
    priority: input.priority ?? "normal",
    labelIds: input.labelIds ? [...input.labelIds] : [],
    subtasks: [],
    comments: [],
    links: [],
    status: "open",
    blocked: false,
    estimateMinutes: input.estimateMinutes ?? null,
    spentMinutes: 0,
    timer: { running: false, startedAt: null, accumulatedMs: 0 },
    order: input.order ?? 0,
    archived: false,
    recurrence: input.recurrence ?? null,
    recurrenceOriginId: null,
  };
}

export function createColumn(boardId: string, name: string, order: number): Column {
  return {
    id: uid("c"),
    boardId,
    name,
    order,
    taskLimit: null,
    archived: false,
    createdAt: Date.now(),
  };
}

export function createBoard(name: string, description = "", order = 0): Board {
  const now = Date.now();
  return {
    id: uid("b"),
    name: name.trim() || "Board",
    description,
    createdAt: now,
    updatedAt: now,
    order,
    archived: false,
    labels: [],
  };
}

export function createLabel(name: string, color: string): Label {
  return { id: uid("l"), name: name.trim(), color };
}

export function createSubtask(title: string): Subtask {
  return { id: uid("s"), title: title.trim(), done: false };
}

export function createComment(text: string): TaskComment {
  return { id: uid("cm"), text: text.trim(), createdAt: Date.now() };
}

export function createLink(url: string, title?: string): TaskLink {
  return { id: uid("k"), url: url.trim(), title: (title ?? url).trim() };
}

/** Deep clone helpers — duplicated entities must never share mutable structures. */
export function cloneTask(t: Task): Task {
  return {
    ...t,
    labelIds: [...t.labelIds],
    subtasks: t.subtasks.map((s) => ({ ...s })),
    comments: t.comments.map((c) => ({ ...c })),
    links: t.links.map((l) => ({ ...l })),
    timer: { ...t.timer },
    recurrence: t.recurrence ? { ...t.recurrence } : null,
  };
}

export const DEFAULT_COLUMN_NAMES = ["todo", "inprogress", "done"] as const;
