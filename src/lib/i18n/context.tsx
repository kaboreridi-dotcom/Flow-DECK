"use client";
// Flow DECK — language context (browser detection + persisted preference)
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { detectBrowserLang, loadLang, saveLang } from "@/lib/kanban/storage";
import { messages } from "./translations";
import { panelMessages } from "./panel-messages";
import { viewMessages } from "./view-messages";
import type { Lang } from "@/lib/kanban/types";

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translator;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function build(lang: Lang): Record<string, string> {
  return {
    ...messages[lang],
    ...panelMessages[lang],
    ...viewMessages[lang],
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  // Detect on mount (client only): persisted choice wins, else browser language.
  useEffect(() => {
    const stored = loadLang();
    const detected: Lang = stored === "fr" || stored === "en" ? stored : detectBrowserLang();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(detected);
    document.documentElement.lang = detected;
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    saveLang(l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback<Translator>(
    (key, vars) => {
      const dict = build(lang);
      let str = dict[key] ?? messages.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}

export function useLang(): Lang {
  return useI18n().lang;
}
