// Flow DECK — LocalStorage persistence (robust against corruption & quota)
import type { AppData } from "./types";
import { emptyData, sanitizeAppData } from "./validation";

const DATA_KEY = "flowdeck:data";
const BACKUP_KEY = "flowdeck:backup";
const LANG_KEY = "flowdeck:lang";
const SEEN_KEY = "flowdeck:seen";

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export interface LoadResult {
  data: AppData | null; // null → first run
  corrupted: boolean; // previous payload was unreadable
}

export function loadData(): LoadResult {
  if (!isBrowser()) return { data: null, corrupted: false };
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (!raw) return { data: null, corrupted: false };
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      window.localStorage.setItem(BACKUP_KEY, raw.slice(0, 500_000));
      window.localStorage.removeItem(DATA_KEY);
      return { data: null, corrupted: true };
    }
    const data = sanitizeAppData(parsed);
    if (!data) {
      window.localStorage.setItem(BACKUP_KEY, raw.slice(0, 500_000));
      window.localStorage.removeItem(DATA_KEY);
      return { data: null, corrupted: true };
    }
    return { data, corrupted: false };
  } catch {
    return { data: null, corrupted: false };
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSaveError = false;

export function saveData(data: AppData, immediate = false): void {
  if (!isBrowser()) return;
  const doSave = () => {
    try {
      window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
      lastSaveError = false;
    } catch {
      // Quota exceeded or storage unavailable — signal via callback, never crash.
      if (!lastSaveError) {
        lastSaveError = true;
        window.dispatchEvent(new CustomEvent("flowdeck:storage-error"));
      }
    }
  };
  if (immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    doSave();
    return;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 350);
}

export function saveLang(lang: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* non blocking */
  }
}

export function loadLang(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
}

export function detectBrowserLang(): "fr" | "en" {
  if (!isBrowser()) return "en";
  const langs = Array.isArray(window.navigator.languages) ? window.navigator.languages : [window.navigator.language];
  for (const l of langs) {
    if (l && l.toLowerCase().startsWith("fr")) return "fr";
  }
  return "en";
}

export function markSeen(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasSeen(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function firstRunData(): AppData {
  // Deliberately empty: the store seeds the welcome board with localized names.
  return emptyData();
}
