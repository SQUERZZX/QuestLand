"use client";

import { speakWord } from "@/lib/audio";

// Кнопка «произнести слово». Сейчас звука нет: см. speakWord в lib/audio.ts
export default function SpeakButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      className="btn btn-ghost speak-btn"
      aria-label={`Произнести: ${text}`}
      title="Произнести"
      onClick={() => speakWord(text)}
    >
      🔊
    </button>
  );
}
