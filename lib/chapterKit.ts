import type { LevelId } from "@/lib/levels";
import type { Question } from "@/lib/quests";

export type Theme = "village" | "market" | "port" | "peaks";

export type Npc = {
  id: string;
  name: string;
  color: string; // HEX, т.к. рисуем на canvas
  x: number;
  y: number; // уровень, на котором стоит житель (ноги)
  lines: string[]; // что говорит перед заданием
  after: string; // что говорит, если с ним заговорить снова
  question: Question;
};

export type Platform = { x: number; y: number; w: number }; // можно запрыгнуть снизу
export type Block = { x: number; y: number; w: number; h: number }; // сплошной блок

export type Chapter = {
  id: string;
  land: string;
  level: LevelId;
  order: number;
  xp: number;
  title: string;
  theme: Theme;
  intro: string[];
  outro: string[];
  width: number;
  goalX: number;
  platforms: Platform[];
  blocks: Block[];
  npcs: Npc[];
};

export type Layout = {
  width: number;
  goalX: number;
  platforms: Platform[];
  blocks: Block[];
  slots: { x: number; y: number }[];
};

export type Meta = Pick<
  Chapter,
  "id" | "level" | "order" | "xp" | "title" | "theme" | "intro" | "outro"
>;

export type NpcDef = Omit<Npc, "id" | "x" | "y">;

export function make(
  meta: Meta,
  layout: Layout,
  defs: NpcDef[],
  land = "english",
): Chapter {
  return {
    ...meta,
    land,
    width: layout.width,
    goalX: layout.goalX,
    platforms: layout.platforms,
    blocks: layout.blocks,
    npcs: defs.map((d, i) => ({
      ...d,
      id: `${meta.id}-${i}`,
      x: layout.slots[i].x,
      y: layout.slots[i].y,
    })),
  };
}

// Раскладка A: высокий житель третий по счёту
export const LAYOUT_A: Layout = {
  width: 4300,
  goalX: 4080,
  platforms: [
    { x: 1560, y: 350, w: 150 },
    { x: 1740, y: 285, w: 130 },
    { x: 1900, y: 225, w: 200 },
    { x: 3050, y: 340, w: 120 },
  ],
  blocks: [
    { x: 880, y: 370, w: 110, h: 50 },
    { x: 2300, y: 380, w: 90, h: 40 },
    { x: 2390, y: 340, w: 90, h: 80 },
    { x: 2480, y: 380, w: 90, h: 40 },
  ],
  slots: [
    { x: 640, y: 420 },
    { x: 1230, y: 420 },
    { x: 2010, y: 225 },
    { x: 2760, y: 420 },
    { x: 3300, y: 420 },
    { x: 3800, y: 420 },
  ],
};

// Раскладка B: высокий житель второй, четвёртый стоит на помосте
export const LAYOUT_B: Layout = {
  width: 4300,
  goalX: 4080,
  platforms: [
    { x: 700, y: 350, w: 140 },
    { x: 880, y: 285, w: 130 },
    { x: 1040, y: 225, w: 180 },
    { x: 2330, y: 340, w: 160 },
  ],
  blocks: [
    { x: 1450, y: 370, w: 100, h: 50 },
    { x: 2800, y: 380, w: 90, h: 40 },
    { x: 2890, y: 340, w: 90, h: 80 },
    { x: 2980, y: 380, w: 90, h: 40 },
  ],
  slots: [
    { x: 560, y: 420 },
    { x: 1130, y: 225 },
    { x: 1850, y: 420 },
    { x: 2410, y: 340 },
    { x: 3300, y: 420 },
    { x: 3800, y: 420 },
  ],
};
