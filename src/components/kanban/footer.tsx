"use client";
// Flow DECK — footer with copyright
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function AppFooter({ logoError }: { logoError?: (e: React.SyntheticEvent<HTMLImageElement>) => void }) {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-20 mt-auto shrink-0 border-t bg-background/70 backdrop-blur-md">
      <div className="flex flex-col items-center justify-between gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Image
            src="/flowdeck-logo.png"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] rounded-md object-cover"
            onError={logoError}
          />
          <span className="font-display font-semibold text-foreground/80">Flow DECK</span>
          <span aria-hidden>·</span>
          <span className="hidden sm:inline">{t("footer.tagline")}</span>
          <span className="inline-flex items-center gap-1 sm:hidden">{t("footer.tagline")}</span>
        </div>

        <div className="flex flex-col items-center gap-0.5 sm:items-end">
          <p className="text-xs font-medium text-foreground/80">
            {t("footer.copyright", { year })} <span className="text-muted-foreground">— {t("footer.rights")}</span>
          </p>
          <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-primary" />
            {t("footer.local")}
          </p>
        </div>
      </div>
    </footer>
  );
}
