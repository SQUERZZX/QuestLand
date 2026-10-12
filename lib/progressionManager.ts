import { CHAPTERS } from "@/lib/chapters";
import type { Chapter } from "@/lib/chapters";
import { MAX_LIVES } from "@/lib/hero";
import { LANDS } from "@/lib/lands";
import { LEVELS, levelsOf } from "@/lib/levels";
import type { Level, LevelId } from "@/lib/levels";
import type { SaveData } from "@/lib/storage";

export type QuestState = "open" | "locked" | "done";

export type DailyQuest = {
  id: string; // что открывать: id главы или id земли
  landId: string;
  land: string;
  color: string;
  title: string;
  xp: number;
  state: QuestState;
  replay?: boolean; // глава уже пройдена, можно сыграть ещё раз без награды
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

// Выбранный уровень зависит от земли: у английского и у кода они свои
export function getLevel(save: SaveData, landId: string): LevelId {
  return landId === "code" ? save.codeLevel : save.level;
}

export function setLevel(
  save: SaveData,
  landId: string,
  level: LevelId,
): SaveData {
  return landId === "code" ? { ...save, codeLevel: level } : { ...save, level };
}

export function levelProgress(
  save: SaveData,
  level: LevelId,
  landId = "english",
) {
  const list = chaptersOf(landId, level);
  const passed = list.filter((c) => save.passed.includes(c.id)).length;
  return {
    passed,
    total: list.length,
    complete: list.length > 0 && passed === list.length,
  };
}

export function nextLevelOf(level: LevelId, landId = "english"): Level | null {
  const levels = levelsOf(landId).length > 0 ? levelsOf(landId) : LEVELS;
  const i = levels.findIndex((l) => l.id === level);
  return i >= 0 && i + 1 < levels.length ? levels[i + 1] : null;
}

// Сегодня сделана хотя бы одна глава в каждой выбранной земле: серия засчитывается
function allLandsDone(focus: string[], done: string[]): boolean {
  const lands = LANDS.filter((land) => focus.includes(land.id));
  return lands.length > 0 && lands.every((land) => done.includes(land.id));
}

// Для земель с главами: все главы выбранного уровня по порядку.
// Открыта первая непройденная, следующие закрыты, пока не пройдена предыдущая.
// Для остальных земель: один квест в день, как раньше.
export function getDailyQuests(save: SaveData): DailyQuest[] {
  return LANDS.filter((land) => save.focus.includes(land.id)).flatMap(
    (land): DailyQuest[] => {
      const level = getLevel(save, land.id);
      const levelCode = levelsOf(land.id).find((l) => l.id === level)?.code ?? "";
      const list = chaptersOf(land.id, level);

      if (list.length > 0) {
        const nextIndex = list.findIndex((c) => !save.passed.includes(c.id));
        return list.map((chapter, i): DailyQuest => {
          const passed = save.passed.includes(chapter.id);
          const state: QuestState = passed
            ? "done"
            : i === nextIndex
              ? "open"
              : "locked";
          return {
            id: chapter.id,
            landId: land.id,
            land: land.name,
            color: land.color,
            title: `${levelCode} · Глава ${chapter.order}: ${chapter.title}`,
            xp: chapter.xp,
            state,
            replay: passed,
          };
        });
      }

      const quest = land.quests[0];
      return [
        {
          id: land.id,
          landId: land.id,
          land: land.name,
          color: land.color,
          title: quest.title,
          xp: quest.xp,
          state: save.done.includes(land.id) ? "done" : "open",
        },
      ];
    },
  );
}

// Квест пройден: XP, глава в «пройденных», серия, повышение уровня
export function applyCompletion(
  save: SaveData,
  landId: string,
  questId: string,
  xp: number,
): Completion {
  const chapter = CHAPTERS[questId] as Chapter | undefined;

  // Главы награждаются один раз, обычные квесты один раз в день
  const alreadyRewarded = chapter
    ? save.passed.includes(questId)
    : save.done.includes(landId);
  if (alreadyRewarded) {
    return { save, awarded: false, finishedLevel: null };
  }

  const wasAllDone = allLandsDone(save.focus, save.done);
  const done = save.done.includes(landId) ? save.done : [...save.done, landId];
  const passed = chapter ? [...save.passed, questId] : save.passed;

  let updated: SaveData = {
    ...save,
    done,
    passed,
    hero: { ...save.hero, xp: save.hero.xp + xp },
  };

  let finishedLevel: LevelId | null = null;

  if (chapter && levelProgress(updated, chapter.level, chapter.land).complete) {
    finishedLevel = chapter.level;
    const next = nextLevelOf(chapter.level, chapter.land);
    if (next && getLevel(save, chapter.land) === chapter.level) {
      updated = setLevel(updated, chapter.land, next.id);
    }
  }

  if (!wasAllDone && allLandsDone(updated.focus, done)) {
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
      passed: save.passed.filter((id) => {
        const c = CHAPTERS[id];
        return !c || c.level !== getLevel(save, c.land);
      }),
    },
    fallen: true,
  };
}