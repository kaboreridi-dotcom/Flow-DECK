"use client";
// Flow DECK — central store (zustand) with undo/redo, trash, import/export
import { create } from "zustand";
import type {
  AppData,
  Board,
  Column,
  Filters,
  Label,
  Priority,
  Recurrence,
  Snapshot,
  SortDir,
  SortKey,
  Subtask,
  Task,
  TrashItem,
  ViewMode,
} from "./types";
import { EMPTY_FILTERS } from "./types";
import {
  cloneTask,
  createBoard,
  createColumn,
  createLabel,
  createSubtask,
  createTask,
  uid,
} from "./factory";
import { loadData, saveData, detectBrowserLang } from "./storage";
import { emptyData, sanitizeAppData } from "./validation";
import { nextRecurrenceDate } from "./datetime";
import { messages, type Lang } from "@/lib/i18n/translations";

export interface UIState {
  view: ViewMode;
  search: string;
  globalSearchOpen: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  filters: Filters;
  openTaskId: string | null;
  sidebarOpen: boolean;
  statsOpen: boolean;
  archiveOpen: boolean;
  trashOpen: boolean;
  templatesOpen: boolean;
  importExportOpen: boolean;
  shortcutsOpen: boolean;
  focusOpen: boolean;
  newTaskOpen: boolean;
  settingsOpen: boolean;
}

export interface BoardStructureSpec {
  name: string;
  description?: string;
  columns: string[];
  labels?: { name: string; color: string }[];
  tasks?: { title: string; description?: string; columnIndex: number; priority?: Priority }[];
}

export interface ImportSummary {
  added: number;
  replaced: number;
  skipped: number;
}

interface AppStore {
  data: AppData;
  ui: UIState;
  hydrated: boolean;
  past: Snapshot[];
  future: Snapshot[];
  _batching: boolean;
  _batchSnapshot: Snapshot | null;

  hydrate: () => void;

  setUI: (patch: Partial<UIState>) => void;
  setSearch: (q: string) => void;
  setView: (v: ViewMode) => void;
  setSort: (key: SortKey, dir?: SortDir) => void;
  toggleSortDir: () => void;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;

  // boards
  createBoard: (opts?: { name?: string; description?: string; templateId?: string }) => string | null;
  createBoardWithStructure: (spec: BoardStructureSpec) => string;
  updateBoard: (id: string, patch: Partial<Pick<Board, "name" | "description">>) => void;
  duplicateBoard: (id: string) => void;
  deleteBoard: (id: string) => void;
  resetBoard: (id: string) => void;
  setActiveBoard: (id: string) => void;
  moveBoardTo: (id: string, toIndex: number) => void;
  archiveBoard: (id: string) => void;
  unarchiveBoard: (id: string) => void;

  // columns
  addColumn: (boardId: string, name: string) => void;
  updateColumn: (id: string, patch: Partial<Pick<Column, "name" | "taskLimit">>) => void;
  deleteColumn: (id: string, mode: "move" | "archive" | "delete", targetColumnId?: string) => void;
  duplicateColumn: (id: string) => void;
  moveColumnTo: (id: string, toIndex: number) => void;
  archiveColumn: (id: string) => void;
  unarchiveColumn: (id: string) => void;

  // tasks
  addTask: (input: {
    columnId: string;
    title: string;
    description?: string;
    dueDate?: number | null;
    priority?: Priority;
    labelIds?: string[];
    estimateMinutes?: number | null;
  }) => string | null;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  archiveTask: (id: string) => void;
  unarchiveTask: (id: string) => void;
  moveTask: (taskId: string, toColumnId: string, toIndex: number) => void;
  moveTaskNear: (taskId: string, targetTaskId: string) => void;
  toggleTaskDone: (id: string) => void;
  toggleTaskBlocked: (id: string) => void;

  // subtasks
  addSubtask: (taskId: string, title: string) => void;
  updateSubtask: (taskId: string, subId: string, patch: Partial<Subtask>) => void;
  deleteSubtask: (taskId: string, subId: string) => void;
  moveSubtask: (taskId: string, subId: string, dir: -1 | 1) => void;

  // comments & links
  addComment: (taskId: string, text: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  addLink: (taskId: string, url: string) => void;
  deleteLink: (taskId: string, linkId: string) => void;

  // timer
  startTimer: (taskId: string) => void;
  pauseTimer: (taskId: string) => void;
  logTimer: (taskId: string) => void;
  clearTimer: (taskId: string) => void;

  // labels
  addLabel: (boardId: string, name: string, color: string) => string | null;
  updateLabel: (boardId: string, labelId: string, patch: Partial<Label>) => void;
  deleteLabel: (boardId: string, labelId: string) => void;
  toggleTaskLabel: (taskId: string, labelId: string) => void;

  // recurrence
  setRecurrence: (taskId: string, recurrence: Recurrence | null) => void;

  // trash
  restoreFromTrash: (itemId: string) => void;
  purgeTrashItem: (itemId: string) => void;
  emptyTrash: () => void;

  // history
  undo: () => void;
  redo: () => void;
  beginBatch: () => void;
  commitBatch: () => void;
  cancelBatch: () => void;

  // import
  importBoards: (payload: {
    boards: Board[];
    columns: Column[];
    tasks: Task[];
  }, mode: "replace" | "copy") => ImportSummary;
  replaceAllData: (data: AppData) => void;
}

const MAX_HISTORY = 60;

function snapshotOf(d: AppData): Snapshot {
  return {
    boards: d.boards,
    columns: d.columns,
    tasks: d.tasks,
    trash: d.trash,
    activeBoardId: d.activeBoardId,
  };
}

function defaultColumnsFor(boardId: string, names: string[]): Column[] {
  return names.map((n, i) => createColumn(boardId, n, i));
}

function seedWelcomeBoard(lang: Lang): AppData {
  const t = (k: string) => messages[lang][k] ?? k;
  const board = createBoard(t("seed.board.name"), t("seed.board.desc"), 0);
  const cols = defaultColumnsFor(board.id, [t("col.todo"), t("col.inprogress"), t("col.done")]);
  const welcome = createTask({
    boardId: board.id,
    columnId: cols[0].id,
    title: t("seed.task.title"),
    description: t("seed.task.desc"),
    priority: "normal",
  });
  const done1 = createTask({ boardId: board.id, columnId: cols[2].id, title: t("seed.task2.title") });
  done1.status = "done";
  done1.completedAt = Date.now();
  return {
    ...emptyData(),
    boards: [board],
    columns: cols,
    tasks: [welcome, done1],
    activeBoardId: board.id,
  };
}

function nextOrder(tasks: Task[], columnId: string): number {
  return tasks.filter((t) => t.columnId === columnId).reduce((m, t) => Math.max(m, t.order + 1), 0);
}

/** Re-number tasks of a column to 0..n-1 (keeps index === order invariant). */
function renumberColumn(tasks: Task[], columnId: string): Task[] {
  const col = tasks.filter((t) => t.columnId === columnId).sort((a, b) => a.order - b.order);
  const orderMap = new Map(col.map((t, i) => [t.id, i]));
  return tasks.map((t) => (orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) ?? t.order } : t));
}

export function buildBoardExport(data: AppData, boardId: string | null) {
  const board = data.boards.find((b) => b.id === boardId);
  if (!board) return null;
  const columns = data.columns.filter((c) => c.boardId === boardId);
  const columnIds = new Set(columns.map((c) => c.id));
  const tasks = data.tasks.filter((t) => t.boardId === boardId && columnIds.has(t.columnId));
  return {
    app: "Flow DECK",
    type: "board",
    version: data.version,
    exportedAt: new Date().toISOString(),
    boards: [board],
    columns,
    tasks,
  };
}

export function buildWorkspaceExport(data: AppData) {
  return {
    app: "Flow DECK",
    type: "workspace",
    version: data.version,
    exportedAt: new Date().toISOString(),
    boards: data.boards,
    columns: data.columns,
    tasks: data.tasks,
  };
}

export const useAppStore = create<AppStore>((set, get) => {
  const pushHistory = () => {
    const s = get();
    if (s._batching) return;
    const snap = snapshotOf(s.data);
    set({ past: [...s.past.slice(-MAX_HISTORY + 1), snap], future: [] });
  };

  const applyData = (mutator: (d: AppData) => AppData, touchBoards = false) => {
    const s = get();
    const now = Date.now();
    let d = mutator(s.data);
    if (touchBoards && d.activeBoardId) {
      d = {
        ...d,
        boards: d.boards.map((b) => (b.id === d.activeBoardId ? { ...b, updatedAt: now } : b)),
      };
    }
    set({ data: d });
    saveData(d);
  };

  const withTask = (id: string, mutator: (t: Task) => Task, touch = true) => {
    applyData((d) => {
      const now = Date.now();
      return {
        ...d,
        tasks: d.tasks.map((t) => (t.id === id ? { ...mutator(t), updatedAt: touch ? now : t.updatedAt } : t)),
      };
    }, touch);
  };

  return {
    data: emptyData(),
    ui: {
      view: "kanban",
      search: "",
      globalSearchOpen: false,
      sortKey: "manual",
      sortDir: "asc",
      filters: EMPTY_FILTERS,
      openTaskId: null,
      sidebarOpen: false,
      statsOpen: false,
      archiveOpen: false,
      trashOpen: false,
      templatesOpen: false,
      importExportOpen: false,
      shortcutsOpen: false,
      focusOpen: false,
      newTaskOpen: false,
      settingsOpen: false,
    },
    hydrated: false,
    past: [],
    future: [],
    _batching: false,
    _batchSnapshot: null,

    hydrate: () => {
      if (get().hydrated) return;
      const { data, corrupted } = loadData();
      let d: AppData;
      if (data) {
        d = data;
      } else {
        const lang: Lang = detectBrowserLang();
        d = seedWelcomeBoard(lang);
        saveData(d, true);
      }
      set({
        data: d,
        hydrated: true,
        ui: {
          ...get().ui,
          view: d.prefs?.view ?? "kanban",
          sortKey: d.prefs?.sortKey ?? "manual",
          sortDir: d.prefs?.sortDir ?? "asc",
        },
      });
      if (corrupted) {
        window.dispatchEvent(new CustomEvent("flowdeck:corrupted"));
      }
    },

    setUI: (patch) => {
      set({ ui: { ...get().ui, ...patch } });
      const ui = get().ui;
      if (patch.view || patch.sortKey || patch.sortDir) {
        const d = { ...get().data, prefs: { view: ui.view, sortKey: ui.sortKey, sortDir: ui.sortDir } };
        set({ data: d });
        saveData(d);
      }
    },
    setSearch: (q) => set({ ui: { ...get().ui, search: q } }),
    setView: (v) => get().setUI({ view: v }),
    setSort: (key, dir) =>
      get().setUI({ sortKey: key, sortDir: dir ?? get().ui.sortDir }),
    toggleSortDir: () => get().setUI({ sortDir: get().ui.sortDir === "asc" ? "desc" : "asc" }),
    setFilters: (patch) => set({ ui: { ...get().ui, filters: { ...get().ui.filters, ...patch } } }),
    resetFilters: () => set({ ui: { ...get().ui, filters: { ...EMPTY_FILTERS } } }),

    // ---------- boards ----------
    createBoard: (opts) => {
      const lang: Lang = detectBrowserLang();
      const t = (k: string) => messages[lang][k] ?? k;
      const name = opts?.name?.trim() || t("board.new");
      const board = createBoard(name, opts?.description ?? "", get().data.boards.length);
      const cols = defaultColumnsFor(board.id, [t("col.todo"), t("col.inprogress"), t("col.done")]);
      pushHistory();
      applyData((d) => ({
        ...d,
        boards: [...d.boards, board],
        columns: [...d.columns, ...cols],
        activeBoardId: board.id,
      }));
      return board.id;
    },

    createBoardWithStructure: (spec) => {
      const board = createBoard(spec.name, spec.description ?? "", get().data.boards.length);
      const cols = spec.columns.map((n, i) => createColumn(board.id, n, i));
      const labels: Label[] = (spec.labels ?? []).map((l) => createLabel(l.name, l.color));
      board.labels = labels;
      const orderCounter = new Map<string, number>();
      const tasks: Task[] = (spec.tasks ?? []).map((spec2) => {
        const col = cols[Math.min(Math.max(0, spec2.columnIndex), cols.length - 1)];
        const order = orderCounter.get(col.id) ?? 0;
        orderCounter.set(col.id, order + 1);
        return createTask({
          boardId: board.id,
          columnId: col.id,
          title: spec2.title,
          description: spec2.description,
          priority: spec2.priority,
          order,
        });
      });
      pushHistory();
      applyData((d) => ({
        ...d,
        boards: [...d.boards, board],
        columns: [...d.columns, ...cols],
        tasks: [...d.tasks, ...tasks],
        activeBoardId: board.id,
      }));
      return board.id;
    },

    updateBoard: (id, patch) => {
      pushHistory();
      applyData((d) => ({
        ...d,
        boards: d.boards.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b)),
      }));
    },

    duplicateBoard: (id) => {
      const s = get();
      const src = s.data.boards.find((b) => b.id === id);
      if (!src) return;
      const copy = { ...src, id: uid("b"), name: `${src.name} (2)`, createdAt: Date.now(), updatedAt: Date.now() };
      const colMap = new Map<string, string>();
      const cols: Column[] = s.data.columns
        .filter((c) => c.boardId === id)
        .map((c) => {
          const nid = uid("c");
          colMap.set(c.id, nid);
          return { ...c, id: nid, boardId: copy.id, createdAt: Date.now() };
        });
      const tasks = s.data.tasks
        .filter((t) => t.boardId === id)
        .map((t) => {
          const c = cloneTask(t);
          c.id = uid("t");
          c.boardId = copy.id;
          c.columnId = colMap.get(t.columnId) ?? cols[0]?.id ?? "";
          return c;
        });
      pushHistory();
      applyData((d) => ({
        ...d,
        boards: [...d.boards, copy],
        columns: [...d.columns, ...cols],
        tasks: [...d.tasks, ...tasks],
        activeBoardId: copy.id,
      }));
    },

    deleteBoard: (id) => {
      const s = get();
      const board = s.data.boards.find((b) => b.id === id);
      if (!board) return;
      const cols = s.data.columns.filter((c) => c.boardId === id);
      const tasks = s.data.tasks.filter((t) => t.boardId === id);
      const item: TrashItem = {
        id: uid("x"),
        type: "board",
        deletedAt: Date.now(),
        label: board.name,
        boardId: board.id,
        payloadBoard: board,
        payloadColumns: cols,
        payloadTasks: tasks,
      };
      pushHistory();
      applyData((d) => {
        const remaining = d.boards.filter((b) => b.id !== id);
        const nextActive =
          d.activeBoardId === id ? remaining.find((b) => !b.archived)?.id ?? null : d.activeBoardId;
        return {
          ...d,
          boards: remaining,
          columns: d.columns.filter((c) => c.boardId !== id),
          tasks: d.tasks.filter((t) => t.boardId !== id),
          trash: [...d.trash, item],
          activeBoardId: nextActive,
        };
      });
    },

    resetBoard: (id) => {
      const s = get();
      const board = s.data.boards.find((b) => b.id === id);
      if (!board) return;
      const cols = s.data.columns.filter((c) => c.boardId === id);
      const tasks = s.data.tasks.filter((t) => t.boardId === id);
      const lang: Lang = detectBrowserLang();
      const t = (k: string) => messages[lang][k] ?? k;
      const items: TrashItem[] = [
        ...tasks.map((task) => ({
          id: uid("x"),
          type: "task" as const,
          deletedAt: Date.now(),
          label: task.title,
          boardId: id,
          columnId: task.columnId,
          payloadTask: task,
        })),
        ...cols.map((c) => ({
          id: uid("x"),
          type: "column" as const,
          deletedAt: Date.now(),
          label: c.name,
          boardId: id,
          columnId: c.id,
          payloadColumn: c,
          payloadTasks: [],
        })),
      ];
      const fresh = defaultColumnsFor(id, [t("col.todo"), t("col.inprogress"), t("col.done")]);
      pushHistory();
      applyData((d) => ({
        ...d,
        columns: [...d.columns.filter((c) => c.boardId !== id), ...fresh],
        tasks: d.tasks.filter((t2) => t2.boardId !== id),
        trash: [...d.trash, ...items],
      }));
    },

    setActiveBoard: (id) => {
      applyData((d) => ({ ...d, activeBoardId: id }), false);
      get().setSearch("");
    },

    moveBoardTo: (id, toIndex) => {
      pushHistory();
      applyData((d) => {
        const sorted = [...d.boards].sort((a, b) => a.order - b.order);
        const from = sorted.findIndex((b) => b.id === id);
        if (from < 0) return d;
        const clamped = Math.max(0, Math.min(toIndex, sorted.length - 1));
        if (clamped === from) return d;
        const [moved] = sorted.splice(from, 1);
        sorted.splice(clamped, 0, moved);
        const orderMap = new Map(sorted.map((b, i) => [b.id, i]));
        return { ...d, boards: d.boards.map((b) => ({ ...b, order: orderMap.get(b.id) ?? b.order })) };
      });
    },

    archiveBoard: (id) => {
      pushHistory();
      applyData((d) => {
        const boards = d.boards.map((b) => (b.id === id ? { ...b, archived: true } : b));
        const nextActive =
          d.activeBoardId === id
            ? boards.find((b) => b.id !== id && !b.archived)?.id ?? null
            : d.activeBoardId;
        return { ...d, boards, activeBoardId: nextActive };
      });
    },

    unarchiveBoard: (id) => {
      pushHistory();
      applyData((d) => ({
        ...d,
        boards: d.boards.map((b) => (b.id === id ? { ...b, archived: false } : b)),
      }));
    },

    // ---------- columns ----------
    addColumn: (boardId, name) => {
      const order = get().data.columns.filter((c) => c.boardId === boardId).length;
      const col = createColumn(boardId, name.trim() || "?", order);
      pushHistory();
      applyData((d) => ({ ...d, columns: [...d.columns, col] }), true);
    },

    updateColumn: (id, patch) => {
      pushHistory();
      applyData((d) => ({
        ...d,
        columns: d.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },

    deleteColumn: (id, mode, targetColumnId) => {
      const s = get();
      const col = s.data.columns.find((c) => c.id === id);
      if (!col) return;
      const colTasks = s.data.tasks.filter((t) => t.columnId === id);
      pushHistory();
      applyData((d) => {
        let tasks = d.tasks;
        let trash = d.trash;
        if (mode === "move" && targetColumnId) {
          const base = tasks.filter((t) => t.columnId === targetColumnId).length;
          tasks = tasks.map((t) =>
            t.columnId === id ? { ...t, columnId: targetColumnId, order: base + t.order, updatedAt: Date.now() } : t
          );
        } else if (mode === "archive") {
          tasks = tasks.map((t) => (t.columnId === id ? { ...t, archived: true } : t));
        } else {
          trash = [
            ...trash,
            ...colTasks.map((t) => ({
              id: uid("x"),
              type: "task" as const,
              deletedAt: Date.now(),
              label: t.title,
              boardId: t.boardId,
              columnId: t.columnId,
              payloadTask: t,
            })),
          ];
          tasks = tasks.filter((t) => t.columnId !== id);
        }
        return {
          ...d,
          columns: d.columns.filter((c) => c.id !== id).map((c) => (c.boardId === col.boardId && c.order > col.order ? { ...c, order: c.order - 1 } : c)),
          tasks,
          trash,
        };
      });
    },

    duplicateColumn: (id) => {
      const s = get();
      const col = s.data.columns.find((c) => c.id === id);
      if (!col) return;
      const copy: Column = { ...col, id: uid("c"), name: `${col.name} (2)`, createdAt: Date.now() };
      const tasks = s.data.tasks
        .filter((t) => t.columnId === id)
        .map((t) => {
          const c = cloneTask(t);
          c.id = uid("t");
          c.columnId = copy.id;
          return c;
        });
      pushHistory();
      applyData((d) => ({
        ...d,
        columns: [...d.columns.map((c) => (c.boardId === col.boardId && c.order > col.order ? { ...c, order: c.order + 1 } : c)), copy],
        tasks: [...d.tasks, ...tasks],
      }));
    },

    moveColumnTo: (id, toIndex) => {
      pushHistory();
      applyData((d) => {
        const col = d.columns.find((c) => c.id === id);
        if (!col) return d;
        const sorted = d.columns.filter((c) => c.boardId === col.boardId).sort((a, b) => a.order - b.order);
        const from = sorted.findIndex((c) => c.id === id);
        const clamped = Math.max(0, Math.min(toIndex, sorted.length - 1));
        if (from < 0 || clamped === from) return d;
        const [moved] = sorted.splice(from, 1);
        sorted.splice(clamped, 0, moved);
        const orderMap = new Map(sorted.map((c, i) => [c.id, i]));
        return {
          ...d,
          columns: d.columns.map((c) => (orderMap.has(c.id) ? { ...c, order: orderMap.get(c.id) ?? c.order } : c)),
        };
      });
    },

    archiveColumn: (id) => {
      pushHistory();
      applyData((d) => ({
        ...d,
        columns: d.columns.map((c) => (c.id === id ? { ...c, archived: true } : c)),
      }));
    },

    unarchiveColumn: (id) => {
      pushHistory();
      applyData((d) => {
        const col = d.columns.find((c) => c.id === id);
        if (!col) return d;
        const order = d.columns.filter((c) => c.boardId === col.boardId && !c.archived).length;
        return {
          ...d,
          columns: d.columns.map((c) => (c.id === id ? { ...c, archived: false, order } : c)),
        };
      });
    },

    // ---------- tasks ----------
    addTask: (input) => {
      const col = get().data.columns.find((c) => c.id === input.columnId);
      if (!col) return null;
      const task = createTask({
        boardId: col.boardId,
        columnId: col.id,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate ?? null,
        priority: input.priority,
        labelIds: input.labelIds,
        estimateMinutes: input.estimateMinutes ?? null,
        order: nextOrder(get().data.tasks, col.id),
      });
      pushHistory();
      applyData((d) => ({ ...d, tasks: [...d.tasks, task] }), true);
      return task.id;
    },

    updateTask: (id, patch) => withTask(id, (t) => ({ ...t, ...patch })),

    deleteTask: (id) => {
      const s = get();
      const task = s.data.tasks.find((t) => t.id === id);
      if (!task) return;
      const item: TrashItem = {
        id: uid("x"),
        type: "task",
        deletedAt: Date.now(),
        label: task.title,
        boardId: task.boardId,
        columnId: task.columnId,
        payloadTask: task,
      };
      pushHistory();
      applyData((d) => ({
        ...d,
        tasks: renumberColumn(d.tasks.filter((t) => t.id !== id), task.columnId),
        trash: [...d.trash, item],
      }));
    },

    duplicateTask: (id) => {
      const s = get();
      const src = s.data.tasks.find((t) => t.id === id);
      if (!src) return;
      const copy = cloneTask(src);
      copy.id = uid("t");
      copy.title = `${src.title} (2)`;
      copy.createdAt = Date.now();
      copy.updatedAt = Date.now();
      copy.completedAt = null;
      copy.status = "open";
      copy.timer = { running: false, startedAt: null, accumulatedMs: 0 };
      copy.order = nextOrder(s.data.tasks, src.columnId);
      pushHistory();
      applyData((d) => ({ ...d, tasks: [...d.tasks, copy] }));
    },

    archiveTask: (id) => {
      const task = get().data.tasks.find((t) => t.id === id);
      pushHistory();
      applyData((d) => ({
        ...d,
        tasks: task ? renumberColumn(d.tasks.map((t) => (t.id === id ? { ...t, archived: true, updatedAt: Date.now() } : t)), task.columnId) : d.tasks,
      }));
    },

    unarchiveTask: (id) => {
      pushHistory();
      applyData((d) => ({
        ...d,
        tasks: d.tasks.map((t) => (t.id === id ? { ...t, archived: false, updatedAt: Date.now() } : t)),
      }));
    },

    moveTask: (taskId, toColumnId, toIndex) => {
      applyData((d) => {
        const task = d.tasks.find((t) => t.id === taskId);
        if (!task) return d;
        const fromColumn = task.columnId;
        if (fromColumn === toColumnId) {
          const colTasks = d.tasks
            .filter((t) => t.columnId === toColumnId)
            .sort((a, b) => a.order - b.order);
          const from = colTasks.findIndex((t) => t.id === taskId);
          const clamped = Math.max(0, Math.min(toIndex, colTasks.length - 1));
          if (from < 0 || clamped === from) return d;
          const [moved] = colTasks.splice(from, 1);
          colTasks.splice(clamped, 0, moved);
          const orderMap = new Map(colTasks.map((t, i) => [t.id, i]));
          return {
            ...d,
            tasks: d.tasks.map((t) => (orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) ?? t.order } : t)),
          };
        }
        const targetTasks = d.tasks
          .filter((t) => t.columnId === toColumnId && t.id !== taskId)
          .sort((a, b) => a.order - b.order);
        const clamped = Math.max(0, Math.min(toIndex, targetTasks.length));
        const [moved] = targetTasks.splice(clamped, 0, { ...task, columnId: toColumnId });
        const orderMap = new Map(targetTasks.map((t, i) => [t.id, i]));
        const sourceRest = d.tasks
          .filter((t) => t.columnId === fromColumn && t.id !== taskId)
          .sort((a, b) => a.order - b.order);
        const sourceOrderMap = new Map(sourceRest.map((t, i) => [t.id, i]));
        return {
          ...d,
          tasks: d.tasks.map((t) => {
            if (t.id === taskId) return { ...task, columnId: toColumnId, order: orderMap.get(taskId) ?? 0, updatedAt: Date.now() };
            if (t.columnId === toColumnId && orderMap.has(t.id)) return { ...t, order: orderMap.get(t.id) ?? t.order };
            if (t.columnId === fromColumn && sourceOrderMap.has(t.id)) return { ...t, order: sourceOrderMap.get(t.id) ?? t.order };
            return t;
          }),
        };
      });
    },

    moveTaskNear: (taskId, targetTaskId) => {
      const s = get();
      const task = s.data.tasks.find((t) => t.id === taskId);
      const target = s.data.tasks.find((t) => t.id === targetTaskId);
      if (!task || !target || task.id === target.id) return;
      const list = s.data.tasks
        .filter((t) => t.columnId === target.columnId)
        .sort((a, b) => a.order - b.order);
      if (target.columnId === task.columnId) {
        const idx = list.findIndex((t) => t.id === target.id); // list includes dragged task
        if (idx >= 0) get().moveTask(taskId, target.columnId, idx);
      } else {
        const idx = list.filter((t) => t.id !== taskId).findIndex((t) => t.id === target.id);
        get().moveTask(taskId, target.columnId, idx < 0 ? list.length : idx);
      }
    },

    toggleTaskDone: (id) => {
      const s = get();
      const task = s.data.tasks.find((t) => t.id === id);
      if (!task) return;
      const becomingDone = task.status !== "done";
      pushHistory();
      applyData((d) => {
        const now = Date.now();
        let tasks = d.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status: becomingDone ? ("done" as const) : ("open" as const),
                completedAt: becomingDone ? now : null,
                updatedAt: now,
                timer: t.timer.running && becomingDone ? { ...t.timer, running: false, startedAt: null, accumulatedMs: t.timer.accumulatedMs + (t.timer.startedAt ? now - t.timer.startedAt : 0) } : t.timer,
              }
            : t
        );
        // Recurrence: create the next occurrence when completing a recurring task.
        if (becomingDone && task.recurrence) {
          const alreadyHasNext = tasks.some(
            (t) => t.recurrenceOriginId === task.id && t.status === "open" && !t.archived
          );
          if (!alreadyHasNext) {
            const next = cloneTask(task);
            next.id = uid("t");
            next.recurrenceOriginId = task.id;
            next.status = "open";
            next.completedAt = null;
            next.createdAt = now;
            next.updatedAt = now;
            next.dueDate = nextRecurrenceDate(
              task.recurrence.freq,
              task.recurrence.interval,
              task.recurrence.unit,
              task.dueDate ?? now,
              now
            );
            next.subtasks = task.subtasks.map((st) => ({ ...st, done: false }));
            next.comments = [];
            next.spentMinutes = 0;
            next.timer = { running: false, startedAt: null, accumulatedMs: 0 };
            next.order = -1; // top of column
            const colTasks = tasks.filter((t) => t.columnId === next.columnId).map((t) => ({ ...t, order: t.order + 1 }));
            const colSet = new Set(colTasks.map((t) => t.id));
            tasks = tasks.map((t) => (colSet.has(t.id) ? colTasks.find((ct) => ct.id === t.id)! : t));
            tasks = [...tasks, next];
          }
        }
        return { ...d, tasks };
      }, true);
    },

    toggleTaskBlocked: (id) =>
      withTask(id, (t) => ({ ...t, blocked: !t.blocked })),

    // ---------- subtasks ----------
    addSubtask: (taskId, title) => {
      if (!title.trim()) return;
      withTask(taskId, (t) => ({ ...t, subtasks: [...t.subtasks, createSubtask(title)] }));
    },
    updateSubtask: (taskId, subId, patch) =>
      withTask(taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, ...patch } : s)),
      })),
    deleteSubtask: (taskId, subId) =>
      withTask(taskId, (t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) })),
    moveSubtask: (taskId, subId, dir) =>
      withTask(taskId, (t) => {
        const idx = t.subtasks.findIndex((s) => s.id === subId);
        const to = idx + dir;
        if (idx < 0 || to < 0 || to >= t.subtasks.length) return t;
        const arr = [...t.subtasks];
        [arr[idx], arr[to]] = [arr[to], arr[idx]];
        return { ...t, subtasks: arr };
      }),

    // ---------- comments & links ----------
    addComment: (taskId, text) => {
      if (!text.trim()) return;
      withTask(taskId, (t) => ({
        ...t,
        comments: [{ id: uid("cm"), text: text.trim(), createdAt: Date.now() }, ...t.comments],
      }));
    },
    deleteComment: (taskId, commentId) =>
      withTask(taskId, (t) => ({ ...t, comments: t.comments.filter((c) => c.id !== commentId) })),
    addLink: (taskId, url) => {
      const clean = url.trim();
      if (!clean) return;
      const withProto = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
      withTask(taskId, (t) => ({
        ...t,
        links: [...t.links, { id: uid("k"), url: withProto, title: clean }],
      }));
    },
    deleteLink: (taskId, linkId) =>
      withTask(taskId, (t) => ({ ...t, links: t.links.filter((l) => l.id !== linkId) })),

    // ---------- timer ----------
    startTimer: (taskId) =>
      withTask(taskId, (t) => ({ ...t, timer: { ...t.timer, running: true, startedAt: Date.now() } }), false),
    pauseTimer: (taskId) =>
      withTask(taskId, (t) => {
        const now = Date.now();
        const extra = t.timer.running && t.timer.startedAt ? now - t.timer.startedAt : 0;
        return {
          ...t,
          timer: { running: false, startedAt: null, accumulatedMs: t.timer.accumulatedMs + extra },
        };
      }, false),
    logTimer: (taskId) =>
      withTask(taskId, (t) => {
        const now = Date.now();
        const elapsed = t.timer.accumulatedMs + (t.timer.running && t.timer.startedAt ? now - t.timer.startedAt : 0);
        return {
          ...t,
          spentMinutes: t.spentMinutes + Math.round(elapsed / 60000),
          timer: { running: false, startedAt: null, accumulatedMs: 0 },
        };
      }, false),
    clearTimer: (taskId) =>
      withTask(taskId, (t) => ({ ...t, timer: { running: false, startedAt: null, accumulatedMs: 0 } }), false),

    // ---------- labels ----------
    addLabel: (boardId, name, color) => {
      if (!name.trim()) return null;
      const label = createLabel(name, color);
      pushHistory();
      applyData((d) => ({
        ...d,
        boards: d.boards.map((b) => (b.id === boardId ? { ...b, labels: [...b.labels, label] } : b)),
      }));
      return label.id;
    },
    updateLabel: (boardId, labelId, patch) => {
      pushHistory();
      applyData((d) => ({
        ...d,
        boards: d.boards.map((b) =>
          b.id === boardId
            ? { ...b, labels: b.labels.map((l) => (l.id === labelId ? { ...l, ...patch } : l)) }
            : b
        ),
      }));
    },
    deleteLabel: (boardId, labelId) => {
      pushHistory();
      applyData((d) => ({
        ...d,
        boards: d.boards.map((b) =>
          b.id === boardId ? { ...b, labels: b.labels.filter((l) => l.id !== labelId) } : b
        ),
        tasks: d.tasks.map((t) =>
          t.boardId === boardId ? { ...t, labelIds: t.labelIds.filter((id) => id !== labelId) } : t
        ),
      }));
    },
    toggleTaskLabel: (taskId, labelId) =>
      withTask(taskId, (t) => ({
        ...t,
        labelIds: t.labelIds.includes(labelId)
          ? t.labelIds.filter((id) => id !== labelId)
          : [...t.labelIds, labelId],
      })),

    // ---------- recurrence ----------
    setRecurrence: (taskId, recurrence) =>
      withTask(taskId, (t) => ({ ...t, recurrence })),

    // ---------- trash ----------
    restoreFromTrash: (itemId) => {
      const s = get();
      const item = s.data.trash.find((x) => x.id === itemId);
      if (!item) return;
      pushHistory();
      applyData((d) => {
        let nd = { ...d, trash: d.trash.filter((x) => x.id !== itemId) };
        const ensureId = <T extends { id: string }>(obj: T, existing: Set<string>): T => {
          if (existing.has(obj.id)) {
            return { ...obj, id: uid(obj.id[0]) } as T;
          }
          return obj;
        };
        if (item.type === "task" && item.payloadTask) {
          let task = cloneTask(item.payloadTask);
          task.archived = false;
          const columnExists = nd.columns.some((c) => c.id === task.columnId);
          const boardExists = nd.boards.some((b) => b.id === task.boardId);
          if (!boardExists || !columnExists) {
            const fallbackBoard = nd.boards.find((b) => b.id === d.activeBoardId) ?? nd.boards[0];
            if (!fallbackBoard) return d;
            const fallbackCol = nd.columns
              .filter((c) => c.boardId === fallbackBoard.id && !c.archived)
              .sort((a, b) => a.order - b.order)[0];
            if (!fallbackCol) return d;
            task = { ...task, boardId: fallbackBoard.id, columnId: fallbackCol.id };
          }
          const ids = new Set(nd.tasks.map((t) => t.id));
          task = ensureId(task, ids);
          task.order = nextOrder(nd.tasks, task.columnId);
          nd = { ...nd, tasks: [...nd.tasks, task] };
        } else if (item.type === "column" && item.payloadColumn) {
          let col = { ...item.payloadColumn, archived: false };
          const boardExists = nd.boards.some((b) => b.id === col.boardId);
          if (!boardExists) {
            const fallback = nd.boards.find((b) => b.id === d.activeBoardId) ?? nd.boards[0];
            if (!fallback) return d;
            col = { ...col, boardId: fallback.id };
          }
          const ids = new Set(nd.columns.map((c) => c.id));
          col = ensureId(col, ids);
          col.order = nd.columns.filter((c) => c.boardId === col.boardId && !c.archived).length;
          const colIds = new Set(nd.columns.map((c) => c.id));
          colIds.add(col.id);
          const restoredTasks = (item.payloadTasks ?? []).map((t) => {
            const c = cloneTask(t);
            c.archived = false;
            c.columnId = col.id;
            return c;
          });
          nd = { ...nd, columns: [...nd.columns, col], tasks: [...nd.tasks, ...restoredTasks] };
        } else if (item.type === "board" && item.payloadBoard) {
          let board = { ...item.payloadBoard, archived: false };
          const boardIds = new Set(nd.boards.map((b) => b.id));
          board = ensureId(board, boardIds);
          const colIds = new Set(nd.columns.map((c) => c.id));
          const originalCols = item.payloadColumns ?? [];
          const colMap = new Map<string, string>();
          const cols = originalCols.map((c) => {
            const fixed = ensureId({ ...c }, colIds);
            colMap.set(c.id, fixed.id);
            return fixed;
          });
          const taskIds = new Set(nd.tasks.map((t) => t.id));
          const tasks = (item.payloadTasks ?? []).map((t) => {
            const c = cloneTask(t);
            c.boardId = board.id;
            c.columnId = colMap.get(t.columnId) ?? cols[0]?.id ?? "";
            return ensureId(c, taskIds);
          });
          nd = {
            ...nd,
            boards: [...nd.boards, board],
            columns: [...nd.columns, ...cols],
            tasks: [...nd.tasks, ...tasks],
            activeBoardId: board.id,
          };
        }
        return nd;
      });
    },

    purgeTrashItem: (itemId) => {
      pushHistory();
      applyData((d) => ({ ...d, trash: d.trash.filter((x) => x.id !== itemId) }));
    },

    emptyTrash: () => {
      pushHistory();
      applyData((d) => ({ ...d, trash: [] }));
    },

    // ---------- history ----------
    undo: () => {
      const s = get();
      if (s.past.length === 0) return;
      const prev = s.past[s.past.length - 1];
      const current = snapshotOf(s.data);
      set({
        data: { ...s.data, ...prev },
        past: s.past.slice(0, -1),
        future: [current, ...s.future.slice(0, MAX_HISTORY - 1)],
      });
      saveData(get().data, true);
    },
    redo: () => {
      const s = get();
      if (s.future.length === 0) return;
      const next = s.future[0];
      const current = snapshotOf(s.data);
      set({
        data: { ...s.data, ...next },
        past: [...s.past.slice(-MAX_HISTORY + 1), current],
        future: s.future.slice(1),
      });
      saveData(get().data, true);
    },
    beginBatch: () => {
      set({ _batching: true, _batchSnapshot: snapshotOf(get().data) });
    },
    commitBatch: () => {
      const s = get();
      if (s._batchSnapshot) {
        set({
          past: [...s.past.slice(-MAX_HISTORY + 1), s._batchSnapshot],
          future: [],
          _batching: false,
          _batchSnapshot: null,
        });
      } else {
        set({ _batching: false, _batchSnapshot: null });
      }
      saveData(get().data, true);
    },
    cancelBatch: () => {
      const s = get();
      if (s._batchSnapshot) {
        set({ data: { ...s.data, ...s._batchSnapshot }, _batching: false, _batchSnapshot: null });
      } else {
        set({ _batching: false, _batchSnapshot: null });
      }
    },

    // ---------- import ----------
    importBoards: (payload, mode) => {
      const summary: ImportSummary = { added: 0, replaced: 0, skipped: 0 };
      pushHistory();
      applyData((d) => {
        let nd = { ...d };
        for (const src of payload.boards) {
          const existing = nd.boards.find((b) => b.id === src.id);
          if (existing && mode === "replace") {
            const cols = payload.columns.filter((c) => c.boardId === src.id);
            const colIds = new Set(cols.map((c) => c.id));
            const tasks = payload.tasks.filter((t) => t.boardId === src.id && colIds.has(t.columnId));
            nd = {
              ...nd,
              boards: nd.boards.map((b) => (b.id === src.id ? { ...src, updatedAt: Date.now() } : b)),
              columns: [...nd.columns.filter((c) => c.boardId !== src.id), ...cols],
              tasks: [...nd.tasks.filter((t) => t.boardId !== src.id || !colIds.has(t.columnId)), ...tasks],
            };
            summary.replaced += 1;
          } else if (existing && mode === "copy") {
            // Full copy with fresh ids.
            const boardIdMap = new Map<string, string>();
            const nb: Board = { ...src, id: uid("b"), name: `${src.name} (2)`, createdAt: Date.now(), updatedAt: Date.now() };
            boardIdMap.set(src.id, nb.id);
            const labelMap = new Map<string, string>();
            const labels: Label[] = (src.labels ?? []).map((l) => {
              const nid = uid("l");
              labelMap.set(l.id, nid);
              return { ...l, id: nid };
            });
            nb.labels = labels;
            const colMap = new Map<string, string>();
            const cols: Column[] = payload.columns
              .filter((c) => c.boardId === src.id)
              .map((c) => {
                const nid = uid("c");
                colMap.set(c.id, nid);
                return { ...c, id: nid, boardId: nb.id, createdAt: Date.now() };
              });
            const tasks: Task[] = payload.tasks
              .filter((t) => t.boardId === src.id && colMap.has(t.columnId))
              .map((t) => {
                const c = cloneTask(t);
                c.id = uid("t");
                c.boardId = nb.id;
                c.columnId = colMap.get(t.columnId) ?? cols[0]?.id ?? "";
                c.labelIds = t.labelIds.map((lid) => labelMap.get(lid) ?? lid).filter((lid) => labels.some((l) => l.id === lid));
                return c;
              });
            nd = {
              ...nd,
              boards: [...nd.boards, nb],
              columns: [...nd.columns, ...cols],
              tasks: [...nd.tasks, ...tasks],
              activeBoardId: nb.id,
            };
            summary.added += 1;
          } else {
            const cols = payload.columns.filter((c) => c.boardId === src.id);
            const colIds = new Set(cols.map((c) => c.id));
            const tasks = payload.tasks.filter((t) => t.boardId === src.id && colIds.has(t.columnId));
            nd = {
              ...nd,
              boards: [...nd.boards, { ...src, order: nd.boards.length }],
              columns: [...nd.columns, ...cols],
              tasks: [...nd.tasks, ...tasks],
              activeBoardId: src.id,
            };
            summary.added += 1;
          }
        }
        return nd;
      });
      return summary;
    },

    replaceAllData: (data) => {
      const clean = sanitizeAppData(data) ?? emptyData();
      set({ past: [], future: [], data: clean });
      saveData(clean, true);
    },
  };
});

export type { AppStore };
