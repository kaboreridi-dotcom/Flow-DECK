"use client";
// Flow DECK — kanban column: sortable, header menu, WIP limit, task composer
import React, { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Gauge,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";
import type { Board, Column, Task } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";

type DeleteMode = "move" | "archive" | "delete";

export function ColumnCard({
  column,
  tasks,
  board,
  dragEnabled,
  overlay,
}: {
  column: Column;
  tasks: Task[];
  board: Board;
  dragEnabled: boolean;
  overlay?: boolean;
}) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: "column", column }, disabled: !dragEnabled || overlay });

  const [menuOpen, setMenuOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(column.name);
  const [limitOpen, setLimitOpen] = useState(false);
  const [limitValue, setLimitValue] = useState(column.taskLimit ? String(column.taskLimit) : "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>("move");
  const [moveTarget, setMoveTarget] = useState<string>("");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const allColumns = useAppStore((s) => s.data.columns)
    .filter((c) => c.boardId === column.boardId && !c.archived)
    .sort((a, b) => a.order - b.order);

  const limitReached = column.taskLimit != null && column.taskLimit > 0 && tasks.length >= column.taskLimit;

  const submitTask = () => {
    const title = composerValue.trim();
    if (!title) {
      setComposerOpen(false);
      return;
    }
    useAppStore.getState().addTask({ columnId: column.id, title });
    toast.success(t("task.created"));
    setComposerValue("");
    composerRef.current?.focus();
  };

  const confirmDelete = () => {
    const store = useAppStore.getState();
    if (tasks.length === 0) {
      store.deleteColumn(column.id, "delete");
      toast.success(t("col.deleteConfirm.title", { name: column.name }));
    } else if (deleteMode === "move" && moveTarget) {
      store.deleteColumn(column.id, "move", moveTarget);
    } else {
      store.deleteColumn(column.id, deleteMode);
    }
    setDeleteOpen(false);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col rounded-xl border bg-card/60 shadow-sm backdrop-blur-sm sm:w-[300px]",
        isDragging && "ring-2 ring-primary/40"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1 border-b px-2.5 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={!dragEnabled}
          aria-label={t("col.dragHandle")}
          className={cn(
            "rounded p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !dragEnabled && "cursor-not-allowed opacity-40"
          )}
        >
          <Gauge className="h-3.5 w-3.5 rotate-90" />
        </button>
        <h3 className="min-w-0 flex-1 truncate font-display text-sm font-semibold tracking-tight">
          {column.name}
        </h3>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
            limitReached ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"
          )}
        >
          {tasks.length}
          {column.taskLimit ? `/${column.taskLimit}` : ""}
        </span>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${column.name} — options`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => { setRenameValue(column.name); setRenameOpen(true); }}>
              <Pencil className="h-4 w-4" /> {t("col.renameTitle")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setLimitValue(column.taskLimit ? String(column.taskLimit) : ""); setLimitOpen(true); }}>
              <Gauge className="h-4 w-4" /> {t("col.limit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { useAppStore.getState().duplicateColumn(column.id); toast.success(t("board.duplicated")); }}>
              <Copy className="h-4 w-4" /> {t("col.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => useAppStore.getState().moveColumnTo(column.id, Math.max(0, column.order - 1))}
            >
              <ArrowLeft className="h-4 w-4" /> {t("col.moveLeft")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => useAppStore.getState().moveColumnTo(column.id, Math.min(allColumns.length - 1, column.order + 1))}
            >
              <ArrowRight className="h-4 w-4" /> {t("col.moveRight")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { useAppStore.getState().archiveColumn(column.id); toast.success(t("col.archive")); }}>
              <Archive className="h-4 w-4" /> {t("col.archive")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => { setDeleteMode("move"); setMoveTarget(allColumns.find((c) => c.id !== column.id)?.id ?? ""); setDeleteOpen(true); }}>
              <Trash2 className="h-4 w-4" /> {t("col.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tasks */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim p-2">
        <SortableContext items={tasks.map((x) => x.id)} strategy={verticalListSortingStrategy}>
          <div className="flex min-h-full flex-col gap-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} labels={board.labels} disabled={!dragEnabled} />
            ))}
            {tasks.length === 0 && (
              <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                {t("col.empty")}
              </p>
            )}
          </div>
        </SortableContext>
      </div>

      {/* Composer */}
      <div className="border-t p-2">
        {composerOpen ? (
          <div className="space-y-1.5">
            <textarea
              ref={composerRef}
              value={composerValue}
              onChange={(e) => setComposerValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitTask();
                }
                if (e.key === "Escape") {
                  setComposerOpen(false);
                  setComposerValue("");
                }
              }}
              placeholder={t("task.titlePlaceholder")}
              rows={2}
              autoFocus
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("task.title")}
            />
            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={submitTask} className="flow-gradient h-7 gap-1 border-0 px-2.5 text-white">
                <Check className="h-3.5 w-3.5" />
                {t("task.add")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => { setComposerOpen(false); setComposerValue(""); }}
                aria-label={t("common.cancel")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setComposerOpen(true)}
            disabled={limitReached}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            aria-label={t("col.addTask")}
          >
            <Plus className="h-4 w-4" />
            {t("col.addTask")}
          </Button>
        )}
      </div>

      {/* Rename dialog */}
      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("col.renameTitle")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      useAppStore.getState().updateColumn(column.id, { name: renameValue.trim() || column.name });
                      setRenameOpen(false);
                    }
                  }}
                  autoFocus
                  aria-label={t("col.name")}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                useAppStore.getState().updateColumn(column.id, { name: renameValue.trim() || column.name });
                setRenameOpen(false);
              }}
            >
              {t("common.save")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* WIP limit dialog */}
      <AlertDialog open={limitOpen} onOpenChange={setLimitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("col.limit")}</AlertDialogTitle>
            <AlertDialogDescription>{t("col.limitHint")}</AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="number"
            min={0}
            value={limitValue}
            onChange={(e) => setLimitValue(e.target.value)}
            aria-label={t("col.limit")}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const n = parseInt(limitValue, 10);
                useAppStore.getState().updateColumn(column.id, { taskLimit: Number.isFinite(n) && n > 0 ? n : null });
                setLimitOpen(false);
              }}
            >
              {t("common.save")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete column dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("col.deleteConfirm.title", { name: column.name })}</AlertDialogTitle>
            {tasks.length > 0 ? (
              <>
                <AlertDialogDescription>
                  {t("col.deleteConfirm.body", { count: tasks.length })}
                </AlertDialogDescription>
                <RadioGroup value={deleteMode} onValueChange={(v) => setDeleteMode(v as DeleteMode)} className="gap-2.5">
                  <div className={cn("flex items-start gap-2.5 rounded-lg border p-3", allColumns.filter((c) => c.id !== column.id).length === 0 && "opacity-50")}>
                    <RadioGroupItem value="move" id="del-move" disabled={allColumns.filter((c) => c.id !== column.id).length === 0} />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="del-move" className="text-sm">{t("col.deleteChoice.move")}</Label>
                      {deleteMode === "move" && (
                        <Select value={moveTarget} onValueChange={setMoveTarget}>
                          <SelectTrigger size="sm" aria-label={t("col.deleteChoice.target")}>
                            <SelectValue placeholder={t("col.deleteChoice.target")} />
                          </SelectTrigger>
                          <SelectContent>
                            {allColumns
                              .filter((c) => c.id !== column.id)
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border p-3">
                    <RadioGroupItem value="archive" id="del-archive" />
                    <Label htmlFor="del-archive" className="text-sm">{t("col.deleteChoice.archive")}</Label>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border p-3">
                    <RadioGroupItem value="delete" id="del-delete" />
                    <Label htmlFor="del-delete" className="text-sm">{t("col.deleteChoice.delete")}</Label>
                  </div>
                </RadioGroup>
              </>
            ) : (
              <AlertDialogDescription>{t("col.empty")}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={tasks.length > 0 && deleteMode === "move" && !moveTarget}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
