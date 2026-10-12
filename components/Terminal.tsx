"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { runCode } from "@/lib/runCode";
import type { RunLine } from "@/lib/runCode";

const STORAGE_KEY = "questlands-terminal-code";
const MAX_LINES_PER_RUN = 200;

const SNIPPETS: { label: string; code: string }[] = [
  { label: "Привет, мир", code: 'console.log("Привет, мир!");' },
  {
    label: "Цикл",
    code: 'for (let i = 1; i <= 5; i++) {\n  console.log("Шаг", i);\n}',
  },
  {
    label: "Функция",
    code: "function square(n) {\n  return n * n;\n}\n\nconsole.log(square(7));",
  },
  {
    label: "Массив",
    code: "const nums = [1, 2, 3, 4, 5];\nconsole.log(nums.map((n) => n * 2));\nconsole.log(nums.filter((n) => n % 2 === 0));",
  },
  {
    label: "Объект",
    code: 'const hero = { name: "Странник", xp: 120 };\nconsole.log(hero.name, hero.xp);\nconsole.log(Object.keys(hero));',
  },
  {
    label: "Async",
    code: 'const sleep = (ms) => new Promise((r) => setTimeout(r, ms));\n\nconsole.log("Жду…");\nawait sleep(500);\nconsole.log("Готово!");',
  },
];

type Entry = { id: number; code: string; lines: RunLine[]; running: boolean };

export default function Terminal({
  onClose,
  autoFocus = false,
}: {
  onClose?: () => void;
  autoFocus?: boolean;
}) {
  const [code, setCode] = useState(SNIPPETS[0].code);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [running, setRunning] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCode(saved);
    } catch {
      /* хранилище недоступно */
    }
  }, []);

  useEffect(() => {
    if (autoFocus) areaRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const save = (value: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* хранилище недоступно */
    }
  };

  const run = async () => {
    const source = code.trim();
    if (running || source === "") return;

    save(code);
    const id = nextId.current++;
    let count = 0;

    setRunning(true);
    setEntries((prev) => [...prev, { id, code, lines: [], running: true }]);

    await runCode(code, (line) => {
      count += 1;
      if (count > MAX_LINES_PER_RUN + 1) return;
      const shown: RunLine =
        count === MAX_LINES_PER_RUN + 1
          ? { kind: "warn", text: "Вывод обрезан: слишком много строк." }
          : line;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, lines: [...e.lines, shown] } : e,
        ),
      );
    });

    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, running: false } : e)),
    );
    setRunning(false);
    areaRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void run();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: a, selectionEnd: b } = el;
      const next = code.slice(0, a) + "  " + code.slice(b);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = a + 2;
      });
      return;
    }
  };

  return (
    <div
      className="term"
      onKeyDown={(e) => {
        // клавиши терминала не должны доходить до игры за ним
        e.stopPropagation();
        if (e.key === "Escape" && onClose) onClose();
      }}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <div className="term-bar">
        <span className="term-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="term-title">терминал · JavaScript</span>
        {onClose && (
          <button
            type="button"
            className="term-x"
            onClick={onClose}
            aria-label="Закрыть терминал"
          >
            ✕
          </button>
        )}
      </div>

      <div className="term-snips" role="group" aria-label="Примеры кода">
        {SNIPPETS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="term-chip"
            onClick={() => {
              setCode(s.code);
              areaRef.current?.focus();
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="term-out" ref={outRef} aria-live="polite">
        {entries.length === 0 && (
          <p className="term-hint">
            Напиши код ниже и нажми «Запустить» или Ctrl + Enter. Чтобы увидеть
            значение, используй console.log().
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="term-entry">
            <pre className="term-echo">
              {e.code
                .split("\n")
                .map((l, i) => (i === 0 ? "❯ " : "  ") + l)
                .join("\n")}
            </pre>
            {e.lines.map((l, i) => (
              <pre key={i} className={`term-line term-${l.kind}`}>
                {l.kind === "result" ? "← " : ""}
                {l.text}
              </pre>
            ))}
            {e.running && <span className="term-run">выполняется…</span>}
          </div>
        ))}
      </div>

      <label className="term-in">
        <span className="term-prompt" aria-hidden="true">
          ❯
        </span>
        <textarea
          ref={areaRef}
          className="term-area"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onKeyDown}
          rows={7}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Код JavaScript"
        />
      </label>

      <div className="term-actions">
        <button
          type="button"
          className="btn"
          onClick={() => void run()}
          disabled={running || code.trim() === ""}
        >
          {running ? "Выполняется…" : "Запустить"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setEntries([])}
          disabled={entries.length === 0}
        >
          Очистить
        </button>
        <span className="dim term-keys">Ctrl + Enter, Tab ставит отступ</span>
      </div>
    </div>
  );
}
