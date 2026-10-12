"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import GameWorld from "@/components/GameWorld";
import TerminalDock from "@/components/TerminalDock";
import WordCard from "@/components/WordCard";
import { sfx } from "@/lib/audio";
import { CHAPTERS } from "@/lib/chapters";
import type { Chapter } from "@/lib/chapters";
import { LANDS } from "@/lib/lands";
import { levelsOf } from "@/lib/levels";
import type { LevelId } from "@/lib/levels";
import { applyCompletion, nextLevelOf } from "@/lib/progressionManager";
import { QUEST_CONTENT } from "@/lib/quests";
import type { Question } from "@/lib/quests";
import { loadSave, writeSave } from "@/lib/storage";

type Phase = "loading" | "play" | "result";

const LOADING_MS = 2800;

const TIPS = [
  "Каждый день даёт шаг вперёд. Пропуск стоит жизни.",
  "Ошибка тоже опыт: после каждого ответа есть объяснение.",
  "Чтобы пройти квест, нужно ответить верно на две трети вопросов.",
];

function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}

export default function QuestWorld({ questId }: { questId: string }) {
  const chapter: Chapter | undefined = CHAPTERS[questId];
  const landId = chapter ? chapter.land : questId;
  const land = LANDS.find((l) => l.id === landId);
  const questions: Question[] | undefined = chapter
    ? chapter.npcs.map((n) => n.question)
    : QUEST_CONTENT[landId];

  const [phase, setPhase] = useState<Phase>("loading");
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [awarded, setAwarded] = useState(false);
  const [finished, setFinished] = useState<LevelId | null>(null);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(() => setPhase("play"), LOADING_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (!land || !questions) return null;

  const style = { "--land": land.color } as CSSProperties;
  const q = questions[step];
  const baseXp = chapter ? chapter.xp : land.quests[0].xp;
  const passMark = Math.ceil((questions.length * 2) / 3);
  const reward = Math.round((baseXp * correct) / questions.length);
  const passed = correct >= passMark;
  const tip = TIPS[LANDS.indexOf(land) % TIPS.length];

  const finish = (finalCorrect: number) => {
    setCorrect(finalCorrect);
    if (finalCorrect >= passMark) {
      const xp = Math.round((baseXp * finalCorrect) / questions.length);
      const result = applyCompletion(loadSave(), land.id, questId, xp);
      if (result.awarded) writeSave(result.save);
      setAwarded(result.awarded);
      setFinished(result.finishedLevel);
    }
    setPhase("result");
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    sfx(i === q.answer ? "right" : "wrong");
    if (i === q.answer) setCorrect((c) => c + 1);
  };

  const nextStep = () => {
    if (step + 1 < questions.length) {
      setStep(step + 1);
      setPicked(null);
      return;
    }
    finish(correct);
  };

  const retry = () => {
    setStep(0);
    setPicked(null);
    setCorrect(0);
    setAwarded(false);
    setFinished(null);
    setPhase("play");
  };

  if (phase === "loading") {
    return (
      <main className="load" style={style}>
        <svg className="load-map" viewBox="0 0 200 60" aria-hidden="true">
          <path
            className="load-trail"
            pathLength={1}
            d="M10 45 C 50 45, 50 15, 90 20 S 150 50, 190 15"
          />
        </svg>
        <div role="status">
          <h1>{chapter ? chapter.title : land.name}</h1>
          <p className="dim">Открываем землю…</p>
        </div>
        <div className="bar load-bar">
          <div className="bar-fill load-fill" />
        </div>
        <p className="dim load-tip">{tip}</p>
      </main>
    );
  }

  if (phase === "result") {
    return (
      <ResultScreen
        style={style}
        passed={passed}
        correct={correct}
        total={questions.length}
        passMark={passMark}
        reward={reward}
        awarded={awarded}
        finished={finished}
        landId={land.id}
        onRetry={retry}
      />
    );
  }

  // Игровой мир на весь экран, если для земли есть глава
  if (chapter) {
    return (
      <>
        <GameWorld chapter={chapter} onFinish={finish} />
        {land.id === "code" && <TerminalDock />}
      </>
    );
  }

  // Обычный опрос для земель без главы
  return (
    <main className="wrap quest" style={style}>
      <header className="quest-top">
        <Link href="/dashboard" className="dim">
          Выйти из земли
        </Link>
        <span>{land.name}</span>
      </header>

      <div className="pips" aria-hidden="true">
        {questions.map((_, i) => (
          <span
            key={i}
            className={`pip ${i < step ? "pip-done" : ""} ${i === step ? "pip-now" : ""}`}
          />
        ))}
      </div>

      <section className="scene">
        <h2>{q.prompt}</h2>

        <div className="options">
          {q.options.map((option, i) => {
            let state = "";
            if (picked !== null) {
              if (i === q.answer) state = "opt-right";
              else if (i === picked) state = "opt-wrong";
            }
            return (
              <button
                key={option}
                type="button"
                className={`opt ${state}`}
                disabled={picked !== null}
                onClick={() => pick(i)}
              >
                {option}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="feedback" role="status">
            <p>
              <strong>{picked === q.answer ? "Верно." : "Не совсем."}</strong>{" "}
              {q.explain}
            </p>
            {land.id === "english" && (
              <WordCard key={step} question={q} chapterId={questId} />
            )}
            <button type="button" className="btn" onClick={nextStep}>
              {step + 1 < questions.length ? "Дальше" : "Завершить квест"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function ResultScreen({
  style,
  passed,
  correct,
  total,
  passMark,
  reward,
  awarded,
  finished,
  landId,
  onRetry,
}: {
  style: CSSProperties;
  passed: boolean;
  correct: number;
  total: number;
  passMark: number;
  reward: number;
  awarded: boolean;
  finished: LevelId | null;
  landId: string;
  onRetry: () => void;
}) {
  const xpShown = useCountUp(passed && awarded ? reward : 0);
  const level = finished ? levelsOf(landId).find((l) => l.id === finished) : undefined;
  const nextLevel = finished ? nextLevelOf(finished, landId) : null;

  return (
    <main className="wrap" style={style}>
      <section className="result">
        {passed && level && (
          <div className="badge-wrap" aria-hidden="true">
            <span className="badge-ring" />
            <span className="badge-ring" />
            <span className="badge">{level.code}</span>
          </div>
        )}

        {passed ? (
          <>
            <h1>{level ? `Уровень ${level.code} пройден` : "Квест пройден"}</h1>
            <p>
              Верных ответов: {correct} из {total}
            </p>
            {awarded ? (
              <p className="xp">+{xpShown} XP</p>
            ) : (
              <p className="dim">Награда за этот квест уже получена.</p>
            )}
            {level && (
              <p className="dim">
                {nextLevel
                  ? `Следующий уровень: ${nextLevel.code} «${nextLevel.title}». Он уже открыт на главной.`
                  : "Это высший уровень. Ты прошёл весь путь до конца."}
              </p>
            )}
          </>
        ) : (
          <>
            <h1>Не хватило сил</h1>
            <p>
              Верных ответов: {correct} из {total}. Нужно минимум {passMark}.
            </p>
          </>
        )}

        <div className="result-actions">
          {!passed && (
            <button type="button" className="btn" onClick={onRetry}>
              Попробовать ещё раз
            </button>
          )}
          <Link href="/dashboard" className={passed ? "btn" : "btn btn-ghost"}>
            Вернуться к герою
          </Link>
        </div>
      </section>
    </main>
  );
}