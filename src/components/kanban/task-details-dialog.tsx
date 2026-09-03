"use client";
// Flow DECK — task details: full editing (title, description, due, priority, labels,
// subtasks, comments, links, timer, recurrence, estimate/spent, blocked)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Ban,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  ListChecks,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Repeat,
  Tag,
  Timer as TimerIcon,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";
import { taskProgress } from "@/lib/kanban/stats";
import {
  currentTimerMs,
  dueState,
  formatDateTime,
  formatDuration,
  formatElapsed,
  fromDateInputValue,
  toDateInputValue,
} from "@/lib/kanban/datetime";
import { PRIORITY_COLORS } from "./task-card";
import type { Priority, Recurrence, Task } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function Section({ icon: Icon, title, children, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-kicker inline-flex items-center gap-1.5">
          <Icon className="h-3 w-3" />
          {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TaskDetailsDialog() {
  const { t, lang } = useI18n();
  const openTaskId = useAppStore((s) => s.ui.openTaskId);
  const data = useAppStore((s) => s.data);
  const setUI = useAppStore((s) => s.setUI);

  const task = useMemo(() => data.tasks.find((x) => x.id === openTaskId), [data.tasks, openTaskId]);
  const open = !!task;

  const board = data.boards.find((b) => b.id === task?.boardId);
  const boardColumns = data.columns
    .filter((c) => c.boardId === task?.boardId && !c.archived)
    .sort((a, b) => a.order - b.order);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [labelPopoverOpen, setLabelPopoverOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#2E6BFF");
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const [prevTaskId, setPrevTaskId] = useState<string | null>(null);

  // Reset local editing fields when another task is opened (render-phase adjustment).
  if ((task?.id ?? null) !== prevTaskId) {
    setPrevTaskId(task?.id ?? null);
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setSubtaskInput("");
    setCommentInput("");
    setLinkInput("");
  }

  const now = useNow(!!task?.timer.running);
  const elapsed = task ? currentTimerMs(task, now) : 0;
  const ds = task ? dueState(task, now) : "none";
  const progress = task ? taskProgress(task) : 0;

  if (!task) {
    return (
      <Dialog open={false} onOpenChange={() => {}}>
        <span />
      </Dialog>
    );
  }

  const update = (patch: Partial<Task>) => useAppStore.getState().updateTask(task.id, patch);

  const saveTitle = () => {
    const v = title.trim();
    if (!v) {
      setTitle(task.title);
      return;
    }
    if (v !== task.title) update({ title: v });
  };

  const setRec = (rec: Recurrence | null) => update({ recurrence: rec });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setUI({ openTaskId: null })}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="max-h-[85vh] overflow-y-auto scrollbar-slim">
          <div className="sticky top-0 z-10 border-b bg-card/95 px-5 pb-3 pt-4 backdrop-blur">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-start gap-2.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-1.5 mt-0.5 h-7 w-7 shrink-0"
                  onClick={() => useAppStore.getState().toggleTaskDone(task.id)}
                  aria-label={task.status === "done" ? t("task.reopen") : t("task.markDone")}
                >
                  <CheckCircle2 className={cn("h-5 w-5", task.status === "done" ? "text-primary" : "text-muted-foreground/40")} />
                </Button>
                <div className="min-w-0 flex-1">
                  <DialogTitle asChild>
                    <input
                      ref={titleRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                      className={cn(
                        "w-full rounded-md bg-transparent font-display text-lg font-bold tracking-tight outline-none focus:bg-muted/40 focus:ring-2 focus:ring-ring",
                        task.status === "done" && "line-through text-muted-foreground"
                      )}
                      aria-label={t("task.editTitle")}
                    />
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {t("task.column")}: {boardColumns.find((c) => c.id === task.columnId)?.name ?? "—"}
                    {" · "}
                    {t("task.createdAgo", { date: formatDateTime(task.createdAt, lang) })}
                  </DialogDescription>
                </div>
                {task.blocked && (
                  <Badge variant="destructive" className="gap-1">
                    <Ban className="h-3 w-3" /> {t("task.blocked")}
                  </Badge>
                )}
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-5 py-4">
            {/* Quick properties */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("task.column")}</Label>
                <Select
                  value={task.columnId}
                  onValueChange={(v) => {
                    if (v !== task.columnId) {
                      const count = data.tasks.filter((x) => x.columnId === v && x.id !== task.id).length;
                      useAppStore.getState().moveTask(task.id, v, count);
                    }
                  }}
                >
                  <SelectTrigger size="sm" aria-label={t("task.column")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boardColumns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("task.priority")}</Label>
                <Select value={task.priority} onValueChange={(v) => update({ priority: v as Priority })}>
                  <SelectTrigger size="sm" aria-label={t("task.priority")}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {(["urgent", "high", "normal", "low"] as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p] }} />
                          {t(`priority.${p}`)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {t("task.dueDate")}
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    value={toDateInputValue(task.dueDate)}
                    onChange={(e) => update({ dueDate: fromDateInputValue(e.target.value) })}
                    className="h-8 text-xs"
                    aria-label={t("task.dueDate")}
                  />
                  {task.dueDate != null && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => update({ dueDate: null })} aria-label={t("due.none")}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {task.dueDate != null && ds !== "none" && (
                  <p className={cn("text-[11px] font-medium", ds === "overdue" ? "text-destructive" : ds === "today" ? "text-amber-500" : "text-muted-foreground")}>
                    {t(`due.${ds}`)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("task.estimate")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={task.estimateMinutes ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
                    update({ estimateMinutes: v });
                  }}
                  className="h-8 text-xs"
                  aria-label={t("task.estimate")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("task.spent")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={task.spentMinutes}
                  onChange={(e) => update({ spentMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  className="h-8 text-xs"
                  aria-label={t("task.spent")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("task.recurrence")}</Label>
                <Popover open={recurrenceOpen} onOpenChange={setRecurrenceOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-full justify-start gap-1.5 text-xs font-normal">
                      <Repeat className="h-3 w-3" />
                      {task.recurrence ? t(`task.recurrence.${task.recurrence.freq === "custom" ? "custom" : task.recurrence.freq}`) : t("task.recurrence.none")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 space-y-3" align="start">
                    <Select
                      value={task.recurrence?.freq ?? "none"}
                      onValueChange={(v) => {
                        if (v === "none") setRec(null);
                        else setRec({ freq: v as Recurrence["freq"], interval: task.recurrence?.interval ?? 1, unit: task.recurrence?.unit ?? "days" });
                      }}
                    >
                      <SelectTrigger size="sm" aria-label={t("task.recurrence")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("task.recurrence.none")}</SelectItem>
                        <SelectItem value="daily">{t("task.recurrence.daily")}</SelectItem>
                        <SelectItem value="weekly">{t("task.recurrence.weekly")}</SelectItem>
                        <SelectItem value="monthly">{t("task.recurrence.monthly")}</SelectItem>
                        <SelectItem value="custom">{t("task.recurrence.custom")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {task.recurrence && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">{t("task.recurrence.every")}</Label>
                        <Input
                          type="number"
                          min={1}
                          value={task.recurrence.interval}
                          onChange={(e) =>
                            setRec({
                              ...task.recurrence!,
                              interval: Math.max(1, parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="h-8 w-16 text-xs"
                          aria-label={t("task.recurrence.every")}
                        />
                        {task.recurrence.freq === "custom" && (
                          <Select
                            value={task.recurrence.unit ?? "days"}
                            onValueChange={(v) => setRec({ ...task.recurrence!, unit: v as Recurrence["unit"] })}
                          >
                            <SelectTrigger size="sm" className="flex-1" aria-label={t("task.recurrence")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days">{t("task.recurrence.days")}</SelectItem>
                              <SelectItem value="weeks">{t("task.recurrence.weeks")}</SelectItem>
                              <SelectItem value="months">{t("task.recurrence.months")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {t("task.recurrence.hint")}
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Blocked toggle */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm font-medium">{t("task.blocked")}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{task.blocked ? t("task.unblock") : t("task.markBlocked")}</span>
                <Switch
                  checked={task.blocked}
                  onCheckedChange={() => useAppStore.getState().toggleTaskBlocked(task.id)}
                  aria-label={task.blocked ? t("task.unblock") : t("task.markBlocked")}
                />
              </div>
            </div>

            {/* Labels */}
            <Section
              icon={Tag}
              title={t("task.labels")}
              action={
                <Popover open={labelPopoverOpen} onOpenChange={setLabelPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                      <Plus className="h-3 w-3" /> {t("label.manage")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 space-y-3" align="end">
                    {board && board.labels.length > 0 ? (
                      <div className="space-y-1.5">
                        {board.labels.map((l) => {
                          const active = task.labelIds.includes(l.id);
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => useAppStore.getState().toggleTaskLabel(task.id, l.id)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
                                active ? "border-primary/50 bg-primary/10" : "hover:bg-muted/50"
                              )}
                              aria-pressed={active}
                            >
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                              <span className="flex-1 text-left">{l.name}</span>
                              {active && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t("label.empty")}</p>
                    )}
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("label.new")}</Label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={newLabelColor}
                          onChange={(e) => setNewLabelColor(e.target.value)}
                          className="h-8 w-8 cursor-pointer rounded border bg-transparent"
                          aria-label={t("label.color")}
                        />
                        <Input
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder={t("label.name")}
                          className="h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0"
                          disabled={!newLabelName.trim() || !board}
                          onClick={() => {
                            if (!board) return;
                            const id = useAppStore.getState().addLabel(board.id, newLabelName, newLabelColor);
                            if (id) {
                              useAppStore.getState().toggleTaskLabel(task.id, id);
                              setNewLabelName("");
                            }
                          }}
                          aria-label={t("label.add")}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              }
            >
              {task.labelIds.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("label.empty")}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {task.labelIds.map((id) => {
                    const l = board?.labels.find((x) => x.id === id);
                    if (!l) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                        {l.name}
                        <button
                          type="button"
                          onClick={() => useAppStore.getState().toggleTaskLabel(task.id, id)}
                          className="rounded-full p-0.5 hover:bg-muted"
                          aria-label={`${t("common.delete")}: ${l.name}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* Description */}
            <Section icon={MessageSquare} title={t("task.description")}>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => description !== task.description && update({ description })}
                placeholder={t("task.descriptionPlaceholder")}
                rows={3}
                className="resize-none text-sm"
                aria-label={t("task.description")}
              />
            </Section>

            {/* Subtasks */}
            <Section
              icon={ListChecks}
              title={t("task.subtasks")}
              action={
                task.subtasks.length > 0 ? (
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {t("task.subtasksCount", {
                      done: task.subtasks.filter((s) => s.done).length,
                      total: task.subtasks.length,
                    })}
                  </span>
                ) : undefined
              }
            >
              {task.subtasks.length > 0 && (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full flow-gradient transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
              <div className="space-y-1">
                {task.subtasks.map((s, i) => (
                  <div key={s.id} className="group flex items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-1 hover:border-border">
                    <button
                      type="button"
                      onClick={() => useAppStore.getState().updateSubtask(task.id, s.id, { done: !s.done })}
                      aria-label={s.done ? t("task.reopen") : t("task.markDone")}
                      className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <CheckCircle2 className={cn("h-4 w-4", s.done ? "text-primary" : "text-muted-foreground/40")} />
                    </button>
                    <input
                      value={s.title}
                      onChange={(e) => useAppStore.getState().updateSubtask(task.id, s.id, { title: e.target.value })}
                      className={cn(
                        "min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm outline-none focus:bg-muted/40 focus:ring-1 focus:ring-ring",
                        s.done && "line-through text-muted-foreground"
                      )}
                      aria-label={t("task.subtasks")}
                    />
                    <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => useAppStore.getState().moveSubtask(task.id, s.id, -1)} disabled={i === 0} aria-label="↑">
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => useAppStore.getState().moveSubtask(task.id, s.id, 1)} disabled={i === task.subtasks.length - 1} aria-label="↓">
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => useAppStore.getState().deleteSubtask(task.id, s.id)} aria-label={t("common.delete")}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && subtaskInput.trim()) {
                      useAppStore.getState().addSubtask(task.id, subtaskInput);
                      setSubtaskInput("");
                    }
                  }}
                  placeholder={t("task.addSubtask")}
                  className="h-8 text-xs"
                  aria-label={t("task.addSubtask")}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0"
                  disabled={!subtaskInput.trim()}
                  onClick={() => {
                    useAppStore.getState().addSubtask(task.id, subtaskInput);
                    setSubtaskInput("");
                  }}
                  aria-label={t("task.addSubtask")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Section>

            {/* Timer */}
            <Section icon={TimerIcon} title={t("task.timer")}>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                <span
                  className={cn(
                    "font-mono text-2xl font-bold tabular-nums",
                    task.timer.running && "flow-gradient-text"
                  )}
                  aria-live="off"
                >
                  {formatElapsed(elapsed)}
                </span>
                <div className="flex-1" />
                <div className="flex items-center gap-1.5">
                  {task.timer.running ? (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => useAppStore.getState().pauseTimer(task.id)}>
                      <Pause className="h-3.5 w-3.5" /> {t("task.timer.pause")}
                    </Button>
                  ) : (
                    <Button size="sm" className="flow-gradient gap-1.5 border-0 text-white" onClick={() => useAppStore.getState().startTimer(task.id)}>
                      <Play className="h-3.5 w-3.5" /> {t("task.timer.start")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={elapsed < 1000}
                    onClick={() => {
                      useAppStore.getState().logTimer(task.id);
                      toast.success(t("task.timer.log"));
                    }}
                  >
                    {t("task.timer.log")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => useAppStore.getState().clearTimer(task.id)} aria-label={t("task.timer.reset")}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {task.spentMinutes > 0 && (
                  <p className="w-full text-xs text-muted-foreground">
                    {t("task.spent")}: {formatDuration(task.spentMinutes, lang)}
                    {task.estimateMinutes != null && task.estimateMinutes > 0 && (
                      <>
                        {" · "}
                        {t("task.estimate")}: {formatDuration(task.estimateMinutes, lang)}
                      </>
                    )}
                  </p>
                )}
              </div>
            </Section>

            {/* Links */}
            <Section icon={Link2} title={t("task.links")}>
              {task.links.length > 0 && (
                <div className="space-y-1">
                  {task.links.map((l) => (
                    <div key={l.id} className="group flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{l.title || l.url}</span>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => useAppStore.getState().deleteLink(task.id, l.id)}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Input
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && linkInput.trim()) {
                      useAppStore.getState().addLink(task.id, linkInput);
                      setLinkInput("");
                    }
                  }}
                  placeholder={t("task.addLink")}
                  className="h-8 text-xs"
                  aria-label={t("task.addLink")}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0"
                  disabled={!linkInput.trim()}
                  onClick={() => {
                    useAppStore.getState().addLink(task.id, linkInput);
                    setLinkInput("");
                  }}
                  aria-label={t("task.addLink")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Section>

            {/* Comments */}
            <Section icon={MessageSquare} title={t("task.comments")}>
              <div className="flex items-start gap-1.5">
                <Textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder={t("task.addComment")}
                  rows={2}
                  className="min-h-0 resize-none text-sm"
                  aria-label={t("task.addComment")}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 shrink-0"
                  disabled={!commentInput.trim()}
                  onClick={() => {
                    useAppStore.getState().addComment(task.id, commentInput);
                    setCommentInput("");
                  }}
                  aria-label={t("task.addComment")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {task.comments.length > 0 && (
                <div className="space-y-2">
                  {task.comments.map((c) => (
                    <div key={c.id} className="group rounded-lg border bg-muted/20 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="whitespace-pre-wrap text-sm">{c.text}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => useAppStore.getState().deleteComment(task.id, c.id)}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(c.createdAt, lang)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Footer actions */}
          <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t bg-card/95 px-5 py-3 backdrop-blur">
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              {t("task.updatedAgo", { date: formatDateTime(task.updatedAt, lang) })}
              {task.completedAt ? ` · ${t("task.completedOn", { date: formatDateTime(task.completedAt, lang) })}` : ""}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  useAppStore.getState().duplicateTask(task.id);
                  toast.success(t("task.created"));
                }}
              >
                <Copy className="h-3.5 w-3.5" /> {t("task.duplicate")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  useAppStore.getState().archiveTask(task.id);
                  toast.success(t("task.archived"));
                  setUI({ openTaskId: null });
                }}
              >
                <Archive className="h-3.5 w-3.5" /> {t("task.archive")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("task.delete")}
              </Button>
            </div>
          </div>
        </div>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("task.deleteConfirm.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("task.deleteConfirm.body", { title: task.title })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => {
                  useAppStore.getState().deleteTask(task.id);
                  toast.success(t("task.deleted"));
                  setUI({ openTaskId: null });
                }}
              >
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
