"use client";

import { useEffect, useState } from "react";
import { getAudio, setAudio } from "@/lib/audio";
import type { AudioSettings } from "@/lib/audio";

// Две кнопки в шапке мира: звуки и голоса
export default function AudioToggle() {
  const [s, setS] = useState<AudioSettings>({ sfx: true, voice: true });

  useEffect(() => {
    setS(getAudio());
  }, []);

  const flip = (key: keyof AudioSettings) => setS(setAudio({ [key]: !s[key] }));

  return (
    <>
      <button
        type="button"
        className="hud-chip hud-btn"
        aria-pressed={s.sfx}
        onClick={() => flip("sfx")}
      >
        {s.sfx ? "🔊" : "🔇"} Звуки
      </button>
      <button
        type="button"
        className="hud-chip hud-btn"
        aria-pressed={s.voice}
        onClick={() => flip("voice")}
      >
        {s.voice ? "🗣" : "🤐"} Голоса
      </button>
    </>
  );
}
