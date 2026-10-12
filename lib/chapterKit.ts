import type { LevelId } from "@/lib/levels";
import type { Question } from "@/lib/quests";
import type { CodeTask } from "@/lib/codeTasks";
import { buildLayout } from "@/lib/layoutGen";
import type { Block, Gem, Mover, Platform, Spike } from "@/lib/layoutGen";

export type { Block, Gem, Mover, Platform, Spike } from "@/lib/layoutGen";

export type Theme =
  | "village"
  | "market"
  | "port"
  | "peaks"
  | "forest"
  | "cave"
  | "ruins"
  | "space";

export type Hat = "none" | "cap" | "hood" | "hat" | "helm" | "headband" | "bun";
export type Build = "slim" | "normal" | "stout";
export type Prop = "none" | "staff" | "basket" | "book" | "lantern" | "tool" | "rod";

// Внешность жителя: считается из имени, чтобы все были разными
export type NpcLook = {
  skin: string;
  hair: string;
  hat: Hat;
  build: Build;
  prop: Prop;
  beard: boolean;
  robe: boolean;
};

export type Npc = {
  id: string;
  name: string;
  color: string; // HEX, т.к. рисуем на canvas
  x: number;
  y: number; // уровень, на котором стоит житель (ноги)
  lines: string[]; // что говорит перед заданием
  after: string; // что говорит, если с ним заговорить снова
  question: Question;
  task?: CodeTask; // если задано, вместо вариантов ответа открывается терминал
  look: NpcLook;
};

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
  spikes: Spike[];
  movers: Mover[];
  gems: Gem[];
  npcs: Npc[];
};

export type Meta = Pick<
  Chapter,
  "id" | "level" | "order" | "xp" | "title" | "theme" | "intro" | "outro"
>;

export type NpcDef = Omit<Npc, "id" | "x" | "y" | "look">;

// Тема каждой главы: соседние главы выглядят по-разному
const THEME_BY_ID: Record<string, Theme> = {
  "english-a0-1": "village",
  "english-a0-2": "forest",
  "english-a0-3": "village",
  "english-a0-4": "forest",
  "english-a1-1": "market",
  "english-a1-2": "market",
  "english-a1-3": "market",
  "english-a1-4": "ruins",
  "english-a2-1": "port",
  "english-a2-2": "cave",
  "english-a2-3": "port",
  "english-a2-4": "port",
  "english-b1-1": "peaks",
  "english-b1-2": "peaks",
  "english-b1-3": "ruins",
  "english-b1-4": "peaks",
  "code-a0-1": "forest",
  "code-a0-2": "village",
  "code-a0-3": "forest",
  "code-a0-4": "cave",
  "code-a1-1": "market",
  "code-a1-2": "ruins",
  "code-a1-3": "cave",
  "code-a1-4": "space",
  "code-a2-1": "port",
  "code-a2-2": "cave",
  "code-a2-3": "market",
  "code-a2-4": "port",
  "code-b1-1": "peaks",
  "code-b1-2": "forest",
  "code-b1-3": "ruins",
  "code-b1-4": "space",
};

const SKINS = ["#ffd9a8", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#f7e0c8"];
const HAIRS = ["#2b1b12", "#5a3825", "#a0522d", "#d9a441", "#8a8f9c", "#e8e2d0", "#7a2e2e"];
const HATS: Hat[] = ["none", "cap", "hood", "hat", "helm", "headband", "bun"];
const BUILDS: Build[] = ["slim", "normal", "stout"];
const PROPS: Prop[] = ["none", "staff", "basket", "book", "lantern", "tool", "rod"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Профессия в имени подсказывает предмет и головной убор
const ROLES: { re: RegExp; prop: Prop; hat?: Hat; beard?: boolean }[] = [
  { re: /рыбак|моряк|матрос|капитан|корабел|штурман|боцман/i, prop: "rod", hat: "cap" },
  { re: /лавочн|торгов|продав|пекар|кладовщ|повар|булоч|хозяйк|трактирщ/i, prop: "basket", hat: "bun" },
  { re: /сова|учён|учен|библиотек|монах|писар|мудрец|архив|хакер|старик|дед/i, prop: "book", hat: "hood", beard: true },
  { re: /кузнец|плотник|мастер|дровосек|мельник|лесник|строител|смотритель/i, prop: "tool", hat: "cap" },
  { re: /страж|воин|рыцар|охранн|гвард/i, prop: "staff", hat: "helm" },
  { re: /проводник|путник|следопыт|гонец|посыльн|разведч/i, prop: "lantern", hat: "hat" },
];

function lookFor(name: string, index: number): NpcLook {
  const h = hash(name + index);
  const role = ROLES.find((r) => r.re.test(name));
  const fem = /ца\b|ка\b|ша\b|иса\b|ра\b|на\b|лина\b|мэй|мира|нора|софа/i.test(name);
  return {
    skin: SKINS[h % SKINS.length],
    hair: HAIRS[(h >> 3) % HAIRS.length],
    hat: role?.hat ?? HATS[(h >> 6) % HATS.length],
    build: BUILDS[(h >> 9) % BUILDS.length],
    prop: role?.prop ?? PROPS[(h >> 12) % PROPS.length],
    beard: !fem && (role?.beard ?? (h >> 15) % 4 === 0),
    robe: (h >> 18) % 3 === 0 || /монах|мудрец|сова/i.test(name),
  };
}

// Мир (длина, ловушки, платформы, кристаллы) собирается по id главы и числу жителей
export function make(meta: Meta, defs: NpcDef[], land = "english"): Chapter {
  const layout = buildLayout(meta.id, defs.length);
  return {
    ...meta,
    theme: THEME_BY_ID[meta.id] ?? meta.theme,
    land,
    width: layout.width,
    goalX: layout.goalX,
    platforms: layout.platforms,
    blocks: layout.blocks,
    spikes: layout.spikes,
    movers: layout.movers,
    gems: layout.gems,
    npcs: defs.map((d, i) => ({
      ...d,
      id: `${meta.id}-${i}`,
      x: layout.slots[i].x,
      y: layout.slots[i].y,
      look: lookFor(d.name, i),
    })),
  };
}
