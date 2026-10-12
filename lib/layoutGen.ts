// Генератор расстановки мира: из набора «кусочков» собирает тропу от старта до цели.
// Размеры подобраны под физику героя: прыжок вверх до ~110 px, вперёд до ~160 px.

export type Platform = { x: number; y: number; w: number };
export type Block = { x: number; y: number; w: number; h: number };
export type Spike = { x: number; w: number }; // шипы на земле
// Движущаяся платформа: центр по x, верхняя грань по y, колеблется на ax / ay
export type Mover = {
  x: number;
  y: number;
  w: number;
  ax: number;
  ay: number;
  sp: number;
  ph: number;
};
export type Gem = { x: number; y: number };

export type Layout = {
  width: number;
  goalX: number;
  platforms: Platform[];
  blocks: Block[];
  spikes: Spike[];
  movers: Mover[];
  gems: Gem[];
  slots: { x: number; y: number }[];
};

const GROUND = 420;

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Kind = "flat" | "hill" | "spikes" | "stairs" | "pit" | "lift" | "tower";

type Seg = {
  w: number;
  slot: { x: number; y: number };
  platforms: Platform[];
  blocks: Block[];
  spikes: Spike[];
  movers: Mover[];
  gems: Gem[];
};

// Дуга из кристаллов над точкой: награда за прыжок
function arc(cx: number, baseY: number, n: number, spread: number, height: number): Gem[] {
  return Array.from({ length: n }, (_, i) => {
    const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
    return { x: Math.round(cx + u * spread), y: Math.round(baseY - height * (1 - u * u)) };
  });
}

function segment(kind: Kind, x0: number, rnd: () => number): Seg {
  const empty = { platforms: [], blocks: [], spikes: [], movers: [], gems: [] };

  switch (kind) {
    case "flat":
      return {
        ...empty,
        w: 500,
        slot: { x: x0 + 330, y: GROUND },
        gems: arc(x0 + 150, 392, 5, 70, 34),
      };

    case "hill":
      return {
        ...empty,
        w: 640,
        blocks: [
          { x: x0 + 130, y: 380, w: 90, h: 40 },
          { x: x0 + 220, y: 340, w: 90, h: 80 },
          { x: x0 + 310, y: 380, w: 90, h: 40 },
        ],
        slot: { x: x0 + 490, y: GROUND },
        gems: [{ x: x0 + 265, y: 304 }, { x: x0 + 265, y: 276 }],
      };

    case "spikes": {
      const sw = 66 + Math.floor(rnd() * 28);
      const sx = x0 + 170;
      const spikes: Spike[] = [{ x: sx, w: sw }];
      let w = 640;
      let slotX = x0 + 480;
      let gems = arc(sx + sw / 2, 388, 5, sw / 2 + 22, 52);
      if (rnd() > 0.5) {
        const sw2 = 66 + Math.floor(rnd() * 24);
        const sx2 = sx + sw + 120;
        spikes.push({ x: sx2, w: sw2 });
        gems = gems.concat(arc(sx2 + sw2 / 2, 388, 5, sw2 / 2 + 22, 52));
        w = 800;
        slotX = x0 + 640;
      }
      return { ...empty, w, spikes, slot: { x: slotX, y: GROUND }, gems };
    }

    case "stairs":
      return {
        ...empty,
        w: 740,
        platforms: [
          { x: x0 + 90, y: 350, w: 150 },
          { x: x0 + 270, y: 285, w: 130 },
          { x: x0 + 430, y: 225, w: 200 },
        ],
        slot: { x: x0 + 535, y: 225 },
        gems: [
          { x: x0 + 165, y: 318 },
          { x: x0 + 335, y: 253 },
          { x: x0 + 470, y: 192 },
        ],
      };

    case "pit": {
      return {
        ...empty,
        w: 880,
        spikes: [{ x: x0 + 160, w: 320 }],
        movers: [
          {
            x: x0 + 320,
            y: 350,
            w: 110,
            ax: 100,
            ay: 0,
            sp: 0.9 + rnd() * 0.3,
            ph: rnd() * 6.28,
          },
        ],
        slot: { x: x0 + 680, y: GROUND },
        gems: arc(x0 + 320, 318, 5, 120, 20),
      };
    }

    case "lift":
      return {
        ...empty,
        w: 760,
        movers: [
          {
            x: x0 + 170,
            y: 331,
            w: 100,
            ax: 0,
            ay: 69,
            sp: 0.9 + rnd() * 0.25,
            ph: rnd() * 6.28,
          },
        ],
        platforms: [{ x: x0 + 250, y: 250, w: 190 }],
        slot: { x: x0 + 345, y: 250 },
        gems: [
          { x: x0 + 170, y: 222 },
          { x: x0 + 300, y: 218 },
          { x: x0 + 395, y: 218 },
        ],
      };

    case "tower":
      return {
        ...empty,
        w: 700,
        blocks: [
          { x: x0 + 110, y: 380, w: 90, h: 40 },
          { x: x0 + 200, y: 340, w: 90, h: 80 },
          { x: x0 + 290, y: 300, w: 120, h: 120 },
        ],
        slot: { x: x0 + 350, y: 300 },
        gems: [
          { x: x0 + 155, y: 345 },
          { x: x0 + 245, y: 305 },
          { x: x0 + 440, y: 330 },
        ],
      };
  }
}

const ALL: Kind[] = ["flat", "hill", "spikes", "stairs", "pit", "lift", "tower"];

function shuffle<T>(list: T[], rnd: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Один и тот же seed всегда даёт один и тот же мир
export function buildLayout(seed: string, npcCount: number): Layout {
  const rnd = mulberry32(hashStr(seed));
  const kinds: Kind[] = [];
  let bag: Kind[] = [];

  while (kinds.length < npcCount) {
    if (bag.length === 0) {
      bag = shuffle(ALL, rnd);
      // чтобы подряд не шли два одинаковых кусочка
      if (bag[bag.length - 1] === kinds[kinds.length - 1]) bag.reverse();
    }
    // первый житель без ловушек: игрок осваивается
    const pick =
      kinds.length === 0
        ? (bag.findIndex((k) => k === "flat" || k === "hill"))
        : bag.length - 1;
    const idx = pick >= 0 ? pick : bag.length - 1;
    kinds.push(bag.splice(idx, 1)[0]);
  }

  const out: Layout = {
    width: 0,
    goalX: 0,
    platforms: [],
    blocks: [],
    spikes: [],
    movers: [],
    gems: [],
    slots: [],
  };

  let x = 320;
  for (const kind of kinds) {
    const s = segment(kind, x, rnd);
    out.platforms.push(...s.platforms);
    out.blocks.push(...s.blocks);
    out.spikes.push(...s.spikes);
    out.movers.push(...s.movers);
    out.gems.push(...s.gems);
    out.slots.push(s.slot);
    x += s.w;
  }

  out.goalX = x + 180;
  out.width = out.goalX + 240;
  return out;
}
