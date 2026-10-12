"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { MAX_LIVES, getRank } from "@/lib/hero";
import { LANDS } from "@/lib/lands";
import { LEVEL_SETS, levelsOf } from "@/lib/levels";
import {
  getDailyQuests,
  getLevel,
  hasChapters,
  levelProgress,
  setLevel,
  skipDay,
} from "@/lib/progressionManager";
import { EMPTY_SAVE, loadSave, writeSave } from "@/lib/storage";
import type { SaveData } from "@/lib/storage";

export default function Dashboard() {
  const [save, setSave] = useState<SaveData>(EMPTY_SAVE);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [fallen, setFallen] = useState(false);
  const [lostCount, setLostCount] = useState(0);

  useEffect(() => {
    setSave(loadSave());
    setReady(true);
  }, []);

  if (!ready) return null;

  const { hero, done, focus } = save;
  const { current, next } = getRank(hero.xp);
  const progress = next
    ? Math.round(((hero.xp - current.xp) / (next.xp - current.xp)) * 100)
    : 100;

  const showPicker = focus.length === 0 || editing;
  const quests = getDailyQuests(save);
  const lands = LANDS.filter((l) => focus.includes(l.id));
  const allDone = lands.length > 0 && lands.every((l) => done.includes(l.id));
  const hasCode = focus.includes("code");
  const focusNames = LANDS.filter((l) => focus.includes(l.id))
    .map((l) => l.name)
    .join(", ");

  const update = (data: SaveData) => {
    setSave(data);
    writeSave(data);
  };

  const toggle = (id: string) => {
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  };

  const startPath = () => {
    update({ ...save, focus: chosen });
    setEditing(false);
  };

  const changeFocus = () => {
    setChosen(focus);
    setEditing(true);
  };

  // Демо: потом это будет считать бэкенд по дате последнего входа
  const onSkip = () => {
    const result = skipDay(save);
    setFallen(result.fallen);
    setLostCount((n) => n + 1);
    update(result.save);
  };

  if (showPicker) {
    return (
      <main className="wrap">
        <header className="top">
          <Link href="/" className="logo">
            QuestLands
          </Link>
        </header>

        <section className="pick">
          <h1>Выбери направление</h1>
          <p className="dim">
            Квесты на каждый день будут только из выбранных земель. Направление
            можно сменить позже.
          </p>

          <div className="lands">
            {LANDS.map((land) => {
              const on = chosen.includes(land.id);
              return (
                <button
                  key={land.id}
                  type="button"
                  className={`land-card ${on ? "land-on" : ""}`}
                  style={{ "--land": land.color } as CSSProperties}
                  aria-pressed={on}
                  onClick={() => toggle(land.id)}
                >
                  <span className="land-name">{land.name}</span>
                  <span className="dim">{land.tagline}</span>
                  <span className="land-tag">
                    {hasChapters(land.id)
                      ? `Сюжетные главы, уровни ${levelsOf(land.id)[0].code}–${levelsOf(land.id).slice(-1)[0].code}`
                      : "Пока обычный опрос"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pick-actions">
            <button
              type="button"
              className="btn"
              disabled={chosen.length === 0}
              onClick={startPath}
            >
              {editing ? "Сохранить" : "Начать путь"}
            </button>
            {editing && focus.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditing(false)}
              >
                Отмена
              </button>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header className="top">
        <Link href="/" className="logo">
          QuestLands
        </Link>
        <span className="top-side">
          {hasCode && (
            <Link href="/terminal" className="btn btn-ghost top-term">
              ⌨ Терминал
            </Link>
          )}
          <span className="dim">{current.name}</span>
        </span>
      </header>

      {fallen && (
        <p className="alert" role="alert">
          Жизни закончились. XP, серия и главы текущего уровня сброшены, начни
          уровень заново.
        </p>
      )}

      <section className="stats">
        <div key={lostCount} className={`stat ${lostCount > 0 ? "shake" : ""}`}>
          <span className="dim">Жизни</span>
          <span className="hearts" aria-label={`${hero.lives} из ${MAX_LIVES}`}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <span key={i} className={i < hero.lives ? "" : "heart-lost"}>
                ♥
              </span>
            ))}
          </span>
        </div>

        <div className="stat">
          <span className="dim">Серия дней</span>
          <strong>{hero.streak}</strong>
        </div>

        <div className="stat">
          <span className="dim">Опыт</span>
          <strong className="xp">{hero.xp} XP</strong>
        </div>
      </section>

      <section className="rank">
        <div className="rank-row">
          <span>{current.name}</span>
          <span className="dim">
            {next ? `До «${next.name}»: ${next.xp - hero.xp} XP` : "Высший ранг"}
          </span>
        </div>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section>
        <h2 className="section-title">Квесты</h2>
        <p className="dim focus-line">
          Направление: {focusNames}.{" "}
          <button type="button" className="link-btn" onClick={changeFocus}>
            Сменить
          </button>
        </p>

        {allDone && (
          <p className="alert alert-ok" role="status">
            Дневная цель выполнена, серия засчитана. Можешь пройти ещё главы или вернуться завтра, чтобы не потерять жизнь.
          </p>
        )}
      </section>

      {lands.map((land) => {
        const landQuests = quests.filter((q) => q.landId === land.id);
        const levels = levelsOf(land.id);
        const withPath = hasChapters(land.id) && levels.length > 0;
        const curLevel = getLevel(save, land.id);

        return (
          <section
            key={land.id}
            className="land-block"
            style={{ "--land": land.color } as CSSProperties}
          >
            <div className="land-head">
              <div>
                <h2 className="land-title">{land.name}</h2>
                <p className="dim">{land.tagline}</p>
              </div>
              {land.id === "code" && (
                <Link href="/terminal" className="btn btn-ghost land-term">
                  ⌨ Терминал
                </Link>
              )}
            </div>

            <h3 className="land-sub">Квесты</h3>
            <ul className="today">
              {landQuests.map((q) => {
                const isDone = q.state === "done";
                const isLocked = q.state === "locked";
                return (
                  <li
                    key={q.id}
                    className={`today-item ${isDone ? "today-done" : ""}`}
                    style={{ "--land": q.color } as CSSProperties}
                  >
                    <div className="today-title">{q.title}</div>
                    <div className="today-side">
                      <span className="xp">+{q.xp} XP</span>
                      {isLocked ? (
                        <button type="button" className="btn btn-ghost" disabled>
                          Закрыт
                        </button>
                      ) : isDone && q.replay ? (
                        <Link href={`/quest/${q.id}`} className="btn btn-ghost">
                          Играть снова
                        </Link>
                      ) : isDone ? (
                        <button type="button" className="btn" disabled>
                          Пройден
                        </button>
                      ) : (
                        <Link href={`/quest/${q.id}`} className="btn">
                          Начать квест
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {withPath && (
              <>
                <h3 className="land-sub">{LEVEL_SETS[land.id].pathTitle}</h3>
                <p className="dim focus-line">
                  Выбери свой уровень. Когда пройдёшь все главы уровня,
                  следующий откроется сам.
                </p>

                <ul className="levels">
                  {levels.map((lv, i) => {
                    const p = levelProgress(save, lv.id, land.id);
                    const now = curLevel === lv.id;
                    const pct =
                      p.total > 0 ? Math.round((p.passed / p.total) * 100) : 0;
                    return (
                      <li
                        key={lv.id}
                        className={`level ${now ? "level-now" : ""} ${p.complete ? "level-done" : ""}`}
                        style={{ animationDelay: `${i * 90}ms` }}
                      >
                        <span className="level-code">{lv.code}</span>
                        <span className="level-title">{lv.title}</span>
                        <span className="dim">{lv.desc}</span>
                        <div
                          className="bar"
                          role="progressbar"
                          aria-label={`Прогресс ${lv.code}`}
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div className="bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="dim">
                          Глав пройдено: {p.passed} из {p.total}
                        </span>
                        <button
                          type="button"
                          className={now ? "btn" : "btn btn-ghost"}
                          disabled={now}
                          onClick={() => update(setLevel(save, land.id, lv.id))}
                        >
                          {now ? "Сейчас учишь" : `Выбрать ${lv.code}`}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        );
      })}

      <button type="button" className="btn btn-ghost demo" onClick={onSkip}>
        Демо: пропустить день
      </button>
    </main>
  );
}