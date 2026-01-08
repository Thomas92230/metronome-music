import { Preset } from "../types/preset";

const KEY = "metronome-presets";

export function loadPresets(): Preset[] {
  if (typeof window === "undefined") return [];

  try {
    const data = window.localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePresets(presets: Preset[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(KEY, JSON.stringify(presets));
}
