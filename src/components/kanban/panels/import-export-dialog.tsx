"use client";
// Flow DECK — import / export dialog (JSON file download & validated import)
import { useCallback, useState } from "react";
import { Download, FileJson, FolderDown, Package, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  buildBoardExport,
  buildWorkspaceExport,
  useAppStore,
} from "@/lib/kanban/store";
import { parseImportFile, type ImportPayload } from "@/lib/kanban/validation";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PendingImport {
  name: string;
  payload: ImportPayload;
}

function downloadJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "board"
  );
}

export default function ImportExportDialog() {
  const open = useAppStore((s) => s.ui.importExportOpen);
  const setUI = useAppStore((s) => s.setUI);
  const data = useAppStore((s) => s.data);
  const importBoards = useAppStore((s) => s.importBoards);
  const { t } = useI18n();

  const [pending, setPending] = useState<PendingImport | null>(null);
  const [mode, setMode] = useState<"replace" | "copy">("copy");
  const [dragOver, setDragOver] = useState(false);

  const activeBoard = data.boards.find((b) => b.id === data.activeBoardId) ?? null;

  const exportBoard = useCallback(() => {
    const current = useAppStore.getState().data;
    const board = current.boards.find((b) => b.id === current.activeBoardId);
    if (!board) {
      toast.error(t("importExport.export.noBoard"));
      return;
    }
    const obj = buildBoardExport(current, board.id);
    if (!obj) {
      toast.error(t("importExport.export.noBoard"));
      return;
    }
    downloadJson(obj, `flowdeck-${slugify(board.name)}-${todayStamp()}.json`);
    toast.success(t("importExport.export.done"));
  }, [t]);

  const exportAll = useCallback(() => {
    const obj = buildWorkspaceExport(useAppStore.getState().data);
    downloadJson(obj, `flowdeck-all-${todayStamp()}.json`);
    toast.success(t("importExport.export.done"));
  }, [t]);

  const finishImport = useCallback(
    (payload: ImportPayload, m: "replace" | "copy") => {
      const summary = importBoards(payload, m);
      toast.success(
        t("importExport.import.success", {
          added: summary.added,
          replaced: summary.replaced,
        })
      );
      setPending(null);
    },
    [importBoards, t]
  );

  const handleFile = useCallback(
    async (file: File) => {
      let raw: unknown;
      try {
        const text = await file.text();
        raw = JSON.parse(text);
      } catch {
        toast.error(t("error.import"));
        return;
      }
      const parsed = parseImportFile(raw);
      if (!parsed.ok) {
        toast.error(t("error.import"));
        return;
      }
      const collision = parsed.payload.boards.some((b) =>
        data.boards.some((x) => x.id === b.id)
      );
      if (!collision) {
        finishImport(parsed.payload, "replace");
        return;
      }
      setMode("copy");
      setPending({ name: file.name, payload: parsed.payload });
    },
    [data.boards, finishImport, t]
  );

  const taskCountFor = useCallback(
    (boardId: string) => pending?.payload.tasks.filter((x) => x.boardId === boardId).length ?? 0,
    [pending]
  );

  return (
    <Dialog open={open} onOpenChange={(o) => setUI({ importExportOpen: o })}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold tracking-tight">
            {t("importExport.title")}
          </DialogTitle>
          <DialogDescription>{t("importExport.subtitle")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="export">{t("importExport.export.tab")}</TabsTrigger>
            <TabsTrigger value="import">{t("importExport.import.tab")}</TabsTrigger>
          </TabsList>

          {/* ---------------- Export ---------------- */}
          <TabsContent value="export" className="space-y-3">
            <div className="flex items-start justify-between gap-3 rounded-xl border p-4">
              <div className="min-w-0">
                <p className="text-kicker">{t("importExport.export.board")}</p>
                <h3 className="mt-0.5 flex items-center gap-2 truncate font-display text-sm font-semibold">
                  <FolderDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {activeBoard ? activeBoard.name : "—"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("importExport.export.boardDesc")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!activeBoard}
                onClick={exportBoard}
              >
                <Download className="size-4" aria-hidden="true" />
                {t("importExport.export.download")}
              </Button>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-xl border p-4">
              <div className="min-w-0">
                <p className="text-kicker">{t("importExport.export.all")}</p>
                <h3 className="mt-0.5 flex items-center gap-2 truncate font-display text-sm font-semibold">
                  <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {t("importExport.export.all")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("importExport.export.allDesc")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={exportAll}>
                <Download className="size-4" aria-hidden="true" />
                {t("importExport.export.download")}
              </Button>
            </div>
          </TabsContent>

          {/* ---------------- Import ---------------- */}
          <TabsContent value="import" className="space-y-3">
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "hover:border-primary/50"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void handleFile(file);
              }}
            >
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label={t("importExport.import.choose")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Upload className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-primary">
                {t("importExport.import.choose")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("importExport.import.hint")}
              </span>
              <span className="text-xs text-muted-foreground/70">
                {t("importExport.import.drop")}
              </span>
            </label>

            {pending && (
              <div className="space-y-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-1.5 text-kicker">
                    <FileJson className="size-3.5 shrink-0" aria-hidden="true" />
                    {t("importExport.import.preview")}
                  </p>
                  <Badge variant="secondary">
                    {t("importExport.import.fileInfo", {
                      boards: pending.payload.boards.length,
                      tasks: pending.payload.tasks.length,
                    })}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">{pending.name}</p>

                <div className="max-h-40 space-y-1.5 overflow-y-auto scrollbar-slim pr-1">
                  {pending.payload.boards.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <span className="truncate text-sm">{b.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {t("importExport.import.boardTasks", { count: taskCountFor(b.id) })}
                      </Badge>
                    </div>
                  ))}
                </div>

                <p className="text-sm font-medium">{t("importExport.import.modeLabel")}</p>
                <RadioGroup
                  value={mode}
                  onValueChange={(v) => setMode(v === "replace" ? "replace" : "copy")}
                  className="gap-2"
                >
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent/40">
                    <RadioGroupItem value="replace" className="mt-0.5" />
                    <span>{t("importExport.import.mode.replace")}</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent/40">
                    <RadioGroupItem value="copy" className="mt-0.5" />
                    <span>{t("importExport.import.mode.copy")}</span>
                  </label>
                </RadioGroup>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
                    {t("common.cancel")}
                  </Button>
                  <Button size="sm" onClick={() => finishImport(pending.payload, mode)}>
                    {t("importExport.import.confirm")}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
