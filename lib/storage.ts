import { START_HERO } from "@/lib/hero";
import type { Hero } from "@/lib/hero";
import type { LevelId } from "@/lib/levels";
import type { VocabEntry } from "@/lib/vocab";

export type SaveData = {
  hero: Hero;
  done: string[]; // id земель, где сегодня квест пройден
  focus: string[]; // выбранные земли
  level: LevelId; // выбранный уровень английского
  codeLevel: LevelId; // выбранный уровень программирования
  passed: string[]; // id пройденных глав (навсегда)
  vocab: VocabEntry[]; // личный словарь английских слов
};

const KEY = "questlands-save";

export const EMPTY_SAVE: SaveData = {
  hero: START_HERO,
  done: [],
  focus: [],
  level: "a0",
  codeLevel: "a0",
  passed: [],
  vocab: [],
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    // merge: старые сохранения без новых полей тоже подхватятся
    if (raw) return { ...EMPTY_SAVE, ...(JSON.parse(raw) as Partial<SaveData>) };
  } catch {
    /* хранилище недоступно */
  }
  return EMPTY_SAVE;
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* хранилище недоступно */
  }
}