"use client";
// Flow DECK — board settings: rename, description, reset
import React, { useState } from "react";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import { useAppStore } from "@/lib/kanban/store";

export function BoardSettingsDialog() {
  const { t } = useI18n();
  const open = useAppStore((s) => s.ui.settingsOpen);
  const setUI = useAppStore((s) => s.setUI);
  const data = useAppStore((s) => s.data);

  const board = data.boards.find((b) => b.id === data.activeBoardId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [prevKey, setPrevKey] = useState("");

  // Reset local fields when the dialog opens for a board (render-phase adjustment).
  const key = open ? board?.id ?? "" : "";
  if (key !== prevKey) {
    setPrevKey(key);
    setName(key ? board?.name ?? "" : "");
    setDescription(key ? board?.description ?? "" : "");
  }

  const save = () => {
    if (!board) return;
    const v = name.trim();
    if (!v) return;
    useAppStore.getState().updateBoard(board.id, { name: v, description: description.trim() });
    toast.success(t("board.updated"));
    setUI({ settingsOpen: false });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => setUI({ settingsOpen: o })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{t("board.rename")}</DialogTitle>
            <DialogDescription>{t("board.editDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="board-name">{t("board.name")}</Label>
              <Input
                id="board-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="board-desc">{t("board.description")}</Label>
              <Textarea
                id="board-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:bg-destructive/10"
              onClick={() => setResetOpen(true)}
            >
              <TriangleAlert className="h-3.5 w-3.5" />
              {t("board.reset")}
            </Button>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" onClick={() => setUI({ settingsOpen: false })}>
                {t("common.cancel")}
              </Button>
              <Button onClick={save} disabled={!name.trim()} className="flow-gradient border-0 font-semibold text-white hover:opacity-90">
                {t("common.save")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("board.resetConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("board.resetConfirm.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (board) {
                  useAppStore.getState().resetBoard(board.id);
                  toast.success(t("board.resetDone"));
                }
                setResetOpen(false);
                setUI({ settingsOpen: false });
              }}
            >
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
