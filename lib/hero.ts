import { LANDS, RANKS } from "@/lib/lands";

export type Hero = { xp: number; lives: number; streak: number };

export const MAX_LIVES = 3;

export const START_HERO: Hero = { xp: 0, lives: MAX_LIVES, streak: 0 };

export function getRank(xp: number) {
  const current = [...RANKS].reverse().find((r) => xp >= r.xp) ?? RANKS[0];
  const next = RANKS.find((r) => r.xp > xp) ?? null;
  return { current, next };
}

// По одному квесту из каждой земли
export function getTodayQuests() {
  return LANDS.flatMap((land) =>
    land.quests.slice(0, 1).map((q) => ({
      id: land.id,
      land: land.name,
      color: land.color,
      title: q.title,
      xp: q.xp,
    })),
  );
}