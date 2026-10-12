"use client";

import { useEffect, useState } from "react";
import { getAudio, setAudio } from "@/lib/audio";

// Кнопка в шапке мира: звуки вкл/выкл
export default function AudioToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(getAudio().sfx);
  }, []);

  const flip = () => setOn(setAudio({ sfx: !on }).sfx);

  return (
    <button type="button" className="hud-chip hud-btn" aria-pressed={on} onClick={flip}>
      {on ? "🔊" : "🔇"} Звуки
    </button>
  );
}
