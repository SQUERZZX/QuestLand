"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { checkTask } from "@/lib/codeTasks";
import type { CodeTask } from "@/lib/codeTasks";

type Props = {
  speaker: string;
  color: string;
  task: CodeTask;
  onSolved: () => void; // код верный
  onGiveUp: () => void; // игрок сдался: задание засчитывается как неверное
};

type Fail = { reason: string; output: string[]; tries: number };

// Терминал, который появляется после согласия игрока помочь жителю
export default function CodeChallenge({
  speaker,
  color,
  task,
  onSolved,
  onGiveUp,
}: Props) {
  const [code, setCode] = useState(task.starter);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<Fail | null>(null);
  const [solved, setSolved] = useState(false);
  const tries = useRef(0);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  const submit = async () => {
    if (busy || solved || code.trim() === "") return;
    setBusy(true);
    const res = await checkTask(task, code);
    setBusy(false);
    if (res.ok) {
      setSolved(true);
      return;
    }
    tries.current += 1;
    setFail({ reason: res.reason, output: res.output, tries: tries.current });
  };

  const closeFail = () => {
    setFail(null);
    requestAnimationFrame(() => areaRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: a, selectionEnd: b } = el;
      setCode(code.slice(0, a) + "  " + code.slice(b));
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = a + 2;
      });
    }
  };

  return (
    <div
      className="talk code-ask"
      role="dialog"
      aria-label={`Задание: ${speaker}`}
      // клавиши терминала не должны доходить до игры
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <div className="talk-body">
        <div className="talk-name" style={{ color }}>
          {speaker}
        </div>
        <p className="talk-text">{task.prompt}</p>

        <div className="term">
          <div className="term-bar">
            <span className="term-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="term-title">терминал · задание</span>
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
              rows={6}
              disabled={solved}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="Код JavaScript"
            />
          </label>
        </div>

        {solved ? (
          <>
            <p className="talk-text" role="status">
              <strong>Верно.</strong> {task.success}
            </p>
            <button type="button" className="btn" onClick={onSolved} autoFocus>
              Дальше
            </button>
          </>
        ) : (
          <div className="term-actions">
            <button
              type="button"
              className="btn"
              onClick={() => void submit()}
              disabled={busy || code.trim() === ""}
            >
              {busy ? "Проверяю…" : "Запустить и проверить"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onGiveUp}>
              Не получается, пропустить
            </button>
            <span className="dim term-keys">Ctrl + Enter</span>
          </div>
        )}
      </div>

      {fail && (
        <div
          className="code-fail-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-label="Код не подошёл"
        >
          <div className="code-fail">
            <h3>Не получилось</h3>
            <p>{fail.reason}</p>
            {fail.output.length > 0 && (
              <pre className="term-line">{fail.output.join("\n")}</pre>
            )}
            {fail.tries >= 2 && (
              <p className="dim">
                Подсказка: <code>{task.hint}</code>
              </p>
            )}
            <button type="button" className="btn" onClick={closeFail} autoFocus>
              Исправить код
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
