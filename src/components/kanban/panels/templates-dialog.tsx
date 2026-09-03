"use client";
// Flow DECK — templates dialog (ready-to-use board presets)
import { useCallback } from "react";
import {
  ArrowRight,
  CalendarDays,
  Code2,
  Columns3,
  FolderKanban,
  LayoutTemplate,
  Lightbulb,
  ListChecks,
  Newspaper,
  ShoppingCart,
  Target,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/kanban/store";
import { TEMPLATES, buildTemplateBoard } from "@/lib/kanban/templates";
import { useI18n } from "@/lib/i18n/context";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  project: FolderKanban,
  personal: User,
  weekly: CalendarDays,
  editorial: Newspaper,
  ideas: Lightbulb,
  dev: Code2,
  shopping: ShoppingCart,
  goals: Target,
};

export default function TemplatesDialog() {
  const open = useAppStore((s) => s.ui.templatesOpen);
  const setUI = useAppStore((s) => s.setUI);
  const createBoardWithStructure = useAppStore((s) => s.createBoardWithStructure);
  const { t } = useI18n();

  const applyTemplate = useCallback(
    (id: string) => {
      const spec = buildTemplateBoard(id, t);
      if (!spec) return;
      createBoardWithStructure(spec);
      setUI({ templatesOpen: false });
      toast.success(t("templates.created", { name: spec.name }));
    },
    [createBoardWithStructure, setUI, t]
  );

  return (
    <Dialog open={open} onOpenChange={(o) => setUI({ templatesOpen: o })}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold tracking-tight">
            {t("templates.title")}
          </DialogTitle>
          <DialogDescription>{t("templates.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-3 overflow-y-auto scrollbar-slim pr-1 sm:grid-cols-2">
          {TEMPLATES.map((tpl) => {
            const board = buildTemplateBoard(tpl.id, t);
            if (!board) return null;
            const Icon = TEMPLATE_ICONS[tpl.id] ?? LayoutTemplate;
            return (
              <button
                key={tpl.id}
                type="button"
                aria-label={`${t("templates.use")} : ${board.name}`}
                onClick={() => applyTemplate(tpl.id)}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:border-primary/60 focus-visible:outline-none"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-semibold">
                      {board.name}
                    </h3>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {board.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {board.columns.map((col) => (
                    <Badge
                      key={col}
                      variant="secondary"
                      className="text-[10px] font-normal"
                    >
                      {col}
                    </Badge>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Columns3 className="size-3.5 shrink-0" aria-hidden="true" />
                    {t("templates.columnsCount", { count: board.columns.length })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ListChecks className="size-3.5 shrink-0" aria-hidden="true" />
                    {t("templates.tasksCount", { count: board.tasks.length })}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary transition-opacity group-hover:opacity-100 sm:opacity-70">
                    {t("templates.use")}
                    <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
