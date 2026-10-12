"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SpeakButton from "@/components/SpeakButton";
import { getVocab, setVocab } from "@/lib/vocab";
import type { VocabEntry, VocabStatus } from "@/lib/vocab";

type Filter = "all" | VocabStatus;

export default function Vocab() {
  const [list, setList] = useState<VocabEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<string[] | null>(null); // повторение: слова по очереди
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setList(getVocab());
    setReady(true);
  }, []);

  if (!ready) return null;

  const save = (next: VocabEntry[]) => {
    setList(next);
    setVocab(next);
  };
  const setStatus = (en: string, status: VocabStatus) =>
    save(list.map((w) => (w.en === en ? { ...w, status } : w)));
  const remove = (en: string) => save(list.filter((w) => w.en !== en));

  const learning = list.filter((w) => w.status === "learning");
  const known = list.filter((w) => w.status === "known");
  const q = query.trim().toLowerCase();
  const visible = list
    .filter((w) => filter === "all" || w.status === filter)
    .filter((w) => !q || w.en.toLowerCase().includes(q) || w.ru.toLowerCase().includes(q))
    .sort((a, b) => b.added - a.added);

  const startReview = () => {
    const ids = learning.map((w) => w.en).sort(() => Math.random() - 0.5);
    setQueue(ids);
    setShown(false);
  };

  // ---------- режим повторения ----------
  if (queue) {
    const current = queue.length > 0 ? list.find((w) => w.en === queue[0]) : undefined;
    const answer = (knowIt: boolean) => {
      if (current && knowIt) setStatus(current.en, "known");
      setQueue(queue.slice(1));
      setShown(false);
    };
    return (
      <main className="wrap vocab">
        <header className="quest-top">
          <button type="button" className="dim vocab-link" onClick={() => setQueue(null)}>
            ← К словарю
          </button>
          <span>Осталось: {queue.length}</span>
        </header>
        <section className="scene">
          {current ? (
            <>
              <h2 className="vocab-big">
                {current.en} <SpeakButton text={current.en} />
              </h2>
              {shown ? (
                <>
                  <p className="vocab-tr">{current.ru}</p>
                  <div className="word-btns">
                    <button type="button" className="btn" onClick={() => answer(true)}>
                      ✓ Знаю
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => answer(false)}>
                      Ещё учу
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" className="btn" onClick={() => setShown(true)}>
                  Показать перевод
                </button>
              )}
            </>
          ) : (
            <>
              <h2>Повторение закончено</h2>
              <p className="dim">Слова, которые ты назвал выученными, переехали в «Знаю».</p>
              <button type="button" className="btn" onClick={() => setQueue(null)}>
                К словарю
              </button>
            </>
          )}
        </section>
      </main>
    );
  }

  // ---------- список ----------
  const tabs: [Filter, string, number][] = [
    ["all", "Все", list.length],
    ["learning", "Учу", learning.length],
    ["known", "Знаю", known.length],
  ];

  return (
    <main className="wrap vocab">
      <header className="top">
        <Link href="/dashboard" className="logo">
          QuestLands
        </Link>
        <span className="dim">Словарь</span>
      </header>

      <div className="vocab-bar">
        <div className="vocab-tabs">
          {tabs.map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              className={`btn btn-ghost ${filter === id ? "word-on" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label} · {n}
            </button>
          ))}
        </div>
        <input
          className="vocab-search"
          placeholder="Поиск"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="btn"
          disabled={learning.length === 0}
          onClick={startReview}
        >
          Повторить ({learning.length})
        </button>
      </div>

      {list.length === 0 ? (
        <p className="dim">
          Пока пусто. Отвечай на вопросы жителей в английских главах: после ответа можно
          добавить слово сюда.
        </p>
      ) : (
        <ul className="vocab-list">
          {visible.map((w) => (
            <li key={w.en} className="vocab-row">
              <div>
                <strong>{w.en}</strong> <SpeakButton text={w.en} />
                <span className="dim"> — {w.ru}</span>
              </div>
              <div className="vocab-actions">
                <span className={`vocab-pill vocab-${w.status}`}>
                  {w.status === "known" ? "знаю" : "учу"}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setStatus(w.en, w.status === "known" ? "learning" : "known")}
                >
                  {w.status === "known" ? "Учить снова" : "Выучил"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={`Удалить ${w.en}`}
                  onClick={() => remove(w.en)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
