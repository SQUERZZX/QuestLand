"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { LANDS } from "@/lib/lands";

export default function WorldMap() {
  const [activeId, setActiveId] = useState(LANDS[0].id);
  const active = LANDS.find((l) => l.id === activeId) ?? LANDS[0];

  // Плавная тропа, проходящая через все земли
  const path = LANDS.reduce((d, land, i) => {
    if (i === 0) return `M ${land.x} ${land.y}`;
    const prev = LANDS[i - 1];
    const mid = (prev.x + land.x) / 2;
    return `${d} C ${mid} ${prev.y}, ${mid} ${land.y}, ${land.x} ${land.y}`;
  }, "");

  return (
    <div className="world">
      <div className="map">
        <svg viewBox="0 0 100 70" aria-hidden="true">
          <path d={path} className="trail" />
        </svg>

        {LANDS.map((land) => (
          <button
            key={land.id}
            type="button"
            className={`node ${land.id === activeId ? "node-active" : ""}`}
            style={
              {
                left: `${land.x}%`,
                top: `${(land.y / 70) * 100}%`,
                "--land": land.color,
              } as CSSProperties
            }
            aria-pressed={land.id === activeId}
            onClick={() => setActiveId(land.id)}
          >
            <span className="node-dot" />
            <span className="node-name">{land.name}</span>
          </button>
        ))}
      </div>

      <aside className="panel" style={{ "--land": active.color } as CSSProperties}>
        <h2>{active.name}</h2>
        <p className="dim">{active.tagline}</p>

        <ul className="quests">
          {active.quests.map((q) => (
            <li key={q.title}>
              <span>{q.title}</span>
              <span className="xp">+{q.xp} XP</span>
            </li>
          ))}
        </ul>

        <button type="button" className="btn">
          Начать квест
        </button>
      </aside>
    </div>
  );
}