"use client";

import { useEffect, useRef, useState } from "react";
import { StreakFlame, StreakWeek } from "@/components/Streak";
import { sfx } from "@/lib/audio";
import { isMilestone, streakMessage, streakWord, tierOf } from "@/lib/streak";

type Props = { from: number; to: number; onClose: () => void };

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  life: number;
  max: number;
  shape: 0 | 1 | 2; // 0 — полоска, 1 — круг, 2 — искра
};

const COLORS = ["#ffd166", "#ff8a3d", "#ff5d5d", "#fff3c4", "#ff7be5", "#7df9ff"];
const READY_MS = 1900;
const ROLL_MS = 1100;

export default function StreakCelebration({ from, to, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const milestone = isMilestone(to);
  const tier = tierOf(to);

  // Звук, вибрация, момент «перекатывания» числа
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    sfx("streak");
    timers.push(
      setTimeout(() => {
        sfx("tick");
        if (milestone) sfx("fanfare");
        try {
          navigator.vibrate?.(milestone ? [40, 50, 40, 50, 90] : [30, 40, 60]);
        } catch {
          /* вибрации нет */
        }
      }, ROLL_MS),
      setTimeout(() => setReady(true), READY_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [milestone]);

  // Enter, пробел или Esc закрывают, когда анимация доиграла
  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space" || e.code === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, onClose]);

  // Конфетти и искры на canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const parts: Piece[] = [];

    const burst = (n: number, cx: number, cy: number, power: number, spread = Math.PI * 2, dir = -Math.PI / 2) => {
      for (let i = 0; i < n; i++) {
        const a = dir + (Math.random() - 0.5) * spread;
        const sp = rand(0.35, 1) * power;
        const life = rand(1.6, 2.8);
        parts.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          g: 900,
          rot: rand(0, 6.28),
          vr: rand(-9, 9),
          size: rand(6, 12),
          color: COLORS[(Math.random() * COLORS.length) | 0],
          life,
          max: life,
          shape: (Math.random() * 3 < 1 ? 0 : Math.random() < 0.5 ? 1 : 0) as 0 | 1,
        });
      }
    };

    const ember = () => {
      const life = rand(2.4, 4);
      parts.push({
        x: rand(0, w),
        y: h + 10,
        vx: rand(-20, 20),
        vy: rand(-140, -60),
        g: -8,
        rot: 0,
        vr: 0,
        size: rand(1.5, 3.2),
        color: Math.random() < 0.5 ? "#ffb03d" : "#ff7a2e",
        life,
        max: life,
        shape: 2,
      });
    };

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => burst(milestone ? 130 : 80, w / 2, h * 0.36, 720), ROLL_MS),
      setTimeout(() => {
        if (!milestone) return;
        burst(60, 0, h * 0.7, 900, 0.9, -0.9);
        burst(60, w, h * 0.7, 900, 0.9, -Math.PI + 0.9);
      }, ROLL_MS + 350),
    );

    let raf = 0;
    let last = performance.now();
    let emberAcc = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      emberAcc += dt * (milestone ? 26 : 16);
      while (emberAcc >= 1 && parts.length < 220) {
        ember();
        emberAcc -= 1;
      }
      emberAcc = Math.min(emberAcc, 3);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0 || p.y > h + 40) {
          parts.splice(i, 1);
          continue;
        }
        p.vy += p.g * dt;
        p.vx *= p.shape === 2 ? 1 : 1 - dt * 0.9;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const a = Math.min(1, p.life / (p.max * 0.4));
        ctx.globalAlpha = p.shape === 2 ? a * 0.85 : a;
        ctx.fillStyle = p.color;
        if (p.shape === 2) {
          ctx.beginPath();
          ctx.arc(p.x + Math.sin(p.life * 4 + p.x) * 6, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          if (p.shape === 0) {
            // переворот полоски создаёт мерцание
            ctx.scale(1, Math.cos(p.life * 8 + p.rot));
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", resize);
    };
  }, [milestone]);

  return (
    <div
      className={`sc-overlay sc-tier-${tier} ${milestone ? "sc-milestone" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Серия продлена: ${to} ${streakWord(to)} подряд`}
    >
      <canvas ref={canvasRef} className="sc-canvas" aria-hidden="true" />
      <div className="sc-glow" aria-hidden="true" />
      {milestone && (
        <>
          <span className="sc-shock" aria-hidden="true" />
          <span className="sc-shock sc-shock-2" aria-hidden="true" />
        </>
      )}

      <div className="sc-stage">
        <div className="sc-hero">
          <div className="sc-flame">
            <StreakFlame lit />
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`sc-spark sc-spark-${i}`} aria-hidden="true" />
          ))}
        </div>

        <div className="sc-count" aria-hidden="true">
          <span className="sc-roll">
            <span className="sc-old">{from}</span>
            <span className="sc-new">{to}</span>
          </span>
        </div>
        <p className="sc-label">{streakWord(to)} подряд</p>

        {milestone && <span className="sc-pill">Новый рубеж!</span>}
        <p className="sc-msg" role="status">
          {streakMessage(to)}
        </p>

        <div className="sc-week">
          <StreakWeek streak={to} todayDone animated />
        </div>

        <button type="button" className="btn btn-big sc-btn" disabled={!ready} onClick={onClose} autoFocus>
          Продолжить
        </button>
      </div>
    </div>
  );
}
