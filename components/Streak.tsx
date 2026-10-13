"use client";

import { useId } from "react";
import type { CSSProperties } from "react";
import { weekCells } from "@/lib/streak";

// Пламя серии. Горит и мерцает, если lit, иначе серый уголёк.
export function StreakFlame({ lit = true, className = "" }: { lit?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`sf ${lit ? "sf-lit" : "sf-off"} ${className}`}
      viewBox="0 0 100 130"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--f1b)" }} />
          <stop offset="1" style={{ stopColor: "var(--f1)" }} />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--f2)" }} />
          <stop offset="1" style={{ stopColor: "var(--f1b)" }} />
        </linearGradient>
        <linearGradient id={`${id}i`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--f3)" }} />
          <stop offset="1" style={{ stopColor: "var(--f2)" }} />
        </linearGradient>
      </defs>
      <path
        className="sf-outer"
        fill={`url(#${id}o)`}
        d="M52 2C56 22 82 38 82 76C82 104 68 124 50 124C32 124 18 104 18 76C18 56 28 44 36 30C38 40 42 46 48 46C48 30 46 14 52 2Z"
      />
      <path
        className="sf-mid"
        fill={`url(#${id}m)`}
        d="M50 40C54 56 70 64 70 86C70 104 61 116 50 116C39 116 30 104 30 86C30 72 38 66 42 56C44 62 47 64 50 64C50 54 48 46 50 40Z"
      />
      <path
        className="sf-in"
        fill={`url(#${id}i)`}
        d="M50 78C53 88 60 92 60 102C60 110 55 115 50 115C45 115 40 110 40 102C40 94 46 90 50 78Z"
      />
    </svg>
  );
}

// Полоска недели: Пн–Вс, закрашены дни серии
export function StreakWeek({
  streak,
  todayDone,
  animated = false,
}: {
  streak: number;
  todayDone: boolean;
  animated?: boolean;
}) {
  const cells = weekCells(streak, todayDone);
  return (
    <ol className={`sw ${animated ? "sw-anim" : ""}`} aria-label="Неделя">
      {cells.map((c, i) => (
        <li
          key={c.label}
          className={`sw-day sw-${c.state} ${c.today ? "sw-now" : ""}`}
          style={{ "--i": i } as CSSProperties}
          aria-label={`${c.label}: ${c.state === "done" ? "серия" : c.state === "pending" ? "сегодня" : "нет"}`}
        >
          <span className="sw-label">{c.label}</span>
          <span className="sw-dot">
            {c.state === "done" &&
              (c.today ? (
                <StreakFlame lit className="sw-flame" />
              ) : (
                <svg className="sw-check" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ))}
          </span>
        </li>
      ))}
    </ol>
  );
}
