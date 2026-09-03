"use client";
// Flow DECK — keyboard shortcuts help dialog
import { useAppStore } from "@/lib/kanban/store";
import { useI18n } from "@/lib/i18n/context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-7 items-center justify-center rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
      {children}
    </kbd>
  );
}

interface ShortcutRow {
  /** One entry per alternative combo (e.g. Ctrl+Shift+Z / Ctrl+Y). */
  combos: string[][];
  label: string;
}

export default function ShortcutsDialog() {
  const open = useAppStore((s) => s.ui.shortcutsOpen);
  const setUI = useAppStore((s) => s.setUI);
  const { t } = useI18n();

  const rows: ShortcutRow[] = [
    { combos: [["N"]], label: t("shortcuts.newTask") },
    { combos: [["/"]], label: t("shortcuts.search") },
    {
      combos: [[t("shortcuts.key.ctrl"), "K"]],
      label: t("shortcuts.globalSearch"),
    },
    { combos: [[t("shortcuts.key.esc")]], label: t("shortcuts.close") },
    {
      combos: [[t("shortcuts.key.ctrl"), "Z"]],
      label: t("shortcuts.undo"),
    },
    {
      combos: [
        [t("shortcuts.key.ctrl"), t("shortcuts.key.shift"), "Z"],
        [t("shortcuts.key.ctrl"), "Y"],
      ],
      label: t("shortcuts.redo"),
    },
    { combos: [["?"]], label: t("shortcuts.help") },
    {
      combos: [[t("shortcuts.key.space"), "←↑↓→"]],
      label: t("shortcuts.kbdDrag"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => setUI({ shortcutsOpen: o })}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold tracking-tight">
            {t("shortcuts.title")}
          </DialogTitle>
          <DialogDescription>{t("shortcuts.subtitle")}</DialogDescription>
        </DialogHeader>

        <ul className="max-h-[60vh] space-y-2 overflow-y-auto scrollbar-slim pr-1">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                {row.combos.map((combo, i) => (
                  <span key={combo.join("+")} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span
                        className="text-xs text-muted-foreground/60"
                        aria-hidden="true"
                      >
                        /
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {combo.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </span>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
