"use client";
// Flow DECK — trash dialog (restore / purge / empty, all confirmed)
import { useMemo } from "react";
import { Columns3, FileText, Info, LayoutGrid, Trash2, TrashIcon, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/kanban/store";
import { formatDateTime } from "@/lib/kanban/datetime";
import { useI18n } from "@/lib/i18n/context";
import type { TrashItem } from "@/lib/kanban/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function TypeIcon({ type }: { type: TrashItem["type"] }) {
  if (type === "task") return <FileText className="size-4" aria-hidden="true" />;
  if (type === "column") return <Columns3 className="size-4" aria-hidden="true" />;
  return <LayoutGrid className="size-4" aria-hidden="true" />;
}

export default function TrashPanel() {
  const open = useAppStore((s) => s.ui.trashOpen);
  const setUI = useAppStore((s) => s.setUI);
  const trash = useAppStore((s) => s.data.trash);
  const restoreFromTrash = useAppStore((s) => s.restoreFromTrash);
  const purgeTrashItem = useAppStore((s) => s.purgeTrashItem);
  const emptyTrash = useAppStore((s) => s.emptyTrash);
  const { t, lang } = useI18n();

  const items = useMemo(
    () => [...trash].sort((a, b) => b.deletedAt - a.deletedAt),
    [trash]
  );

  const restore = (item: TrashItem) => {
    restoreFromTrash(item.id);
    toast.success(t("trash.restored", { name: item.label }));
  };

  const purge = (item: TrashItem) => {
    purgeTrashItem(item.id);
    toast(t("trash.purged"));
  };

  const emptyAll = () => {
    emptyTrash();
    toast(t("trash.emptied"));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => setUI({ trashOpen: o })}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            {t("trash.title")}
            <Badge variant="secondary">
              {t("trash.count", { count: items.length })}
            </Badge>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("trash.footer")}
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center">
            <TrashIcon className="size-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm font-medium">{t("trash.empty")}</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {t("trash.emptyHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="size-4" aria-hidden="true" />
                    {t("trash.emptyAll.action")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("trash.emptyAll.title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("trash.emptyAll.body", { count: items.length })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={emptyAll}
                    >
                      {t("trash.emptyAll.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <ul className="max-h-[50vh] space-y-2 overflow-y-auto scrollbar-slim pr-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <TypeIcon type={item.type} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t(`trash.type.${item.type}`)}
                      {" · "}
                      {t("trash.deletedAt", { date: formatDateTime(item.deletedAt, lang) })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("trash.restore")}
                    onClick={() => restore(item)}
                  >
                    <Undo2 className="size-4" aria-hidden="true" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("trash.deleteAria", { name: item.label })}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("trash.deleteOne.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("trash.deleteOne.body", { name: item.label })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => purge(item)}
                        >
                          {t("trash.deleteOne.confirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>

            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {t("trash.footer")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
