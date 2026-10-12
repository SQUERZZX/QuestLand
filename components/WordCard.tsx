"use client";

import { useState } from "react";
import SpeakButton from "@/components/SpeakButton";
import { sfx } from "@/lib/audio";
import { markWord, statusOf, wordOf } from "@/lib/vocab";
import type { VocabStatus } from "@/lib/vocab";
import type { Question } from "@/lib/quests";

// Показывается после ответа: «я знаю это слово» или «добавить в словарь»
export default function WordCard({
  question,
  chapterId,
}: {
  question: Question;
  chapterId?: string;
}) {
  const pair = wordOf(question);
  const [status, setStatus] = useState<VocabStatus | null>(() =>
    pair ? statusOf(pair.en) : null,
  );
  if (!pair) return null;

  const choose = (s: VocabStatus) => {
    markWord(pair, s, chapterId);
    sfx(s === "known" ? "right" : "gem");
    setStatus(s);
  };

  return (
    <div className="word" role="group" aria-label="Слово для словаря">
      <p className="word-line">
        <strong>{pair.en}</strong> — {pair.ru} <SpeakButton text={pair.en} />
      </p>
      <div className="word-btns">
        <button
          type="button"
          className={`btn btn-ghost word-btn ${status === "known" ? "word-on" : ""}`}
          onClick={() => choose("known")}
        >
          ✓ Я знаю это слово
        </button>
        <button
          type="button"
          className={`btn btn-ghost word-btn ${status === "learning" ? "word-on" : ""}`}
          onClick={() => choose("learning")}
        >
          ＋ Не знаю, в словарь
        </button>
      </div>
      {status && (
        <p className="dim word-note" role="status">
          {status === "known"
            ? "Отмечено как выученное."
            : "Добавлено в словарь. Повторить можно на странице «Словарь»."}
        </p>
      )}
    </div>
  );
}
