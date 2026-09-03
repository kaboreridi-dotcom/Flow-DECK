"use client";
// Flow DECK — quick new task dialog (N shortcut / non-kanban views)
import React, { useState } from "react";
import { toast } from "sonner";
import { Calendar, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";
import { fromDateInputValue } from "@/lib/kanban/datetime";
import { PRIORITY_COLORS } from "./task-card";
import type { Priority } from "@/lib/kanban/types";

export function NewTaskDialog() {
  const { t } = useI18n();
  const open = useAppStore((s) => s.ui.newTaskOpen);
  const setUI = useAppStore((s) => s.setUI);
  const data = useAppStore((s) => s.data);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [prevOpenKey, setPrevOpenKey] = useState("");

  const columns = data.columns
    .filter((c) => c.boardId === data.activeBoardId && !c.archived)
    .sort((a, b) => a.order - b.order);

  const openKey = open ? data.activeBoardId ?? "" : "";
  // Reset fields when dialog opens (render-phase adjustment).
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    setTitle("");
    setDescription("");
    setPriority("normal");
    setDueDate("");
    setColumnId(openKey ? columns[0]?.id ?? "" : "");
  }

  const submit = () => {
    const v = title.trim();
    if (!v || !columnId) return;
    useAppStore.getState().addTask({
      columnId,
      title: v,
      description: description.trim() || undefined,
      priority,
      dueDate: fromDateInputValue(dueDate),
    });
    toast.success(t("task.created"));
    setUI({ newTaskOpen: false });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => setUI({ newTaskOpen: o })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t("task.new")}</DialogTitle>
          <DialogDescription>{t("app.tagline")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="new-task-title">{t("task.title")}</Label>
            <Input
              id="new-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("task.titlePlaceholder")}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-task-desc">{t("task.description")}</Label>
            <Textarea
              id="new-task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("task.descriptionPlaceholder")}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("task.column")}</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger size="sm" aria-label={t("task.column")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("task.priority")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger size="sm" aria-label={t("task.priority")}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[priority] }} />
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-task-due" className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {t("task.dueDate")}
            </Label>
            <Input
              id="new-task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setUI({ newTaskOpen: false })}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!title.trim() || !columnId} className="flow-gradient gap-2 border-0 font-semibold text-white hover:opacity-90">
            <Plus className="h-4 w-4" />
            {t("task.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
