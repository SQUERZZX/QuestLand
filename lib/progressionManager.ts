import { CHAPTERS } from "@/lib/chapters";
import type { Chapter } from "@/lib/chapters";
import { MAX_LIVES } from "@/lib/hero";
import { LANDS } from "@/lib/lands";
import { LEVELS } from "@/lib/levels";
import type { Level, LevelId } from "@/lib/levels";
import type { SaveData } from "@/lib/storage";

export type DailyQuest = {
  id: string; // что открывать: id главы или id земли
  landId: string;
  land: string;
  color: string;
  title: string;
  xp: number;
};

export type Completion = {
  save: SaveData;
  awarded: boolean;
  finishedLevel: LevelId | null;
};

export function hasChapters(landId: string): boolean {
  return Object.values(CHAPTERS).some((c) => c.land === landId);
}

export function chaptersOf(landId: string, level: LevelId): Chapter[] {
  return Object.values(CHAPTERS)
    .filter((c) => c.land === landId && c.level === level)
    .sort((a, b) => a.order - b.order);
}

export function levelProgress(save: SaveData, level: LevelId) {
  const list = chaptersOf("english", level);
  const passed = list.filter((c) => save.passed.includes(c.id)).length;
  return {
    passed,
    total: list.length,
    complete: list.length > 0 && passed === list.length,
  };
}

export function nextLevelOf(level: LevelId): Level | null {
  const i = LEVELS.findIndex((l) => l.id === level);
  return i >= 0 && i + 1 < LEVELS.length ? LEVELS[i + 1] : null;
}

// По одному квесту в день на каждую выбранную землю
export function getDailyQuests(save: SaveData): DailyQuest[] {
  const levelCode = LEVELS.find((l) => l.id === save.level)?.code ?? "";

  return LANDS.filter((land) => save.focus.includes(land.id)).map((land) => {
    const list = chaptersOf(land.id, save.level);

    if (list.length > 0) {
      const chapter =
        list.find((c) => !save.passed.includes(c.id)) ?? list[list.length - 1];
      return {
        id: chapter.id,
        landId: land.id,
        land: land.name,
        color: land.color,
        title: `${levelCode} · ${chapter.title}`,
        xp: chapter.xp,
      };
    }

    const quest = land.quests[0];
    return {
      id: land.id,
      landId: land.id,
      land: land.name,
      color: land.color,
      title: quest.title,
      xp: quest.xp,
    };
  });
}

// Квест пройден: XP, глава в «пройденных», серия, повышение уровня
export function applyCompletion(
  save: SaveData,
  landId: string,
  questId: string,
  xp: number,
): Completion {
  if (save.done.includes(landId)) {
    return { save, awarded: false, finishedLevel: null };
  }

  const done = [...save.done, landId];
  const passed = save.passed.includes(questId)
    ? save.passed
    : [...save.passed, questId];

  let updated: SaveData = {
    ...save,
    done,
    passed,
    hero: { ...save.hero, xp: save.hero.xp + xp },
  };

  const chapter = CHAPTERS[questId] as Chapter | undefined;
  let finishedLevel: LevelId | null = null;

  if (
    chapter &&
    !save.passed.includes(questId) &&
    levelProgress(updated, chapter.level).complete
  ) {
    finishedLevel = chapter.level;
    const next = nextLevelOf(chapter.level);
    if (next && save.level === chapter.level) {
      updated = { ...updated, level: next.id };
    }
  }

  const quests = getDailyQuests(updated);
  const allDone =
    quests.length > 0 && quests.every((q) => done.includes(q.landId));
  if (allDone) {
    updated = {
      ...updated,
      hero: { ...updated.hero, streak: updated.hero.streak + 1 },
    };
  }

  return { save: updated, awarded: true, finishedLevel };
}

// Пропуск дня: минус жизнь. Последняя жизнь — сброс XP, серии и глав текущего уровня.
export function skipDay(save: SaveData): { save: SaveData; fallen: boolean } {
  const lives = save.hero.lives - 1;

  if (lives > 0) {
    return {
      save: { ...save, done: [], hero: { ...save.hero, lives, streak: 0 } },
      fallen: false,
    };
  }

  return {
    save: {
      ...save,
      done: [],
      hero: { xp: 0, lives: MAX_LIVES, streak: 0 },
      passed: save.passed.filter((id) => CHAPTERS[id]?.level !== save.level),
    },
    fallen: true,
  };
}