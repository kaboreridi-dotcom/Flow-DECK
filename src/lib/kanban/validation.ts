// Flow DECK — validation, sanitization & migration
// All persisted/imported data passes through here before touching the store.
import type {
  AppData,
  Board,
  Column,
  Label,
  Priority,
  Recurrence,
  Subtask,
  Task,
  TaskComment,
  TaskLink,
  TrashItem,
  ViewMode,
  SortKey,
  SortDir,
} from "./types";
import { DATA_VERSION, EMPTY_FILTERS } from "./types";
import { uid } from "./factory";

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asNumber(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asTs(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback;
}
function asTsOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];
function asPriority(v: unknown): Priority {
  return PRIORITIES.includes(v as Priority) ? (v as Priority) : "normal";
}

export function sanitizeLabel(v: unknown): Label | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const name = asString(o.name).trim();
  if (!name) return null;
  return {
    id: asString(o.id) || uid("l"),
    name,
    color: /^#[0-9a-fA-F]{3,8}$/.test(asString(o.color)) ? asString(o.color) : "#6B7280",
  };
}

export function sanitizeSubtask(v: unknown): Subtask | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const title = asString(o.title).trim();
  if (!title) return null;
  return { id: asString(o.id) || uid("s"), title, done: asBool(o.done) };
}

export function sanitizeComment(v: unknown): TaskComment | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const text = asString(o.text).trim();
  if (!text) return null;
  return { id: asString(o.id) || uid("cm"), text, createdAt: asTs(o.createdAt, Date.now()) };
}

export function sanitizeLink(v: unknown): TaskLink | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const url = asString(o.url).trim();
  if (!url) return null;
  return { id: asString(o.id) || uid("k"), url, title: asString(o.title) || url };
}

export function sanitizeRecurrence(v: unknown): Recurrence | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const freq = ["daily", "weekly", "monthly", "custom"].includes(asString(o.freq))
    ? (asString(o.freq) as Recurrence["freq"])
    : null;
  if (!freq) return null;
  const unit = ["days", "weeks", "months"].includes(asString(o.unit))
    ? (asString(o.unit) as Recurrence["unit"])
    : "days";
  return { freq, interval: Math.max(1, Math.floor(asNumber(o.interval, 1))), unit };
}

export function sanitizeTask(v: unknown): Task | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const title = asString(o.title).trim();
  if (!title) return null;
  const timer = (o.timer ?? {}) as Record<string, unknown>;
  return {
    id: asString(o.id) || uid("t"),
    boardId: asString(o.boardId),
    columnId: asString(o.columnId),
    title,
    description: asString(o.description),
    createdAt: asTs(o.createdAt, Date.now()),
    updatedAt: asTs(o.updatedAt, asTs(o.createdAt, Date.now())),
    completedAt: asTsOrNull(o.completedAt),
    dueDate: asTsOrNull(o.dueDate),
    priority: asPriority(o.priority),
    labelIds: asArray(o.labelIds).filter((x): x is string => typeof x === "string"),
    subtasks: asArray(o.subtasks).map(sanitizeSubtask).filter((x): x is Subtask => x !== null),
    comments: asArray(o.comments).map(sanitizeComment).filter((x): x is TaskComment => x !== null),
    links: asArray(o.links).map(sanitizeLink).filter((x): x is TaskLink => x !== null),
    status: o.status === "done" ? "done" : "open",
    blocked: asBool(o.blocked),
    estimateMinutes: asTsOrNull(o.estimateMinutes),
    spentMinutes: Math.max(0, asNumber(o.spentMinutes, 0)),
    timer: {
      running: asBool(timer.running) && typeof timer.startedAt === "number",
      startedAt: asTsOrNull(timer.startedAt),
      accumulatedMs: Math.max(0, asNumber(timer.accumulatedMs, 0)),
    },
    order: asNumber(o.order, 0),
    archived: asBool(o.archived),
    recurrence: sanitizeRecurrence(o.recurrence),
    recurrenceOriginId: asString(o.recurrenceOriginId) || null,
  };
}

export function sanitizeColumn(v: unknown): Column | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const name = asString(o.name).trim();
  if (!name) return null;
  return {
    id: asString(o.id) || uid("c"),
    boardId: asString(o.boardId),
    name,
    order: asNumber(o.order, 0),
    taskLimit: asTsOrNull(o.taskLimit),
    archived: asBool(o.archived),
    createdAt: asTs(o.createdAt, Date.now()),
  };
}

export function sanitizeBoard(v: unknown): Board | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const name = asString(o.name).trim();
  if (!name) return null;
  return {
    id: asString(o.id) || uid("b"),
    name,
    description: asString(o.description),
    createdAt: asTs(o.createdAt, Date.now()),
    updatedAt: asTs(o.updatedAt, Date.now()),
    order: asNumber(o.order, 0),
    archived: asBool(o.archived),
    labels: asArray(o.labels).map(sanitizeLabel).filter((x): x is Label => x !== null),
  };
}

export function sanitizeTrashItem(v: unknown): TrashItem | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const type = ["task", "column", "board"].includes(asString(o.type)) ? (asString(o.type) as TrashItem["type"]) : null;
  if (!type) return null;
  const item: TrashItem = {
    id: asString(o.id) || uid("x"),
    type,
    deletedAt: asTs(o.deletedAt, Date.now()),
    label: asString(o.label, "?"),
  };
  if (type === "task") {
    const t = sanitizeTask(o.payloadTask);
    if (!t) return null;
    item.payloadTask = t;
    item.boardId = asString(o.boardId) || t.boardId;
    item.columnId = asString(o.columnId) || t.columnId;
  } else if (type === "column") {
    const c = sanitizeColumn(o.payloadColumn);
    if (!c) return null;
    item.payloadColumn = c;
    item.boardId = asString(o.boardId) || c.boardId;
    item.columnId = c.id;
    item.payloadTasks = asArray(o.payloadTasks).map(sanitizeTask).filter((x): x is Task => x !== null);
  } else {
    const b = sanitizeBoard(o.payloadBoard);
    if (!b) return null;
    item.payloadBoard = b;
    item.boardId = b.id;
    item.payloadColumns = asArray(o.payloadColumns).map(sanitizeColumn).filter((x): x is Column => x !== null);
    item.payloadTasks = asArray(o.payloadTasks).map(sanitizeTask).filter((x): x is Task => x !== null);
  }
  return item;
}

const VIEWS: ViewMode[] = ["kanban", "list", "done", "overdue", "soon"];
const SORT_KEYS: SortKey[] = ["manual", "created", "modified", "due", "priority", "title", "progress", "estimate"];

/** Repairs + normalizes an AppData-like structure. Returns null when hopeless. */
export function sanitizeAppData(raw: unknown): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const boards = asArray(o.boards).map(sanitizeBoard).filter((x): x is Board => x !== null);
  const columns = asArray(o.columns).map(sanitizeColumn).filter((x): x is Column => x !== null);
  const tasks = asArray(o.tasks).map(sanitizeTask).filter((x): x is Task => x !== null);

  // Repair relations: drop orphans.
  const boardIds = new Set(boards.map((b) => b.id));
  const keptColumns = columns.filter((c) => boardIds.has(c.boardId));
  const columnIds = new Set(keptColumns.map((c) => c.id));
  const keptTasks = tasks.filter((t) => boardIds.has(t.boardId) && columnIds.has(t.columnId));

  // Repair orders & uniqueness of ids.
  for (const b of boards) {
    const seen = new Set<string>();
    b.labels = b.labels.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));
  }
  const colOrderCount = new Map<string, number>();
  for (const c of keptColumns) {
    const boardCols = keptColumns.filter((x) => x.boardId === c.boardId).sort((a, b2) => a.order - b2.order);
    if (!colOrderCount.has(c.boardId)) {
      boardCols.forEach((cc, i) => (cc.order = i));
      colOrderCount.set(c.boardId, boardCols.length);
    }
  }
  for (const b of boards) {
    if (!keptColumns.some((c) => c.boardId === b.id)) {
      // Board without columns: give it default columns so it stays usable.
      const names = ["À faire", "En cours", "Terminé"];
      names.forEach((n, i) => keptColumns.push({ ...createFallbackColumn(b.id, n, i) }));
    }
  }
  const taskOrderCount = new Map<string, number>();
  const sortedTasks = [...keptTasks].sort((a, b2) => a.order - b2.order);
  for (const t of sortedTasks) {
    const key = t.columnId;
    t.order = taskOrderCount.get(key) ?? 0;
    taskOrderCount.set(key, (taskOrderCount.get(key) ?? 0) + 1);
  }

  // Trash must not contain items whose payload id now collides with live data.
  const trash = asArray(o.trash).map(sanitizeTrashItem).filter((x): x is TrashItem => x !== null);

  const activeBoardId =
    typeof o.activeBoardId === "string" && boardIds.has(o.activeBoardId)
      ? o.activeBoardId
      : boards.find((b) => !b.archived)?.id ?? null;

  const prefsRaw = (o.prefs ?? {}) as Record<string, unknown>;
  const prefs = {
    view: VIEWS.includes(prefsRaw.view as ViewMode) ? (prefsRaw.view as ViewMode) : "kanban",
    sortKey: SORT_KEYS.includes(prefsRaw.sortKey as SortKey) ? (prefsRaw.sortKey as SortKey) : "manual",
    sortDir: prefsRaw.sortDir === "desc" ? ("desc" as SortDir) : ("asc" as SortDir),
  };

  const migrated = migrate({ version: asNumber(o.version, 1), boards, columns: keptColumns, tasks: sortedTasks, trash, activeBoardId, prefs });
  return migrated;
}

function createFallbackColumn(boardId: string, name: string, order: number): Column {
  return { id: uid("c"), boardId, name, order, taskLimit: null, archived: false, createdAt: Date.now() };
}

/** Migration chain — future versions transform older payloads forward. */
export function migrate(data: AppData): AppData {
  let d = { ...data, version: asNumber(data.version, 1) };
  // v1 → v2 placeholder: keep structure stable, normalize prefs/filters.
  if (d.version < DATA_VERSION) {
    d = { ...d, version: DATA_VERSION };
  }
  if (!d.prefs) d.prefs = { view: "kanban", sortKey: "manual", sortDir: "asc" };
  if (!d.trash) d.trash = [];
  return d;
}

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    boards: [],
    columns: [],
    tasks: [],
    trash: [],
    activeBoardId: null,
    prefs: { view: "kanban", sortKey: "manual", sortDir: "asc" },
  };
}

export { EMPTY_FILTERS };

// ---- Import validation ----

export interface ImportPayload {
  type: "board" | "workspace";
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  appName: string;
  version: number;
}

/** Validates a Flow DECK export file (board or full workspace). */
export function parseImportFile(raw: unknown): { ok: true; payload: ImportPayload } | { ok: false; error: "format" | "empty" } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "format" };
  const o = raw as Record<string, unknown>;
  const app = asString(o.app);
  const type = o.type === "board" ? "board" : o.type === "workspace" ? "workspace" : null;
  if (!type || (app && !app.toLowerCase().includes("flow"))) {
    // Accept files missing the app marker but carrying a valid structure.
    if (!type) return { ok: false, error: "format" };
  }
  const boards = asArray(o.boards ?? o.board).map(sanitizeBoard).filter((x): x is Board => x !== null);
  if (boards.length === 0) return { ok: false, error: "empty" };
  const boardIds = new Set(boards.map((b) => b.id));
  const columns = asArray(o.columns).map(sanitizeColumn).filter((x): x is Column => x !== null && boardIds.has(x.boardId));
  const columnIds = new Set(columns.map((c) => c.id));
  const tasks = asArray(o.tasks).map(sanitizeTask).filter((x): x is Task => x !== null && boardIds.has(x.boardId) && columnIds.has(x.columnId));
  if (boards.some((b) => !columns.some((c) => c.boardId === b.id))) {
    return { ok: false, error: "empty" };
  }
  return {
    ok: true,
    payload: {
      type,
      boards,
      columns,
      tasks,
      appName: app || "Flow DECK",
      version: asNumber(o.version, 1),
    },
  };
}
