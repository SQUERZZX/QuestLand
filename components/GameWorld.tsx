"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

type Ambient = "fireflies" | "lanterns" | "gulls" | "snow";

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
  decor: "pines" | "stalls" | "masts";
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
    snowy: true,
  },
};

const AMB_COUNT: Record<Ambient, number> = {
  fireflies: 36,
  lanterns: 30,
  gulls: 9,
  snow: 70,
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

    const drawNpc = (i: number, t: number) => {
      const n = chapter.npcs[i];
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

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(n.x, n.y + 1, 14 - hop * 0.2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a2342";
      ctx.fillRect(n.x - 8, y - 10, 6, 10);
      ctx.fillRect(n.x + 2, y - 10, 6, 10);
      ctx.fillStyle = n.color;
      ctx.fillRect(n.x - 10, y - 36 + bob, 20, 28);
      ctx.fillStyle = "#ffd9a8";
      ctx.beginPath();
      ctx.arc(n.x, y - 44 + bob, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, y - 46 + bob, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(n.x + face * 3 - 1, y - 45 + bob, 2, blink ? 1 : 3);

      ctx.textAlign = "center";
      ctx.font = "700 16px system-ui, sans-serif";
      if (res === null) {
        ctx.fillStyle = "#ffd166";
        ctx.fillText("!", n.x, y - 64 + Math.sin(t * 4) * 3);
      } else {
        ctx.fillStyle = res ? "#2dd4a0" : "#9aa5ce";
        ctx.fillText(res ? "✓" : "•", n.x, y - 64);
      }
      if (Math.abs(hero.x - n.x) < 180) {
        ctx.font = "600 13px system-ui, sans-serif";
        ctx.fillStyle = "#f3eedf";
        ctx.fillText(n.name, n.x, n.y - 80);
      }
    };

    const drawHero = (t: number) => {
      const h = heroRef.current;
      const air = !h.onGround;
      const moving = !air && Math.abs(h.vx) > 1;
      const swing = moving ? Math.sin(t * 16) * 5 : 0;
      const breath = moving || air ? 0 : Math.sin(t * 2.2) * 0.8;
      const blink = t % 3.4 < 0.12;
      const sq = h.squash;

      if (!air) {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(h.x, h.y + 1, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.scale(1 + sq * 0.3, 1 - sq * 0.3);

      // плащ развевается
      const capeLen = air ? 24 : moving ? 20 : 10;
      const flutter = Math.sin(t * 12) * 2;
      ctx.fillStyle = "#8b5cf6";
      ctx.beginPath();
      ctx.moveTo(-h.face * 8, -38 + breath);
      ctx.lineTo(-h.face * (8 + capeLen), -10 + flutter + (air ? -6 : 0));
      ctx.lineTo(-h.face * 6, -8);
      ctx.closePath();
      ctx.fill();

      // ноги
      ctx.fillStyle = "#1a2342";
      ctx.fillRect(-7 + (air ? -4 : swing), -10, 6, 10);
      ctx.fillRect(1 + (air ? 4 : -swing), -10, 6, 10);

      // туловище и пояс
      ctx.fillStyle = "#f4a300";
      ctx.fillRect(-9, -38 + breath, 18, 28);
      ctx.fillStyle = "#c27f00";
      ctx.fillRect(-9, -20 + breath, 18, 3);

      // рука
      ctx.fillStyle = "#e08f00";
      ctx.fillRect(h.face * 6 - 3, -34 + breath + (air ? -6 : -swing * 0.5), 6, 14);

      // голова, капюшон, глаз
      ctx.fillStyle = "#ffd9a8";
      ctx.beginPath();
      ctx.arc(0, -45 + breath, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8b5cf6";
      ctx.beginPath();
      ctx.arc(0, -47 + breath, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(h.face * 3 - 1, -46 + breath, 2, blink ? 1 : 3);

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

      // основной слой
      layer(1);
      drawLighthouse(chapter.goalX, t);
      decor.forEach((d) => {
        if (d.x < camX - 80 || d.x > camX + viewW + 80) return;
        if (th.decor === "pines") drawPine(d.x, d.h);
        else if (th.decor === "stalls") drawStall(d.x, d.seed, t);
        else drawMast(d.x, d.h, t);
      });
      chapter.npcs.forEach((n) => {
        if (n.y === GROUND_Y) drawLamp(n.x - 70, t);
      });
      solids.forEach((s) => drawSolid(s.x, s.y, s.w, s.h));
      platforms.forEach(drawPlatform);
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

      {dialogue?.kind === "npc" && npcNow && question && dialogue.stage === "question" && (
        <div className="talk-wrap">
          <Ask
            speaker={npcNow.name}
            color={npcNow.color}
            question={question}
            picked={dialogue.picked}
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
  onPick,
  onNext,
}: {
  speaker: string;
  color: string;
  question: Question;
  picked: number | null;
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
            <button type="button" className="btn" onClick={onNext} autoFocus>
              Дальше
            </button>
          </>
        )}
      </div>
    </div>
  );
}