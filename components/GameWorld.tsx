"use client";

import { useEffect, useRef, useState } from "react";
import WordCard from "@/components/WordCard";
import Link from "next/link";
import CodeChallenge from "@/components/CodeChallenge";
import type { Chapter, Theme } from "@/lib/chapters";
import type { Question } from "@/lib/quests";

const VIEW_H = 540;
const MIN_VIEW_W = 700;
const GROUND_Y = 420;
const HERO_W = 22;
const HERO_H = 48;
const SPEED = 230;
const JUMP = 640;
const GRAVITY = 1800;
const TALK_X = 80;
const TALK_Y = 60;

const LEFT_CODES = ["ArrowLeft", "KeyA"];
const RIGHT_CODES = ["ArrowRight", "KeyD"];
const JUMP_CODES = ["Space", "ArrowUp", "KeyW"];
const GAME_CODES = new Set([...LEFT_CODES, ...RIGHT_CODES, ...JUMP_CODES]);

const rnd = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: rnd(i + 1),
  y: rnd(i + 101),
  r: 1 + rnd(i + 201) * 1.6,
  p: rnd(i + 301) * 6.28,
}));

type Ambient =
  | "fireflies"
  | "lanterns"
  | "gulls"
  | "snow"
  | "leaves"
  | "motes"
  | "dust"
  | "meteors";
type Decor =
  | "pines"
  | "stalls"
  | "masts"
  | "trees"
  | "crystals"
  | "pillars"
  | "antennas";
type Goal = "lighthouse" | "worldtree" | "crystal" | "obelisk" | "rocket";

type ThemeStyle = {
  sky: [string, string, string];
  far: string;
  mid: string;
  grass: [string, string];
  dirt: [string, string];
  stars: number;
  orb: string;
  orbY: number;
  fog: string;
  ambient: Ambient;
  decor: Decor;
  goal: Goal;
  gem: string; // цвет кристаллов-наград и свечения платформ
  spike: string; // цвет шипов
  ceiling: boolean; // сталактиты сверху (пещера)
  ring: boolean; // кольцо у «луны» (космос)
  snowy: boolean;
};

const THEMES: Record<Theme, ThemeStyle> = {
  village: {
    sky: ["#070b1a", "#11193a", "#1d2a52"],
    far: "#101a38",
    mid: "#0f2236",
    grass: ["#1f8f6f", "#2dd4a0"],
    dirt: ["#2c2233", "#241c2d"],
    stars: 1,
    orb: "#f3eedf",
    orbY: 0.15,
    fog: "154,165,206",
    ambient: "fireflies",
    decor: "pines",
    goal: "lighthouse",
    gem: "#ffd166",
    spike: "#aab4d4",
    ceiling: false,
    ring: false,
    snowy: false,
  },
  market: {
    sky: ["#2a1233", "#7a3350", "#e8935a"],
    far: "#3a1f45",
    mid: "#2c1838",
    grass: ["#b36a2a", "#f4a300"],
    dirt: ["#3a2430", "#2e1c28"],
    stars: 0.25,
    orb: "#ffe2a8",
    orbY: 0.5,
    fog: "255,196,160",
    ambient: "lanterns",
    decor: "stalls",
    goal: "lighthouse",
    gem: "#ffe9a0",
    spike: "#c9a27a",
    ceiling: false,
    ring: false,
    snowy: false,
  },
  port: {
    sky: ["#06182b", "#0e3a5c", "#2a7aa0"],
    far: "#0b2a45",
    mid: "#0a2238",
    grass: ["#3b7f9a", "#7fd0e8"],
    dirt: ["#1f3447", "#182a3a"],
    stars: 0.6,
    orb: "#e8f6ff",
    orbY: 0.15,
    fog: "170,210,235",
    ambient: "gulls",
    decor: "masts",
    goal: "lighthouse",
    gem: "#7fe8ff",
    spike: "#b8c4d6",
    ceiling: false,
    ring: false,
    snowy: false,
  },
  peaks: {
    sky: ["#0d1030", "#2b2a5e", "#6d6aa8"],
    far: "#26274f",
    mid: "#1b1c3d",
    grass: ["#9ab0d6", "#eef4ff"],
    dirt: ["#2a2a44", "#1f1f36"],
    stars: 1,
    orb: "#ffffff",
    orbY: 0.12,
    fog: "220,230,255",
    ambient: "snow",
    decor: "pines",
    goal: "lighthouse",
    gem: "#bde0ff",
    spike: "#dfe9ff",
    ceiling: false,
    ring: false,
    snowy: true,
  },
  forest: {
    sky: ["#06130e", "#0f2e22", "#235f43"],
    far: "#0c2419",
    mid: "#0d3322",
    grass: ["#2f7d32", "#7bd652"],
    dirt: ["#2a2418", "#201b12"],
    stars: 0.35,
    orb: "#e9ffd0",
    orbY: 0.18,
    fog: "140,220,170",
    ambient: "leaves",
    decor: "trees",
    goal: "worldtree",
    gem: "#b6ff6b",
    spike: "#8a5a34",
    ceiling: false,
    ring: false,
    snowy: false,
  },
  cave: {
    sky: ["#05030f", "#150b2e", "#2a1650"],
    far: "#1a0f36",
    mid: "#140a2a",
    grass: ["#4b3a8c", "#8b7bff"],
    dirt: ["#1c1530", "#150f26"],
    stars: 0,
    orb: "#a78bfa",
    orbY: 0.22,
    fog: "150,120,230",
    ambient: "motes",
    decor: "crystals",
    goal: "crystal",
    gem: "#ff7be5",
    spike: "#c9b8ff",
    ceiling: true,
    ring: false,
    snowy: false,
  },
  ruins: {
    sky: ["#2b1b12", "#8a4a2e", "#f0b46a"],
    far: "#6e3a28",
    mid: "#5a2f22",
    grass: ["#b8863f", "#e6c070"],
    dirt: ["#4a3224", "#3a271c"],
    stars: 0.1,
    orb: "#fff0c8",
    orbY: 0.35,
    fog: "255,210,160",
    ambient: "dust",
    decor: "pillars",
    goal: "obelisk",
    gem: "#6ef2d5",
    spike: "#c4b49a",
    ceiling: false,
    ring: false,
    snowy: false,
  },
  space: {
    sky: ["#02030d", "#0a0f3a", "#2a1b6e"],
    far: "#1a1a55",
    mid: "#10123c",
    grass: ["#5b3fd1", "#9b8cff"],
    dirt: ["#14143a", "#0e0e2a"],
    stars: 1,
    orb: "#ffb86b",
    orbY: 0.22,
    fog: "130,140,255",
    ambient: "meteors",
    decor: "antennas",
    goal: "rocket",
    gem: "#7df9ff",
    spike: "#ff6b8b",
    ceiling: false,
    ring: true,
    snowy: false,
  },
};

const AMB_COUNT: Record<Ambient, number> = {
  fireflies: 36,
  lanterns: 30,
  gulls: 9,
  snow: 70,
  leaves: 34,
  motes: 44,
  dust: 44,
  meteors: 0,
};

// Цвета: затемнить/осветлить и смешать
const rgbOf = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const shade = (hex: string, amt: number) => {
  const f = (c: number) =>
    Math.round(Math.min(255, Math.max(0, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  const [r, g, b] = rgbOf(hex);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
const mix = (a: string, b: string, u: number) => {
  const [r1, g1, b1] = rgbOf(a);
  const [r2, g2, b2] = rgbOf(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * u);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
};

type Rect = { x: number; y: number; w: number; h: number };

type HeroState = {
  x: number;
  y: number; // ноги
  vx: number;
  vy: number;
  onGround: boolean;
  face: number;
  squash: number;
  dustT: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  life: number;
  max: number;
  size: number;
  grow: number;
  color: string;
};

type Dialogue =
  | { kind: "story"; lines: string[]; line: number; finish: boolean }
  | {
      kind: "npc";
      npc: number;
      lines: string[];
      line: number;
      asks: boolean;
      stage: "lines" | "question";
      picked: number | null;
    };

type Props = {
  chapter: Chapter;
  onFinish: (correct: number) => void;
};

export default function GameWorld({ chapter, onFinish }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef(new Set<string>());
  const heroRef = useRef<HeroState>({
    x: 120,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    onGround: true,
    face: 1,
    squash: 0,
    dustT: 0,
  });
  const nearRef = useRef<number | null>(null);
  const frozenRef = useRef(true);
  const correctRef = useRef(0);
  const resultsRef = useRef<(boolean | null)[]>([]);

  const total = chapter.npcs.length;

  const [dialogue, setDialogue] = useState<Dialogue | null>({
    kind: "story",
    lines: chapter.intro,
    line: 0,
    finish: false,
  });
  const [results, setResults] = useState<(boolean | null)[]>(() =>
    chapter.npcs.map(() => null),
  );
  const [near, setNear] = useState<number | null>(null);
  const [gemsGot, setGemsGot] = useState(0);

  const correctCount = results.filter((r) => r === true).length;
  const answeredCount = results.filter((r) => r !== null).length;

  useEffect(() => {
    frozenRef.current = dialogue !== null;
  }, [dialogue]);

  useEffect(() => {
    correctRef.current = correctCount;
    resultsRef.current = results;
  }, [correctCount, results]);

  // Страница под миром не прокручивается
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ---------- Диалоги ---------- */

  function startTalk(i: number) {
    const npc = chapter.npcs[i];
    const done = results[i] !== null;
    setDialogue({
      kind: "npc",
      npc: i,
      lines: done ? [npc.after] : npc.lines,
      line: 0,
      asks: !done,
      stage: "lines",
      picked: null,
    });
  }

  // Житель заговаривает сам, когда герой подходит
  useEffect(() => {
    if (dialogue === null && near !== null && results[near] === null) {
      startTalk(near);
    }
  });

  function next() {
    if (!dialogue) return;

    if (dialogue.kind === "story") {
      if (dialogue.line + 1 < dialogue.lines.length) {
        setDialogue({ ...dialogue, line: dialogue.line + 1 });
      } else if (dialogue.finish) {
        onFinish(correctCount);
      } else {
        setDialogue(null);
      }
      return;
    }

    if (dialogue.stage === "lines") {
      if (dialogue.line + 1 < dialogue.lines.length) {
        setDialogue({ ...dialogue, line: dialogue.line + 1 });
      } else if (dialogue.asks) {
        setDialogue({ ...dialogue, stage: "question" });
      } else {
        setDialogue(null);
      }
    }
  }

  function pick(i: number) {
    if (!dialogue || dialogue.kind !== "npc" || dialogue.stage !== "question") {
      return;
    }
    if (dialogue.picked !== null) return;
    const npcIndex = dialogue.npc;
    const q = chapter.npcs[npcIndex].question;
    setResults((r) => r.map((v, idx) => (idx === npcIndex ? i === q.answer : v)));
    setDialogue({ ...dialogue, picked: i });
  }

  // Задание с кодом: верно решено (true) или игрок сдался (false)
  function finishTask(ok: boolean) {
    if (!dialogue || dialogue.kind !== "npc") return;
    const npcIndex = dialogue.npc;
    setResults((r) => r.map((v, idx) => (idx === npcIndex ? ok : v)));
    const allDone = results.every((r, idx) => idx === npcIndex || r !== null);
    setDialogue(
      allDone
        ? { kind: "story", lines: chapter.outro, line: 0, finish: true }
        : null,
    );
  }

  function afterAnswer() {
    const allDone = results.every((r) => r !== null);
    setDialogue(
      allDone
        ? { kind: "story", lines: chapter.outro, line: 0, finish: true }
        : null,
    );
  }

  /* ---------- Клавиатура ---------- */

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (GAME_CODES.has(e.code)) {
        if (dialogue !== null) return;
        e.preventDefault();
        keysRef.current.add(e.code);
        return;
      }
      if (e.code === "KeyE" && dialogue === null && near !== null) {
        startTalk(near);
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    const clear = () => keysRef.current.clear();

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [dialogue, near, results]);

  /* ---------- Мир: физика и рисование ---------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const worldW = chapter.width;
    const th = THEMES[chapter.theme];

    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let scale = 1;
    let viewW = MIN_VIEW_W;
    let viewH = VIEW_H;
    let offsetY = 0;
    let camX = 0;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      scale = Math.min(cssH / VIEW_H, cssW / MIN_VIEW_W);
      viewW = cssW / scale;
      viewH = cssH / scale;
      offsetY = viewH - VIEW_H;
    };
    resize();
    window.addEventListener("resize", resize);

    const clamp = (v: number, min: number, max: number) =>
      Math.min(max, Math.max(min, v));
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const solids: Rect[] = [
      { x: 0, y: GROUND_Y, w: worldW, h: 400 },
      ...chapter.blocks,
    ];
    const platforms = chapter.platforms;
    const spikes = chapter.spikes;
    const movers = chapter.movers;
    const gems = chapter.gems.map((g) => ({ ...g, got: false }));
    let gemCount = 0;

    // Движущиеся платформы считаются по времени игры
    let simT = 0;
    let riding = -1; // на какой платформе стоит герой
    let hurtT = 0; // мигание после шипов
    let safeX = 120;
    let safeY = GROUND_Y;
    const moverPos = (m: (typeof movers)[number], tt: number) => {
      const k = Math.sin(tt * m.sp + m.ph);
      return { x: m.x + k * m.ax, y: m.y + k * m.ay };
    };
    const mNow = movers.map((m) => moverPos(m, 0));

    const overlaps = (h: HeroState, s: Rect) =>
      h.x - HERO_W / 2 < s.x + s.w &&
      h.x + HERO_W / 2 > s.x &&
      h.y - HERO_H < s.y + s.h &&
      h.y > s.y;

    // Декор на земле: не ставим рядом с жителями, блоками и платформами
    const decor: { x: number; h: number; seed: number }[] = [];
    for (let i = 1, x = 260; x < worldW - 200; i++, x += 200 + rnd(i) * 160) {
      const bad =
        chapter.npcs.some((n) => Math.abs(n.x - x) < 90) ||
        chapter.blocks.some((b) => x > b.x - 50 && x < b.x + b.w + 50) ||
        chapter.platforms.some((p) => x > p.x - 30 && x < p.x + p.w + 30) ||
        chapter.spikes.some((sp) => x > sp.x - 60 && x < sp.x + sp.w + 60) ||
        chapter.movers.some((m) => Math.abs(m.x - x) < m.ax + m.w + 20) ||
        Math.abs(chapter.goalX - x) < 140;
      if (!bad) decor.push({ x, h: 80 + rnd(i + 9) * 70, seed: rnd(i + 19) });
    }

    // Фоновые частицы: светлячки, фонарики, чайки или снег
    const amb = Array.from({ length: AMB_COUNT[th.ambient] }, (_, i) => ({
      x: rnd(i + 11) * worldW,
      y: 240 + rnd(i + 61) * 170,
      p: rnd(i + 111) * 6.28,
      s: 0.4 + rnd(i + 161) * 0.8,
    }));

    /* --- частицы эффектов --- */

    const parts: Particle[] = [];

    const spark = (x: number, y: number, color: string, n: number) => {
      if (calm) return;
      for (let i = 0; i < n; i++) {
        const life = rand(0.5, 1);
        parts.push({
          x,
          y,
          vx: rand(-130, 130),
          vy: rand(-260, -60),
          g: 520,
          life,
          max: life,
          size: rand(2, 4),
          grow: 0,
          color,
        });
      }
    };

    const dust = (x: number, y: number, n: number) => {
      if (calm) return;
      for (let i = 0; i < n; i++) {
        const life = rand(0.35, 0.65);
        parts.push({
          x: x + rand(-8, 8),
          y: y - 2,
          vx: rand(-45, 45),
          vy: rand(-45, -8),
          g: 0,
          life,
          max: life,
          size: rand(2, 3.5),
          grow: 5,
          color: "#c8cde1",
        });
      }
    };

    const updateParts = (dt: number) => {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    };

    const drawParts = () => {
      parts.forEach((p) => {
        const a = p.life / p.max;
        ctx.globalAlpha = a * (p.grow > 0 ? 0.5 : 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + p.grow * (1 - a), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    /* --- реакция жителей на ответ --- */

    const prevRes: (boolean | null)[] = chapter.npcs.map(() => null);
    const hopAt: number[] = chapter.npcs.map(() => -10);

    const watchResults = (t: number) => {
      const res = resultsRef.current;
      res.forEach((r, i) => {
        if (r === prevRes[i]) return;
        prevRes[i] = r;
        const n = chapter.npcs[i];
        if (r === true) {
          hopAt[i] = t;
          spark(n.x, n.y - 44, "#ffd166", 22);
          spark(n.x, n.y - 44, "#2dd4a0", 12);
        } else if (r === false) {
          dust(n.x, n.y - 30, 6);
        }
      });
    };

    /* --- физика --- */

    const step = (dt: number) => {
      const h = heroRef.current;
      const k = keysRef.current;
      let dir = 0;
      let jumped = false;

      // платформы едут и везут героя с собой
      simT += dt;
      movers.forEach((m, i) => {
        const p = moverPos(m, simT);
        const dx = p.x - mNow[i].x;
        const dy = p.y - mNow[i].y;
        mNow[i] = p;
        if (riding === i && h.onGround) {
          h.x += dx;
          h.y += dy;
        }
      });

      if (!frozenRef.current) {
        if (LEFT_CODES.some((c) => k.has(c))) dir -= 1;
        if (RIGHT_CODES.some((c) => k.has(c))) dir += 1;
        if (dir !== 0) h.face = dir;
        if (h.onGround && JUMP_CODES.some((c) => k.has(c))) {
          h.vy = -JUMP;
          h.onGround = false;
          jumped = true;
        }
      }
      if (jumped) {
        dust(h.x, h.y, 5);
        h.squash = -0.4;
      }

      const wasOnGround = h.onGround;

      h.vx = dir * SPEED;
      h.vy = Math.min(h.vy + GRAVITY * dt, 1100);
      const fallSpeed = h.vy;

      // по горизонтали
      h.x = clamp(h.x + h.vx * dt, HERO_W / 2 + 4, worldW - HERO_W / 2 - 4);
      if (h.vx !== 0) {
        for (const s of solids) {
          if (overlaps(h, s)) {
            h.x = h.vx > 0 ? s.x - HERO_W / 2 : s.x + s.w + HERO_W / 2;
          }
        }
      }

      // по вертикали
      const prevY = h.y;
      h.y += h.vy * dt;
      h.onGround = false;
      riding = -1;
      for (const s of solids) {
        if (overlaps(h, s)) {
          if (h.vy > 0) {
            h.y = s.y;
            h.vy = 0;
            h.onGround = true;
          } else if (h.vy < 0) {
            h.y = s.y + s.h + HERO_H;
            h.vy = 0;
          }
        }
      }
      if (h.vy >= 0) {
        for (const p of platforms) {
          if (
            prevY <= p.y + 2 &&
            h.y >= p.y &&
            h.x + HERO_W / 2 > p.x &&
            h.x - HERO_W / 2 < p.x + p.w
          ) {
            h.y = p.y;
            h.vy = 0;
            h.onGround = true;
          }
        }
      }

      if (h.vy >= 0) {
        for (let i = 0; i < movers.length; i++) {
          const m = movers[i];
          const mx = mNow[i].x - m.w / 2;
          const my = mNow[i].y;
          if (
            prevY <= my + 6 &&
            h.y >= my &&
            h.x + HERO_W / 2 > mx &&
            h.x - HERO_W / 2 < mx + m.w
          ) {
            h.y = my;
            h.vy = 0;
            h.onGround = true;
            riding = i;
          }
        }
      }

      // приземление: сплющивание и пыль
      let landed = false;
      if (h.onGround && !wasOnGround && fallSpeed > 300) {
        h.squash = 0.8;
        dust(h.x, h.y, 8);
        landed = true;
      }
      if (!landed) {
        const target = h.onGround ? 0 : Math.max(-0.35, -Math.abs(h.vy) / 2200);
        h.squash += (target - h.squash) * Math.min(1, dt * 12);
      }

      // пыль из-под ног при беге
      if (h.onGround && dir !== 0) {
        h.dustT -= dt;
        if (h.dustT <= 0) {
          dust(h.x - h.face * 8, h.y, 1);
          h.dustT = 0.13;
        }
      }

      // шипы: возвращаем героя к последнему безопасному месту
      if (hurtT > 0) {
        hurtT -= dt;
      } else {
        if (
          h.onGround &&
          !spikes.some((sp) => h.x > sp.x - 80 && h.x < sp.x + sp.w + 80)
        ) {
          safeX = h.x;
          safeY = h.y;
        }
        for (const sp of spikes) {
          if (
            h.x + HERO_W / 2 - 4 > sp.x &&
            h.x - HERO_W / 2 + 4 < sp.x + sp.w &&
            h.y > GROUND_Y - 12
          ) {
            hurtT = 1.1;
            spark(h.x, h.y - 20, "#ff6b8b", 16);
            dust(h.x, h.y, 6);
            h.x = safeX;
            h.y = safeY;
            h.vx = 0;
            h.vy = 0;
            riding = -1;
            break;
          }
        }
      }

      // кристаллы
      for (const g of gems) {
        if (!g.got && Math.abs(g.x - h.x) < 24 && Math.abs(g.y - (h.y - 24)) < 30) {
          g.got = true;
          gemCount += 1;
          setGemsGot(gemCount);
          spark(g.x, g.y, th.gem, 10);
        }
      }

      // камера
      const target = clamp(h.x - viewW / 2, 0, Math.max(0, worldW - viewW));
      camX += (target - camX) * Math.min(1, dt * 6);
    };

    const updateNear = () => {
      const h = heroRef.current;
      let best: number | null = null;
      let bestDist = TALK_X;
      for (let i = 0; i < chapter.npcs.length; i++) {
        const n = chapter.npcs[i];
        const dx = Math.abs(h.x - n.x);
        if (dx < bestDist && Math.abs(h.y - n.y) < TALK_Y) {
          best = i;
          bestDist = dx;
        }
      }
      if (best !== nearRef.current) {
        nearRef.current = best;
        setNear(best);
      }
    };

    /* --- рисование --- */

    const layer = (p: number) =>
      ctx.setTransform(
        dpr * scale, 0, 0, dpr * scale,
        -camX * p * dpr * scale,
        offsetY * dpr * scale,
      );

    const drawSolid = (x: number, y: number, w: number, h: number) => {
      const x0 = Math.max(x, camX - 30);
      const x1 = Math.min(x + w, camX + viewW + 30);
      if (x1 <= x0) return;
      ctx.fillStyle = th.dirt[0];
      ctx.fillRect(x0, y, x1 - x0, h);
      ctx.fillStyle = th.dirt[1];
      ctx.fillRect(x0, y + 44, x1 - x0, Math.max(0, h - 44));
      for (let gx = Math.floor(x0 / 24) * 24; gx < x1; gx += 24) {
        for (let gy = y + 14; gy < Math.min(y + h, VIEW_H + 10); gy += 24) {
          const r = rnd(gx * 0.31 + gy * 0.17);
          if (r > 0.55) {
            ctx.fillStyle = r > 0.8 ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)";
            ctx.fillRect(gx + r * 14, gy + r * 8, 6, 5);
          }
        }
      }
      ctx.fillStyle = th.grass[0];
      ctx.fillRect(x0, y, x1 - x0, 8);
      ctx.fillStyle = th.grass[1];
      ctx.fillRect(x0, y, x1 - x0, 3);
    };

    const drawPlatform = (p: { x: number; y: number; w: number }) => {
      ctx.fillStyle = "#8a6038";
      ctx.fillRect(p.x, p.y, p.w, 8);
      ctx.fillStyle = "#6b4a2b";
      ctx.fillRect(p.x, p.y + 8, p.w, 6);
      ctx.fillStyle = "#4a331f";
      ctx.fillRect(p.x + 6, p.y + 14, 4, 14);
      ctx.fillRect(p.x + p.w - 10, p.y + 14, 4, 14);
    };

    const groundShadow = (x: number, rx: number) => {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(x, GROUND_Y + 2, rx, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawPine = (x: number, h: number) => {
      groundShadow(x, 22);
      ctx.fillStyle = "#3b2a1e";
      ctx.fillRect(x - 4, GROUND_Y - 18, 8, 18);
      const cols = th.snowy ? ["#1d3b4f", "#2a5470"] : ["#134e3a", "#1c6b4f"];
      for (let i = 0; i < 3; i++) {
        const base = GROUND_Y - 14 - i * h * 0.28;
        const hw = 30 - i * 7;
        const tipY = base - h * 0.5;
        ctx.fillStyle = cols[i % 2];
        ctx.beginPath();
        ctx.moveTo(x, tipY);
        ctx.lineTo(x - hw, base);
        ctx.lineTo(x + hw, base);
        ctx.closePath();
        ctx.fill();
        if (th.snowy) {
          ctx.fillStyle = "#eef4ff";
          ctx.beginPath();
          ctx.moveTo(x, tipY);
          ctx.lineTo(x - hw * 0.45, tipY + h * 0.5 * 0.45);
          ctx.lineTo(x + hw * 0.45, tipY + h * 0.5 * 0.45);
          ctx.closePath();
          ctx.fill();
        }
      }
    };

    const drawStall = (x: number, seed: number, t: number) => {
      groundShadow(x, 38);
      ctx.fillStyle = "#4a331f";
      ctx.fillRect(x - 32, GROUND_Y - 70, 4, 70);
      ctx.fillRect(x + 28, GROUND_Y - 70, 4, 70);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#e5383b" : "#f3eedf";
        const sway = Math.sin(t * 2 + i * 0.6 + seed * 6) * 1.2;
        ctx.fillRect(x - 36 + i * 9, GROUND_Y - 78, 9, 16 + sway);
      }
      ctx.fillStyle = "#6b4a2b";
      ctx.fillRect(x - 32, GROUND_Y - 28, 64, 28);
      ctx.fillStyle = "#8a6038";
      ctx.fillRect(x - 34, GROUND_Y - 30, 68, 5);
      const fruit = ["#f4a300", "#e5383b", "#2dd4a0"];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = fruit[(Math.floor(seed * 10) + i) % 3];
        ctx.beginPath();
        ctx.arc(x - 22 + i * 11, GROUND_Y - 35, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawMast = (x: number, h: number, t: number) => {
      groundShadow(x, 28);
      const topY = GROUND_Y - h - 40;
      ctx.fillStyle = "#5a3d24";
      ctx.fillRect(x - 3, topY, 6, h + 40);
      // парус качается
      const sway = Math.sin(t * 1.6 + x) * 4;
      ctx.fillStyle = "#e9e2cf";
      ctx.beginPath();
      ctx.moveTo(x + 3, topY + 12);
      ctx.quadraticCurveTo(x + 38 + sway, GROUND_Y - h * 0.5 - 20, x + 3, GROUND_Y - 36);
      ctx.closePath();
      ctx.fill();
      // флажок развевается
      ctx.fillStyle = "#e5383b";
      ctx.beginPath();
      ctx.moveTo(x + 3, topY);
      ctx.lineTo(x + 26 + Math.sin(t * 6 + x) * 3, topY + 6 + Math.sin(t * 5) * 1.5);
      ctx.lineTo(x + 3, topY + 12);
      ctx.closePath();
      ctx.fill();
      // ящик
      ctx.fillStyle = "#6b4a2b";
      ctx.fillRect(x - 30, GROUND_Y - 22, 22, 22);
      ctx.strokeStyle = "#4a331f";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 30, GROUND_Y - 22, 22, 22);
    };

    const drawLamp = (x: number, t: number) => {
      const flick = 0.35 + Math.sin(t * 5 + x) * 0.05;
      const g = ctx.createRadialGradient(x, GROUND_Y - 74, 2, x, GROUND_Y - 74, 70);
      g.addColorStop(0, `rgba(255,200,87,${flick})`);
      g.addColorStop(1, "rgba(255,200,87,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, GROUND_Y - 74, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2b3350";
      ctx.fillRect(x - 2, GROUND_Y - 70, 4, 70);
      ctx.fillStyle = "#ffc857";
      ctx.fillRect(x - 4, GROUND_Y - 78, 8, 8);
    };

    const drawLighthouse = (x: number, t: number) => {
      const lit = correctRef.current / total;
      const topY = GROUND_Y - 230;
      const hw = (y: number) => 18 + 12 * ((y - topY) / 230);

      const glow = ctx.createRadialGradient(x, topY - 14, 4, x, topY - 14, 60 + 200 * lit);
      glow.addColorStop(0, `rgba(255,200,87,${0.2 + 0.6 * lit})`);
      glow.addColorStop(1, "rgba(255,200,87,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, topY - 14, 260, 0, Math.PI * 2);
      ctx.fill();

      // вращающийся луч
      if (lit > 0) {
        for (const extra of [0, Math.PI]) {
          ctx.save();
          ctx.translate(x, topY - 14);
          ctx.rotate(t * 0.9 + extra);
          const beam = ctx.createLinearGradient(0, 0, 420, 0);
          beam.addColorStop(0, `rgba(255,224,150,${0.1 + 0.35 * lit})`);
          beam.addColorStop(1, "rgba(255,224,150,0)");
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(420, -46);
          ctx.lineTo(420, 46);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.fillStyle = "#f3eedf";
      ctx.beginPath();
      ctx.moveTo(x - 30, GROUND_Y);
      ctx.lineTo(x - 18, topY);
      ctx.lineTo(x + 18, topY);
      ctx.lineTo(x + 30, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#8b5cf6";
      [GROUND_Y - 160, GROUND_Y - 90].forEach((y) => {
        const w = hw(y + 13);
        ctx.fillRect(x - w, y, w * 2, 26);
      });
      ctx.fillStyle = lit > 0 ? "#ffc857" : "#6b7399";
      ctx.fillRect(x - 16, topY - 28, 32, 28);
      ctx.fillStyle = "#6d3bd2";
      ctx.beginPath();
      ctx.moveTo(x - 22, topY - 28);
      ctx.lineTo(x, topY - 52);
      ctx.lineTo(x + 22, topY - 28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(x - 8, GROUND_Y - 34, 16, 34);
    };

    /* --- новые декорации, цели и механики мира --- */

    const drawTree = (x: number, h: number, seed: number, t: number) => {
      groundShadow(x, 28);
      const trunk = 60 + h * 0.5;
      ctx.fillStyle = "#4a3320";
      ctx.fillRect(x - 6, GROUND_Y - trunk, 12, trunk);
      ctx.fillStyle = "#3a2817";
      ctx.fillRect(x + 1, GROUND_Y - trunk, 5, trunk);
      const sway = Math.sin(t * 0.8 + x * 0.01) * 2;
      const crowns: [number, number, number][] = [
        [0, -trunk - 6, 34],
        [-22, -trunk + 12, 26],
        [22, -trunk + 12, 26],
      ];
      crowns.forEach(([dx, dy, r], i) => {
        ctx.fillStyle = i === 0 ? "#2f8f4a" : "#237a3e";
        ctx.beginPath();
        ctx.arc(x + dx + sway * 0.5, GROUND_Y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "rgba(190,255,150,0.18)";
      ctx.beginPath();
      ctx.arc(x - 8 + sway * 0.5, GROUND_Y - trunk - 16, 14, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgba(182,255,107,${0.5 + 0.4 * Math.sin(t * 2 + i + seed * 9)})`;
        ctx.beginPath();
        ctx.arc(x + (i - 1) * 20 + sway * 0.5, GROUND_Y - trunk + (i === 1 ? -8 : 14), 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (seed > 0.45) {
        ctx.fillStyle = "#f3eedf";
        ctx.fillRect(x + 14, GROUND_Y - 8, 4, 8);
        ctx.fillStyle = "#e5383b";
        ctx.beginPath();
        ctx.arc(x + 16, GROUND_Y - 8, 8, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(x + 12, GROUND_Y - 12, 2, 2);
        ctx.fillRect(x + 18, GROUND_Y - 13, 2, 2);
      }
    };

    const drawCrystals = (x: number, h: number, seed: number, t: number) => {
      groundShadow(x, 26);
      const cols = ["#8b5cf6", "#ff7be5", "#38bdf8"];
      const n = 3 + (seed > 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const cx = x + (i - (n - 1) / 2) * 17;
        const ch = (30 + h * 0.6) * (0.5 + 0.5 * rnd(seed * 10 + i));
        const w = 9 + rnd(i + seed * 7) * 5;
        ctx.fillStyle = `rgba(170,130,255,${0.1 + 0.06 * Math.sin(t * 2 + i + seed * 5)})`;
        ctx.beginPath();
        ctx.arc(cx, GROUND_Y - ch * 0.5, ch * 0.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = cols[i % 3];
        ctx.beginPath();
        ctx.moveTo(cx - w, GROUND_Y);
        ctx.lineTo(cx - w * 0.6, GROUND_Y - ch * 0.75);
        ctx.lineTo(cx, GROUND_Y - ch);
        ctx.lineTo(cx + w * 0.6, GROUND_Y - ch * 0.75);
        ctx.lineTo(cx + w, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.6, GROUND_Y - 2);
        ctx.lineTo(cx - w * 0.45, GROUND_Y - ch * 0.72);
        ctx.lineTo(cx, GROUND_Y - ch);
        ctx.lineTo(cx - w * 0.1, GROUND_Y - 2);
        ctx.closePath();
        ctx.fill();
      }
    };

    const drawPillar = (x: number, h: number, seed: number) => {
      groundShadow(x, 32);
      const ph = 70 + h * 0.8;
      const broken = seed > 0.5;
      const top = GROUND_Y - ph;
      const cut = broken ? 14 : 0;
      ctx.fillStyle = "#9c8566";
      ctx.fillRect(x - 20, GROUND_Y - 10, 40, 10);
      ctx.fillStyle = "#c2ad88";
      ctx.fillRect(x - 14, top + cut, 28, ph - 10 - cut);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let k = 0; k < 3; k++) ctx.fillRect(x - 9 + k * 9, top + cut, 3, ph - 10 - cut);
      if (broken) {
        ctx.fillStyle = "#c2ad88";
        ctx.beginPath();
        ctx.moveTo(x - 14, top + 14);
        ctx.lineTo(x - 6, top + 4);
        ctx.lineTo(x, top + 12);
        ctx.lineTo(x + 8, top);
        ctx.lineTo(x + 14, top + 10);
        ctx.lineTo(x + 14, top + 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#a8936f";
        ctx.fillRect(x + 24, GROUND_Y - 12, 22, 12);
        ctx.fillRect(x + 30, GROUND_Y - 20, 12, 8);
      } else {
        ctx.fillStyle = "#d6c39a";
        ctx.fillRect(x - 20, top - 8, 40, 10);
      }
      if (seed > 0.8) {
        ctx.strokeStyle = "#3f8f4f";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 10, top + 6);
        ctx.quadraticCurveTo(x - 16, top + ph * 0.5, x - 8, GROUND_Y - 14);
        ctx.stroke();
      }
    };

    const drawAntenna = (x: number, h: number, seed: number, t: number) => {
      groundShadow(x, 20);
      if (seed > 0.5) {
        const sway = Math.sin(t * 1.2 + x) * 5;
        const tipX = x + sway;
        const tipY = GROUND_Y - h * 0.9;
        ctx.strokeStyle = "#3dd9a8";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.quadraticCurveTo(x + 12, GROUND_Y - h * 0.5, tipX, tipY);
        ctx.stroke();
        const pulse = 0.5 + 0.4 * Math.sin(t * 2 + x);
        ctx.fillStyle = `rgba(125,249,255,${pulse * 0.35})`;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7df9ff";
        ctx.beginPath();
        ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3dd9a8";
        ctx.beginPath();
        ctx.ellipse(x - 12, GROUND_Y - 16, 12, 5, -0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const top = GROUND_Y - h - 40;
        ctx.strokeStyle = "#6c75a8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 14, GROUND_Y);
        ctx.lineTo(x, top);
        ctx.lineTo(x + 14, GROUND_Y);
        ctx.stroke();
        ctx.fillStyle = "#8a93c7";
        ctx.fillRect(x - 2, top, 4, h + 40);
        ctx.fillStyle = "#c9d0ff";
        ctx.beginPath();
        ctx.ellipse(x + 8, top + 16, 16, 7, -0.5, 0, Math.PI * 2);
        ctx.fill();
        const blink = Math.sin(t * 4 + x) > 0.2 ? 1 : 0.2;
        ctx.fillStyle = `rgba(255,107,139,${blink})`;
        ctx.beginPath();
        ctx.arc(x, top - 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Сталактиты сверху экрана для пещеры
    const drawCeiling = () => {
      layer(0.7);
      const top = -offsetY - 10;
      const x0 = Math.floor((camX * 0.7 - 80) / 70) * 70;
      const x1 = camX * 0.7 + viewW + 80;
      for (let x = x0; x < x1; x += 70) {
        const hh = 40 + rnd(x * 0.13) * 95;
        const tip = x + (rnd(x * 0.31) - 0.5) * 10;
        ctx.fillStyle = "#0c0620";
        ctx.beginPath();
        ctx.moveTo(x - 24, top);
        ctx.lineTo(tip, top + hh);
        ctx.lineTo(x + 24, top);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(139,123,255,0.18)";
        ctx.beginPath();
        ctx.moveTo(x - 24, top);
        ctx.lineTo(tip, top + hh);
        ctx.lineTo(x - 6, top);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#0c0620";
      ctx.fillRect(x0, top - 30, x1 - x0, 32);
    };

    const drawSpikes = (sp: { x: number; w: number }) => {
      if (sp.x > camX + viewW + 40 || sp.x + sp.w < camX - 40) return;
      const n = Math.max(1, Math.round(sp.w / 16));
      const sw = sp.w / n;
      ctx.fillStyle = "rgba(229,56,59,0.25)";
      ctx.fillRect(sp.x, GROUND_Y - 3, sp.w, 4);
      for (let i = 0; i < n; i++) {
        const x1 = sp.x + i * sw;
        ctx.fillStyle = th.spike;
        ctx.beginPath();
        ctx.moveTo(x1, GROUND_Y + 1);
        ctx.lineTo(x1 + sw / 2, GROUND_Y - 17);
        ctx.lineTo(x1 + sw, GROUND_Y + 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.moveTo(x1, GROUND_Y + 1);
        ctx.lineTo(x1 + sw / 2, GROUND_Y - 17);
        ctx.lineTo(x1 + sw / 2 - 1, GROUND_Y + 1);
        ctx.closePath();
        ctx.fill();
      }
    };

    const drawMover = (m: (typeof movers)[number], pos: { x: number; y: number }) => {
      const mx = pos.x - m.w / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      if (m.ay > 0) {
        ctx.moveTo(m.x, m.y - m.ay);
        ctx.lineTo(m.x, m.y + m.ay + 10);
      } else {
        ctx.moveTo(m.x - m.ax - m.w / 2, m.y + 6);
        ctx.lineTo(m.x + m.ax + m.w / 2, m.y + 6);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = th.gem;
      ctx.fillRect(mx - 3, pos.y - 3, m.w + 6, 6);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#3a3f6b";
      ctx.fillRect(mx, pos.y, m.w, 10);
      ctx.fillStyle = th.gem;
      ctx.fillRect(mx, pos.y, m.w, 3);
      ctx.fillStyle = "#23274a";
      ctx.fillRect(mx + 8, pos.y + 10, m.w - 16, 6);
    };

    const drawGem = (g: { x: number; y: number; got: boolean }, i: number, t: number) => {
      if (g.got || g.x < camX - 30 || g.x > camX + viewW + 30) return;
      const y = g.y + Math.sin(t * 2.4 + i) * 3;
      const glow = ctx.createRadialGradient(g.x, y, 1, g.x, y, 16);
      glow.addColorStop(0, "rgba(255,255,255,0.35)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(g.x, y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = th.gem;
      ctx.beginPath();
      ctx.moveTo(g.x, y - 9);
      ctx.lineTo(g.x + 7, y);
      ctx.lineTo(g.x, y + 9);
      ctx.lineTo(g.x - 7, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.moveTo(g.x, y - 9);
      ctx.lineTo(g.x - 7, y);
      ctx.lineTo(g.x - 1, y - 1);
      ctx.closePath();
      ctx.fill();
    };

    const glowAt = (x: number, y: number, r: number, rgb: string, a: number) => {
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, `rgba(${rgb},${a})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawGoal = (x: number, t: number) => {
      const lit = correctRef.current / total;

      if (th.goal === "worldtree") {
        glowAt(x, GROUND_Y - 190, 120 + 200 * lit, "182,255,107", 0.1 + 0.4 * lit);
        ctx.fillStyle = "#4a3320";
        ctx.beginPath();
        ctx.moveTo(x - 30, GROUND_Y);
        ctx.lineTo(x - 14, GROUND_Y - 170);
        ctx.lineTo(x + 14, GROUND_Y - 170);
        ctx.lineTo(x + 30, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        const crown = mix("#1c4f33", "#46c76a", lit);
        const crown2 = mix("#17402a", "#3aae5a", lit);
        const spots: [number, number, number, string][] = [
          [0, -205, 70, crown],
          [-55, -165, 46, crown2],
          [55, -165, 46, crown2],
          [0, -250, 40, crown2],
        ];
        spots.forEach(([dx, dy, r, c]) => {
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(x + dx, GROUND_Y + dy, r, 0, Math.PI * 2);
          ctx.fill();
        });
        for (let i = 0; i < 9; i++) {
          const a = t * 0.6 + i * 0.7;
          ctx.fillStyle = `rgba(255,236,150,${lit * (0.5 + 0.4 * Math.sin(t * 2 + i))})`;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * (70 + (i % 3) * 14), GROUND_Y - 205 + Math.sin(a * 1.3) * 60, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#0b1020";
        ctx.beginPath();
        ctx.moveTo(x - 10, GROUND_Y);
        ctx.lineTo(x - 10, GROUND_Y - 24);
        ctx.quadraticCurveTo(x, GROUND_Y - 40, x + 10, GROUND_Y - 24);
        ctx.lineTo(x + 10, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        return;
      }

      if (th.goal === "crystal") {
        glowAt(x, GROUND_Y - 100, 100 + 220 * lit, "190,150,255", 0.1 + 0.45 * lit);
        const body = mix("#35305e", "#d3c4ff", lit);
        const side = mix("#2a2650", "#a78bfa", lit);
        const shard = (dx: number, w: number, hgt: number, c: string) => {
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(x + dx - w, GROUND_Y);
          ctx.lineTo(x + dx - w * 0.7, GROUND_Y - hgt * 0.6);
          ctx.lineTo(x + dx, GROUND_Y - hgt);
          ctx.lineTo(x + dx + w * 0.7, GROUND_Y - hgt * 0.62);
          ctx.lineTo(x + dx + w, GROUND_Y);
          ctx.closePath();
          ctx.fill();
        };
        shard(-44, 16, 90, side);
        shard(46, 18, 110, side);
        shard(0, 30, 200, body);
        ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.3 * lit})`;
        ctx.beginPath();
        ctx.moveTo(x - 24, GROUND_Y - 4);
        ctx.lineTo(x - 18, GROUND_Y - 120);
        ctx.lineTo(x, GROUND_Y - 200);
        ctx.lineTo(x - 6, GROUND_Y - 4);
        ctx.closePath();
        ctx.fill();
        return;
      }

      if (th.goal === "obelisk") {
        if (lit > 0) {
          const beam = ctx.createLinearGradient(0, GROUND_Y - 240, 0, GROUND_Y - 600);
          beam.addColorStop(0, `rgba(110,242,213,${0.45 * lit})`);
          beam.addColorStop(1, "rgba(110,242,213,0)");
          ctx.fillStyle = beam;
          ctx.fillRect(x - 12, GROUND_Y - 600, 24, 360);
        }
        glowAt(x, GROUND_Y - 220, 70 + 120 * lit, "110,242,213", 0.1 + 0.4 * lit);
        ctx.fillStyle = "#8c7653";
        ctx.fillRect(x - 40, GROUND_Y - 12, 80, 12);
        ctx.fillStyle = "#a28a63";
        ctx.fillRect(x - 32, GROUND_Y - 24, 64, 12);
        ctx.fillStyle = "#c2ad88";
        ctx.beginPath();
        ctx.moveTo(x - 24, GROUND_Y - 24);
        ctx.lineTo(x - 14, GROUND_Y - 200);
        ctx.lineTo(x + 14, GROUND_Y - 200);
        ctx.lineTo(x + 24, GROUND_Y - 24);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#d6c39a";
        ctx.beginPath();
        ctx.moveTo(x - 14, GROUND_Y - 200);
        ctx.lineTo(x, GROUND_Y - 232);
        ctx.lineTo(x + 14, GROUND_Y - 200);
        ctx.closePath();
        ctx.fill();
        for (let i = 0; i < 6; i++) {
          const lit1 = lit * 6 > i;
          ctx.fillStyle = lit1 ? "#6ef2d5" : "#6e5d40";
          ctx.fillRect(x - 6, GROUND_Y - 60 - i * 22, 12, 5);
          ctx.fillRect(x - 2, GROUND_Y - 68 - i * 22, 4, 4);
        }
        return;
      }

      if (th.goal === "rocket") {
        glowAt(x, GROUND_Y - 90, 80 + 160 * lit, "125,249,255", 0.08 + 0.35 * lit);
        if (lit > 0) {
          for (let k = 0; k < 3; k++) {
            const r = ((t * 40 + k * 28) % 84) + 6;
            ctx.strokeStyle = `rgba(125,249,255,${(1 - r / 90) * lit})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, GROUND_Y - 160, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.fillStyle = "#9aa5ce";
        ctx.beginPath();
        ctx.moveTo(x - 18, GROUND_Y - 40);
        ctx.lineTo(x - 40, GROUND_Y);
        ctx.lineTo(x - 18, GROUND_Y - 4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 18, GROUND_Y - 40);
        ctx.lineTo(x + 40, GROUND_Y);
        ctx.lineTo(x + 18, GROUND_Y - 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e8ecff";
        ctx.fillRect(x - 18, GROUND_Y - 120, 36, 112);
        ctx.fillStyle = "#c4caee";
        ctx.fillRect(x + 6, GROUND_Y - 120, 12, 112);
        ctx.fillStyle = "#ff6b8b";
        ctx.beginPath();
        ctx.moveTo(x - 18, GROUND_Y - 120);
        ctx.lineTo(x, GROUND_Y - 164);
        ctx.lineTo(x + 18, GROUND_Y - 120);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = mix("#2a2f5a", "#7df9ff", lit);
        ctx.beginPath();
        ctx.arc(x, GROUND_Y - 86, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6c75a8";
        ctx.fillRect(x - 18, GROUND_Y - 56, 36, 5);
        if (lit > 0.99) {
          ctx.fillStyle = "#ffb86b";
          ctx.beginPath();
          ctx.moveTo(x - 8, GROUND_Y - 8);
          ctx.lineTo(x, GROUND_Y + 4 + Math.sin(t * 30) * 4);
          ctx.lineTo(x + 8, GROUND_Y - 8);
          ctx.closePath();
          ctx.fill();
        }
        return;
      }

      drawLighthouse(x, t);
    };

    /* --- жители и герой --- */

    const drawNpc = (i: number, t: number) => {
      const n = chapter.npcs[i];
      const L = n.look;
      const hero = heroRef.current;
      const res = resultsRef.current[i] ?? null;

      const since = t - hopAt[i];
      const hop =
        since >= 0 && since < 0.7
          ? Math.abs(Math.sin(since * 9)) * 16 * (1 - since / 0.7)
          : 0;
      const bob = Math.sin(t * 2 + i) * 1;
      const blink = (t + i * 1.3) % 3.8 < 0.12;
      const face = hero.x < n.x ? -1 : 1;
      const y = n.y - hop;
      const bw = L.build === "slim" ? 16 : L.build === "stout" ? 26 : 20;
      const hw = bw / 2;
      const dark = shade(n.color, -0.38);
      const light = shade(n.color, 0.3);
      const near = res === null && Math.abs(hero.x - n.x) < 240 && Math.abs(hero.y - n.y) < 90;
      const headY = y - 44 + bob;

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(n.x, n.y + 1, hw + 4 - hop * 0.2, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // нижняя часть: халат или штаны с сапогами
      if (L.robe) {
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.moveTo(n.x - hw, y - 34 + bob);
        ctx.lineTo(n.x + hw, y - 34 + bob);
        ctx.lineTo(n.x + hw + 6, y);
        ctx.lineTo(n.x - hw - 6, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = dark;
        ctx.fillRect(n.x - hw - 6, y - 4, bw + 12, 4);
      } else {
        ctx.fillStyle = "#1a2342";
        ctx.fillRect(n.x - hw * 0.6 - 3, y - 10, 6, 10);
        ctx.fillRect(n.x + hw * 0.6 - 3, y - 10, 6, 10);
        ctx.fillStyle = "#3b2a1e";
        ctx.fillRect(n.x - hw * 0.6 - 4, y - 3, 8, 3);
        ctx.fillRect(n.x + hw * 0.6 - 4, y - 3, 8, 3);
        ctx.fillStyle = n.color;
        ctx.fillRect(n.x - hw, y - 36 + bob, bw, 28);
        ctx.fillStyle = light;
        ctx.fillRect(n.x - 2, y - 36 + bob, 4, 28);
      }
      // пояс
      ctx.fillStyle = dark;
      ctx.fillRect(n.x - hw, y - 20 + bob, bw, 3);

      // руки: одна машет, когда герой рядом
      const holdSide = -face;
      const armY = y - 34 + bob;
      ctx.lineCap = "round";
      ctx.strokeStyle = dark;
      ctx.lineWidth = 5;
      if (near) {
        const wv = Math.sin(t * 9) * 4;
        ctx.beginPath();
        ctx.moveTo(n.x + face * (hw + 1), armY);
        ctx.lineTo(n.x + face * (hw + 8), armY - 12 + wv);
        ctx.stroke();
        ctx.fillStyle = L.skin;
        ctx.beginPath();
        ctx.arc(n.x + face * (hw + 8), armY - 14 + wv, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(n.x + face * (hw + 1), armY);
        ctx.lineTo(n.x + face * (hw + 2), armY + 14);
        ctx.stroke();
      }
      const hx = n.x + holdSide * (hw + 3);
      const hy = armY + 14;
      ctx.beginPath();
      ctx.moveTo(n.x + holdSide * (hw + 1), armY);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.fillStyle = L.skin;
      ctx.beginPath();
      ctx.arc(hx, hy + 1, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // предмет в руке
      if (L.prop === "staff") {
        ctx.strokeStyle = "#6b4a2b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx, y);
        ctx.lineTo(hx, y - 66 + bob);
        ctx.stroke();
        glowAt(hx, y - 68 + bob, 12, "139,92,246", 0.45);
        ctx.fillStyle = "#c4b5fd";
        ctx.beginPath();
        ctx.arc(hx, y - 68 + bob, 4 + Math.sin(t * 3 + i) * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else if (L.prop === "basket") {
        ctx.fillStyle = "#8a6038";
        ctx.fillRect(hx - 9, hy - 2, 18, 11);
        ctx.fillStyle = "#6b4a2b";
        ctx.fillRect(hx - 9, hy + 3, 18, 2);
        ["#e5383b", "#f4a300", "#2dd4a0"].forEach((c, k) => {
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(hx - 5 + k * 5, hy - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (L.prop === "book") {
        ctx.fillStyle = "#8b5cf6";
        ctx.fillRect(hx - 8, hy - 9, 16, 12);
        ctx.fillStyle = "#f3eedf";
        ctx.fillRect(hx - 6, hy - 7, 12, 8);
        ctx.fillStyle = "#8b5cf6";
        ctx.fillRect(hx - 1, hy - 9, 2, 12);
      } else if (L.prop === "lantern") {
        const fl = 0.35 + Math.sin(t * 6 + i) * 0.06;
        glowAt(hx, hy + 10, 26, "255,200,87", fl);
        ctx.strokeStyle = "#2b3350";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx, hy + 4);
        ctx.stroke();
        ctx.fillStyle = "#ffc857";
        ctx.fillRect(hx - 4, hy + 4, 8, 10);
        ctx.fillStyle = "#2b3350";
        ctx.fillRect(hx - 5, hy + 3, 10, 2);
        ctx.fillRect(hx - 5, hy + 13, 10, 2);
      } else if (L.prop === "tool") {
        ctx.strokeStyle = "#6b4a2b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx, hy + 12);
        ctx.lineTo(hx, hy - 20);
        ctx.stroke();
        ctx.fillStyle = "#b8c0dc";
        ctx.beginPath();
        ctx.moveTo(hx, hy - 20);
        ctx.lineTo(hx + face * 11, hy - 17);
        ctx.lineTo(hx + face * 11, hy - 7);
        ctx.lineTo(hx, hy - 10);
        ctx.closePath();
        ctx.fill();
      } else if (L.prop === "rod") {
        const tx = hx + face * 28;
        const ty = hy - 40;
        ctx.strokeStyle = "#6b4a2b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.strokeStyle = "rgba(243,238,223,0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.sin(t * 2 + i) * 2, ty + 30);
        ctx.stroke();
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(tx + Math.sin(t * 2 + i) * 2, ty + 31, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // капюшон идёт позади лица
      if (L.hat === "hood") {
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.arc(n.x, headY - 1, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // голова
      ctx.fillStyle = L.skin;
      ctx.beginPath();
      ctx.arc(n.x, headY, L.hat === "hood" ? 8 : 9, 0, Math.PI * 2);
      ctx.fill();

      // волосы
      if (L.hat === "none" || L.hat === "headband" || L.hat === "bun") {
        ctx.fillStyle = L.hair;
        ctx.beginPath();
        ctx.arc(n.x, headY - 2, 9.5, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(n.x - 9.5, headY - 3, 3, 8);
        ctx.fillRect(n.x + 6.5, headY - 3, 3, 8);
      }
      if (L.hat === "bun") {
        ctx.fillStyle = L.hair;
        ctx.beginPath();
        ctx.arc(n.x, headY - 12, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (L.hat === "headband") {
        ctx.fillStyle = light;
        ctx.fillRect(n.x - 9.5, headY - 6, 19, 3);
        ctx.fillRect(n.x - face * 11, headY - 6, 4, 6);
      }
      if (L.hat === "cap") {
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.arc(n.x, headY - 3, 10, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(n.x - 10, headY - 4, 20 + face * 4, 3);
        ctx.fillRect(n.x + (face > 0 ? 4 : -14), headY - 4, 10, 3);
      }
      if (L.hat === "hat") {
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(n.x, headY - 7, 15, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(n.x - 8, headY - 7);
        ctx.lineTo(n.x - 3, headY - 19);
        ctx.lineTo(n.x + 5, headY - 19);
        ctx.lineTo(n.x + 8, headY - 7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = light;
        ctx.fillRect(n.x - 8, headY - 10, 16, 3);
      }
      if (L.hat === "helm") {
        ctx.fillStyle = "#9aa5ce";
        ctx.beginPath();
        ctx.arc(n.x, headY - 2, 10.5, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(n.x - 1, headY - 3, 2, 8);
        ctx.fillStyle = "#e5383b";
        ctx.fillRect(n.x - 1.5, headY - 16, 3, 6);
      }

      // лицо
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(n.x + face * 3 - 1, headY - 1, 2, blink ? 1 : 3);
      if (res === true) {
        ctx.strokeStyle = "#0b1020";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(n.x + face * 2, headY + 3, 3, 0.1, Math.PI - 0.1);
        ctx.stroke();
      }
      if (L.beard) {
        ctx.fillStyle = L.hair;
        ctx.beginPath();
        ctx.arc(n.x, headY + 3, 8, 0.15, Math.PI - 0.15);
        ctx.fill();
        ctx.fillRect(n.x - 3, headY + 6, 6, 5);
      }

      ctx.textAlign = "center";
      ctx.font = "700 16px system-ui, sans-serif";
      const markY = y - 72 + bob;
      if (res === null) {
        ctx.fillStyle = "#ffd166";
        ctx.fillText("!", n.x, markY + Math.sin(t * 4) * 3);
      } else {
        ctx.fillStyle = res ? "#2dd4a0" : "#9aa5ce";
        ctx.fillText(res ? "✓" : "•", n.x, markY);
      }
      if (Math.abs(hero.x - n.x) < 180) {
        ctx.font = "600 13px system-ui, sans-serif";
        ctx.fillStyle = "#f3eedf";
        ctx.fillText(n.name, n.x, n.y - 88);
      }
    };

    const drawHero = (t: number) => {
      const h = heroRef.current;
      const f = h.face;
      const air = !h.onGround;
      const moving = !air && Math.abs(h.vx) > 1;
      const swing = moving ? Math.sin(t * 16) * 5 : 0;
      const breath = moving || air ? 0 : Math.sin(t * 2.2) * 0.8;
      const blink = t % 3.4 < 0.12;
      const sq = h.squash;
      const flicker = hurtT > 0 && Math.floor(simT * 14) % 2 === 0;

      if (!air) {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(h.x, h.y + 1, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.globalAlpha = flicker ? 0.35 : 1;
      ctx.translate(h.x, h.y);
      ctx.scale(1 + sq * 0.3, 1 - sq * 0.3);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // шарф: длинный хвост, который развевается
      const lag = moving ? 1 : air ? 0.8 : 0.35;
      ctx.strokeStyle = "#2dd4a0";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-f * 4, -37 + breath);
      for (let i = 1; i <= 5; i++) {
        ctx.lineTo(
          -f * (4 + i * 5 * lag),
          -37 + breath + (Math.sin(t * 10 + i * 0.9) * 2.2 * i) / 5 + (air ? -i * 1.6 : i * 0.6),
        );
      }
      ctx.stroke();

      // рюкзак со свёрнутым одеялом
      ctx.fillStyle = "#6b4a2b";
      ctx.fillRect(f > 0 ? -17 : 8, -36 + breath, 9, 17);
      ctx.fillStyle = "#4a331f";
      ctx.fillRect(f > 0 ? -17 : 8, -26 + breath, 9, 2);
      ctx.fillStyle = "#c2463f";
      ctx.fillRect(f > 0 ? -18 : 7, -40 + breath, 11, 4);

      // ноги и сапоги
      ctx.fillStyle = "#2a2f55";
      ctx.fillRect(-7 + (air ? -4 : swing), -10, 6, 7);
      ctx.fillRect(1 + (air ? 4 : -swing), -10, 6, 7);
      ctx.fillStyle = "#5a3825";
      ctx.fillRect(-8 + (air ? -4 : swing), -4, 8, 4);
      ctx.fillRect(0 + (air ? 4 : -swing), -4, 8, 4);

      // туника, подол, пояс
      ctx.fillStyle = "#f4a300";
      ctx.fillRect(-9, -38 + breath, 18, 26);
      ctx.fillStyle = "#e08f00";
      ctx.beginPath();
      ctx.moveTo(-9, -14);
      ctx.lineTo(9, -14);
      ctx.lineTo(11, -9);
      ctx.lineTo(-11, -9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#6b4a2b";
      ctx.fillRect(-9, -24 + breath, 18, 3);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(-2, -24 + breath, 4, 3);
      ctx.fillStyle = `rgba(56,189,248,${0.55 + 0.3 * Math.sin(t * 3)})`;
      ctx.beginPath();
      ctx.arc(f * 2, -32 + breath, 3, 0, Math.PI * 2);
      ctx.fill();

      // рука с посохом
      const ax = f * 7;
      const ay = -34 + breath;
      const hx = ax + f * (air ? 4 : 2);
      const hy = ay + 14 + (air ? -8 : -swing * 0.4);
      const tilt = moving ? 4 : air ? -6 : 0;
      ctx.strokeStyle = "#7a5530";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx + f * 3 - tilt * f, air ? hy + 20 : 0);
      ctx.lineTo(hx + f * 3 + tilt * f, hy - 38);
      ctx.stroke();
      const ox = hx + f * 3 + tilt * f;
      const oy = hy - 40;
      glowAt(ox, oy, 14, "139,92,246", 0.5);
      ctx.fillStyle = "#c4b5fd";
      ctx.beginPath();
      ctx.arc(ox, oy, 4 + Math.sin(t * 3) * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e08f00";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.fillStyle = "#ffd9a8";
      ctx.beginPath();
      ctx.arc(hx, hy + 1, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // голова и лицо
      ctx.fillStyle = "#5a3825";
      ctx.fillRect(f > 0 ? -10 : 6, -49 + breath, 4, 9);
      ctx.fillStyle = "#ffd9a8";
      ctx.beginPath();
      ctx.arc(0, -45 + breath, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(f * 3 - 1, -46 + breath, 2, blink ? 1 : 3);
      ctx.fillStyle = "rgba(255,120,120,0.35)";
      ctx.beginPath();
      ctx.arc(f * 5, -42 + breath, 2, 0, Math.PI * 2);
      ctx.fill();

      // дорожная шляпа с пером
      ctx.fillStyle = "#6d3bd2";
      ctx.beginPath();
      ctx.ellipse(0, -52 + breath, 14, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-8, -52 + breath);
      ctx.lineTo(-f * 4 + Math.sin(t * 5) * 0.8, -67 + breath);
      ctx.lineTo(7, -52 + breath);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffc857";
      ctx.fillRect(-8, -55 + breath, 16, 3);
      ctx.strokeStyle = "#ff6b8b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-f * 6, -55 + breath);
      ctx.quadraticCurveTo(-f * 12, -66 + breath, -f * 10 + Math.sin(t * 8), -72 + breath);
      ctx.stroke();

      ctx.restore();
    };

    const drawAmbient = (t: number) => {
      amb.forEach((a) => {
        if (th.ambient === "fireflies") {
          const x = a.x + Math.sin(t * 0.8 + a.p) * 14;
          const y = a.y + Math.cos(t * 0.6 + a.p * 1.7) * 10;
          if (x < camX - 20 || x > camX + viewW + 20) return;
          ctx.fillStyle = `rgba(255,200,87,${0.35 + 0.35 * Math.sin(t * 2 + a.p)})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (th.ambient === "lanterns") {
          const rise = (t * (10 + 14 * a.s) + a.p * 40) % 260;
          const x = a.x + Math.sin(t * 0.5 + a.p) * 18;
          const y = 440 - rise;
          if (x < camX - 20 || x > camX + viewW + 20) return;
          const al = Math.sin((rise / 260) * Math.PI) * 0.85;
          ctx.fillStyle = `rgba(255,170,60,${al * 0.25})`;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255,205,120,${al})`;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (th.ambient === "gulls") {
          const gx = (a.x + t * (25 + 20 * a.s)) % worldW;
          if (gx < camX - 20 || gx > camX + viewW + 20) return;
          const gy = 80 + (a.y - 240) * 0.45 + Math.sin(t * 0.9 + a.p) * 6;
          const flap = Math.sin(t * 6 + a.p) * 3.5;
          ctx.strokeStyle = "#e8f6ff";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(gx - 7, gy);
          ctx.quadraticCurveTo(gx - 3.5, gy - 4 + flap, gx, gy);
          ctx.quadraticCurveTo(gx + 3.5, gy - 4 + flap, gx + 7, gy);
          ctx.stroke();
        } else if (th.ambient === "leaves") {
          const fall = (t * (18 + 20 * a.s) + a.p * 50) % 330;
          const x = a.x + Math.sin(t * 0.9 + a.p) * 22;
          const y = 60 + fall;
          if (x < camX - 20 || x > camX + viewW + 20) return;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.sin(t * 1.5 + a.p) * 1.2);
          ctx.fillStyle = a.p > 3.2 ? "rgba(244,163,0,0.8)" : "rgba(123,214,82,0.8)";
          ctx.beginPath();
          ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (th.ambient === "motes") {
          const rise = (t * (8 + 10 * a.s) + a.p * 50) % 300;
          const x = a.x + Math.sin(t * 0.6 + a.p) * 16;
          const y = 430 - rise;
          if (x < camX - 20 || x > camX + viewW + 20) return;
          const al = Math.sin((rise / 300) * Math.PI);
          ctx.fillStyle = a.p > 3.2 ? `rgba(255,123,229,${al * 0.7})` : `rgba(139,200,255,${al * 0.7})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.6 + a.s, 0, Math.PI * 2);
          ctx.fill();
        } else if (th.ambient === "dust") {
          const x = (a.x + t * (14 + 12 * a.s)) % worldW;
          const y = a.y + Math.sin(t * 0.7 + a.p) * 12;
          if (x < camX - 20 || x > camX + viewW + 20) return;
          ctx.fillStyle = `rgba(255,226,170,${0.25 + 0.25 * Math.sin(t + a.p)})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + a.s * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    const draw = (t: number) => {
      // небо
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, cssH);
      sky.addColorStop(0, th.sky[0]);
      sky.addColorStop(0.6, th.sky[1]);
      sky.addColorStop(1, th.sky[2]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cssW, cssH);

      STARS.forEach((s) => {
        ctx.fillStyle = `rgba(243,238,223,${(0.4 + 0.5 * Math.sin(t * 1.5 + s.p)) * th.stars})`;
        ctx.fillRect(s.x * cssW, s.y * cssH * 0.7, s.r, s.r);
      });

      const orbR = Math.max(16, 22 * scale);
      const ox = cssW * 0.8;
      const oy = cssH * th.orbY;
      const halo = ctx.createRadialGradient(ox, oy, 2, ox, oy, orbR * 3);
      halo.addColorStop(0, "rgba(255,255,255,0.22)");
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.fillStyle = th.orb;
      ctx.beginPath();
      ctx.arc(ox, oy, orbR, 0, Math.PI * 2);
      ctx.fill();
      if (th.ring) {
        ctx.strokeStyle = "rgba(255,230,190,0.75)";
        ctx.lineWidth = Math.max(2, orbR * 0.16);
        ctx.beginPath();
        ctx.ellipse(ox, oy, orbR * 1.9, orbR * 0.5, -0.35, 0, Math.PI * 2);
        ctx.stroke();
      }

      // далёкие горы
      layer(0.15);
      const far = worldW * 0.15 + viewW + 100;
      ctx.fillStyle = th.far;
      ctx.beginPath();
      ctx.moveTo(-100, 600);
      for (let x = -100; x <= far; x += 40) {
        ctx.lineTo(x, 450 - (110 + 70 * Math.sin(x * 0.004) + 40 * Math.sin(x * 0.013 + 1)));
      }
      ctx.lineTo(far, 600);
      ctx.closePath();
      ctx.fill();

      // холмы
      layer(0.4);
      const mid = worldW * 0.4 + viewW + 100;
      ctx.fillStyle = th.mid;
      ctx.beginPath();
      ctx.moveTo(-100, 600);
      for (let x = -100; x <= mid; x += 40) {
        ctx.lineTo(x, 450 - (30 + 22 * Math.sin(x * 0.01) + 12 * Math.sin(x * 0.027)));
      }
      ctx.lineTo(mid, 600);
      ctx.closePath();
      ctx.fill();

      // море за порт: волны бегут
      if (th.decor === "masts") {
        const x0 = Math.floor((camX * 0.4 - 40) / 30) * 30;
        const x1 = camX * 0.4 + viewW + 40;
        const sea = ctx.createLinearGradient(0, 372, 0, 462);
        sea.addColorStop(0, "#124c70");
        sea.addColorStop(1, "#0a2a42");
        ctx.fillStyle = sea;
        ctx.fillRect(x0, 372, x1 - x0, 90);
        ctx.strokeStyle = "rgba(127,208,232,0.45)";
        ctx.lineWidth = 2;
        for (let x = x0; x < x1; x += 30) {
          for (let r = 0; r < 3; r++) {
            const y = 384 + r * 18 + Math.sin(x * 0.05 + t * 2 + r) * 2.5;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 16, y);
            ctx.stroke();
          }
        }
      }

      if (th.ceiling) drawCeiling();

      // основной слой
      layer(1);
      drawGoal(chapter.goalX, t);
      decor.forEach((d) => {
        if (d.x < camX - 80 || d.x > camX + viewW + 80) return;
        switch (th.decor) {
          case "pines":
            drawPine(d.x, d.h);
            break;
          case "stalls":
            drawStall(d.x, d.seed, t);
            break;
          case "masts":
            drawMast(d.x, d.h, t);
            break;
          case "trees":
            drawTree(d.x, d.h, d.seed, t);
            break;
          case "crystals":
            drawCrystals(d.x, d.h, d.seed, t);
            break;
          case "pillars":
            drawPillar(d.x, d.h, d.seed);
            break;
          case "antennas":
            drawAntenna(d.x, d.h, d.seed, t);
            break;
        }
      });
      chapter.npcs.forEach((n) => {
        if (n.y === GROUND_Y) drawLamp(n.x - 70, t);
      });
      solids.forEach((s) => drawSolid(s.x, s.y, s.w, s.h));
      platforms.forEach(drawPlatform);
      spikes.forEach(drawSpikes);
      movers.forEach((m, i) => drawMover(m, mNow[i]));
      gems.forEach((g, i) => drawGem(g, i, t));
      chapter.npcs.forEach((_, i) => drawNpc(i, t));
      drawHero(t);
      drawParts();
      drawAmbient(t);

      // снег падает по экрану
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (th.ambient === "snow") {
        ctx.fillStyle = "rgba(240,246,255,0.8)";
        amb.forEach((a) => {
          const sx = (a.x / worldW) * cssW + Math.sin(t * 0.7 + a.p) * 14;
          const sy = ((a.p / 6.28) * cssH + t * (30 + 45 * a.s)) % cssH;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2 + a.s * 1.4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (th.ambient === "meteors") {
        for (let k = 0; k < 3; k++) {
          const period = 5 + k * 3.3;
          const u = ((t + k * 2.1) % period) / period;
          if (u > 0.14) continue;
          const p = u / 0.14;
          const sx = cssW * (0.15 + 0.28 * k) + p * cssW * 0.3;
          const sy = cssH * (0.08 + 0.1 * k) + p * cssH * 0.22;
          const tail = ctx.createLinearGradient(sx, sy, sx - 90, sy - 36);
          tail.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - p)})`);
          tail.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = tail;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 90, sy - 36);
          ctx.stroke();
        }
      }

      // туман редеет с каждым верным ответом
      const fog = 1 - (correctRef.current / total) * 0.85;
      for (let i = 0; i < 8; i++) {
        const x = ((i * 173 + t * 14) % (cssW + 400)) - 200;
        const y = cssH * 0.5 + ((i * 41) % 200);
        const r = (110 + ((i * 17) % 60)) * scale;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${th.fog},${0.16 * fog})`);
        g.addColorStop(1, `rgba(${th.fog},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = calm ? 0 : now / 1000;
      step(dt);
      updateParts(dt);
      watchResults(t);
      updateNear();
      draw(t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [chapter, total]);

  /* ---------- Интерфейс ---------- */

  const npcNow = dialogue?.kind === "npc" ? chapter.npcs[dialogue.npc] : null;
  const question = npcNow ? npcNow.question : null;

  const hold = (code: string) => ({
    onPointerDown: () => keysRef.current.add(code),
    onPointerUp: () => keysRef.current.delete(code),
    onPointerLeave: () => keysRef.current.delete(code),
    onPointerCancel: () => keysRef.current.delete(code),
  });

  return (
    <div className="world-screen">
      <canvas
        ref={canvasRef}
        className="world-canvas"
        role="img"
        aria-label={`Игровой мир: ${chapter.title}`}
      />

      <div className="chapter-card" aria-hidden="true">
        <span className="chapter-level">
          {chapter.level.toUpperCase()} · Глава {chapter.order}
        </span>
        <span className="chapter-title">{chapter.title}</span>
      </div>

      <div className="world-hud">
        <Link href="/dashboard" className="hud-chip">
          ← Выйти
        </Link>
        <span className="hud-chip">
          {chapter.level.toUpperCase()} · {chapter.title}
        </span>
        <span className="hud-chip">
          Жители: {answeredCount}/{total}
        </span>
        {chapter.gems.length > 0 && (
          <span className="hud-chip" aria-label={`Осколки: ${gemsGot} из ${chapter.gems.length}`}>
            ◆ {gemsGot}/{chapter.gems.length}
          </span>
        )}
        <span
          key={correctCount}
          className={`hud-chip crystals ${correctCount > 0 ? "pop" : ""}`}
          aria-label={`Кристаллы речи: ${correctCount} из ${total}`}
        >
          {Array.from({ length: total }, (_, i) => (i < correctCount ? "✦" : "✧")).join(" ")}
        </span>
      </div>

      {dialogue?.kind === "story" && (
        <div className="talk-wrap">
          <Say
            text={dialogue.lines[dialogue.line]}
            nextLabel={
              dialogue.line + 1 < dialogue.lines.length
                ? "Дальше"
                : dialogue.finish
                  ? "Завершить"
                  : "В путь"
            }
            onNext={next}
          />
        </div>
      )}

      {dialogue?.kind === "npc" && npcNow && dialogue.stage === "lines" && (
        <div className="talk-wrap">
          <Say
            speaker={npcNow.name}
            color={npcNow.color}
            text={dialogue.lines[dialogue.line]}
            nextLabel={
              dialogue.line + 1 < dialogue.lines.length || dialogue.asks
                ? "Дальше"
                : "Закрыть"
            }
            onNext={next}
          />
        </div>
      )}

      {dialogue?.kind === "npc" && npcNow && npcNow.task && dialogue.stage === "question" && (
        <div className="talk-wrap">
          <CodeChallenge
            key={npcNow.id}
            speaker={npcNow.name}
            color={npcNow.color}
            task={npcNow.task}
            onSolved={() => finishTask(true)}
            onGiveUp={() => finishTask(false)}
          />
        </div>
      )}

      {dialogue?.kind === "npc" && npcNow && !npcNow.task && question && dialogue.stage === "question" && (
        <div className="talk-wrap">
          <Ask
            key={dialogue.npc}
            speaker={npcNow.name}
            color={npcNow.color}
            question={question}
            picked={dialogue.picked}
            vocabChapter={chapter.land === "english" ? chapter.id : null}
            onPick={pick}
            onNext={afterAnswer}
          />
        </div>
      )}

      {dialogue === null && (
        <div className="touch">
          <div className="touch-group">
            <button type="button" className="touch-btn" aria-label="Влево" {...hold("ArrowLeft")}>
              ←
            </button>
            <button type="button" className="touch-btn" aria-label="Вправо" {...hold("ArrowRight")}>
              →
            </button>
          </div>
          <div className="touch-group">
            <button type="button" className="touch-btn" aria-label="Прыжок" {...hold("Space")}>
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Диалоговые окна ---------- */

function useTypewriter(text: string) {
  const [state, setState] = useState({ text, count: 0 });
  const count = state.text === text ? state.count : 0;

  useEffect(() => {
    if (count >= text.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(
      () => setState({ text, count: reduced ? text.length : count + 1 }),
      reduced ? 0 : 22,
    );
    return () => clearTimeout(id);
  }, [text, count]);

  return {
    shown: text.slice(0, count),
    done: count >= text.length,
    skip: () => setState({ text, count: text.length }),
  };
}

function Portrait({ color }: { color: string }) {
  return (
    <svg className="talk-portrait" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="12" fill={color} opacity="0.25" />
      <rect x="14" y="40" width="36" height="24" rx="8" fill={color} />
      <circle cx="32" cy="28" r="14" fill="#ffd9a8" />
      <path d="M18 26a14 14 0 0 1 28 0z" fill={color} />
      <rect x="25" y="28" width="3" height="5" fill="#0b1020" />
      <rect x="36" y="28" width="3" height="5" fill="#0b1020" />
    </svg>
  );
}

function Say({
  speaker,
  color,
  text,
  nextLabel,
  onNext,
}: {
  speaker?: string;
  color?: string;
  text: string;
  nextLabel: string;
  onNext: () => void;
}) {
  const { shown, done, skip } = useTypewriter(text);
  const advance = () => (done ? onNext() : skip());

  // Пробел или Enter тоже листают реплику
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLButtonElement) return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="talk" role="dialog" aria-label={speaker ?? "Рассказчик"}>
      {color && <Portrait color={color} />}
      <div className="talk-body">
        {speaker && (
          <div className="talk-name" style={{ color }}>
            {speaker}
          </div>
        )}
        <p className="talk-text">
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only">{text}</span>
        </p>
        <button type="button" className="btn" onClick={advance} autoFocus>
          {done ? nextLabel : "Пропустить"}
        </button>
      </div>
    </div>
  );
}

function Ask({
  speaker,
  color,
  question,
  picked,
  vocabChapter,
  onPick,
  onNext,
}: {
  speaker: string;
  color: string;
  question: Question;
  picked: number | null;
  vocabChapter: string | null;
  onPick: (i: number) => void;
  onNext: () => void;
}) {
  // Цифры 1–4 выбирают ответ
  useEffect(() => {
    if (picked !== null) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.code.replace("Digit", ""));
      if (n >= 1 && n <= question.options.length) onPick(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="talk" role="dialog" aria-label={speaker}>
      <Portrait color={color} />
      <div className="talk-body">
        <div className="talk-name" style={{ color }}>
          {speaker}
        </div>
        <p className="talk-text">{question.prompt}</p>

        <div className="options">
          {question.options.map((option, i) => {
            let state = "";
            if (picked !== null) {
              if (i === question.answer) state = "opt-right";
              else if (i === picked) state = "opt-wrong";
            }
            return (
              <button
                key={option}
                type="button"
                className={`opt ${state}`}
                disabled={picked !== null}
                onClick={() => onPick(i)}
              >
                <span className="opt-key">{i + 1}</span>
                {option}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <>
            <p className="talk-text" role="status">
              <strong>{picked === question.answer ? "Верно." : "Не совсем."}</strong>{" "}
              {question.explain}
            </p>
            {vocabChapter && (
              <WordCard question={question} chapterId={vocabChapter} />
            )}
            <button type="button" className="btn" onClick={onNext} autoFocus>
              Дальше
            </button>
          </>
        )}
      </div>
    </div>
  );
}