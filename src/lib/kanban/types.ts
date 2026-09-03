// Flow DECK — data model (versioned, extensible)

export type Priority = "low" | "normal" | "high" | "urgent";
export type TaskStatus = "open" | "done";
export type DueState = "none" | "overdue" | "today" | "soon" | "future";
export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "custom";
export type RecurrenceUnit = "days" | "weeks" | "months";
export type ViewMode = "kanban" | "list" | "done" | "overdue" | "soon";
export type SortKey =
  | "manual"
  | "created"
  | "modified"
  | "due"
  | "priority"
  | "title"
  | "progress"
  | "estimate";
export type SortDir = "asc" | "desc";
export type TrashType = "task" | "column" | "board";
export type Lang = "fr" | "en";

export interface Recurrence {
  freq: RecurrenceFreq;
  interval: number;
  unit?: RecurrenceUnit; // used when freq === "custom"
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  text: string;
  createdAt: number;
}

export interface TaskLink {
  id: string;
  url: string;
  title: string;
}

export interface TaskTimer {
  running: boolean;
  startedAt: number | null;
  accumulatedMs: number;
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  dueDate: number | null;
  priority: Priority;
  labelIds: string[];
  subtasks: Subtask[];
  comments: TaskComment[];
  links: TaskLink[];
  status: TaskStatus;
  blocked: boolean;
  estimateMinutes: number | null;
  spentMinutes: number;
  timer: TaskTimer;
  order: number;
  archived: boolean;
  recurrence: Recurrence | null;
  recurrenceOriginId: string | null;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
  taskLimit: number | null;
  archived: boolean;
  createdAt: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  order: number;
  archived: boolean;
  labels: Label[];
}

export interface TrashItem {
  id: string;
  type: TrashType;
  deletedAt: number;
  label: string;
  boardId?: string;
  columnId?: string;
  payloadBoard?: Board;
  payloadColumns?: Column[];
  payloadTasks?: Task[];
  payloadColumn?: Column;
  payloadTask?: Task;
}

export interface AppPreferences {
  view: ViewMode;
  sortKey: SortKey;
  sortDir: SortDir;
}

export interface AppData {
  version: number;
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  trash: TrashItem[];
  activeBoardId: string | null;
  prefs: AppPreferences;
}

export interface Snapshot {
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  trash: TrashItem[];
  activeBoardId: string | null;
}

export interface Filters {
  priorities: Priority[];
  labelIds: string[];
  dueStates: DueState[];
  status: "all" | "open" | "done";
  blockedOnly: boolean;
  hasSubtasks: boolean;
  noDueDate: boolean;
  columnIds: string[];
}

export const EMPTY_FILTERS: Filters = {
  priorities: [],
  labelIds: [],
  dueStates: [],
  status: "all",
  blockedOnly: false,
  hasSubtasks: false,
  noDueDate: false,
  columnIds: [],
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export const DATA_VERSION = 1;
