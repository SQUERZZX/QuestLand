import { loadSave, writeSave } from "@/lib/storage";
import type { Question } from "@/lib/quests";

export type VocabStatus = "learning" | "known";

export type WordPair = { en: string; ru: string };

export type VocabEntry = WordPair & {
  status: VocabStatus;
  chapterId?: string; // где встретилось слово
  added: number; // время добавления
};

const LAT = /[A-Za-z]/;
const CYR = /[А-Яа-яЁё]/;

// Достаём пару «слово — перевод» из вопроса про перевод.
// Грамматические вопросы («выбери верный вариант», пропуски ___) пропускаем.
export function wordOf(q: Question): WordPair | null {
  if (/_{2,}/.test(q.prompt)) return null;
  const m = q.prompt.match(/«([^»]+)»/);
  const right = q.options[q.answer]?.trim();
  if (!m || !right) return null;
  const quoted = m[1].trim();

  // «journey» -> Путешествие
  if (LAT.test(quoted) && !CYR.test(quoted) && !LAT.test(right)) {
    return { en: quoted, ru: right };
  }
  // «Доброе утро» -> Good morning
  if (CYR.test(quoted) && !LAT.test(quoted) && LAT.test(right) && !CYR.test(right)) {
    return { en: right, ru: quoted };
  }
  return null;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function getVocab(): VocabEntry[] {
  return loadSave().vocab ?? [];
}

export function statusOf(en: string): VocabStatus | null {
  return getVocab().find((w) => same(w.en, en))?.status ?? null;
}

export function setVocab(list: VocabEntry[]) {
  writeSave({ ...loadSave(), vocab: list });
}

// «Знаю» -> known, «Не знаю» -> learning. Если слово уже есть, просто меняем статус.
export function markWord(pair: WordPair, status: VocabStatus, chapterId?: string) {
  const list = getVocab();
  const has = list.some((w) => same(w.en, pair.en));
  setVocab(
    has
      ? list.map((w) => (same(w.en, pair.en) ? { ...w, status } : w))
      : [...list, { ...pair, status, chapterId, added: Date.now() }],
  );
}
