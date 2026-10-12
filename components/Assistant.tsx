"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { getRank } from "@/lib/hero";
import {
  ASSISTANT_NAME,
  DEFAULT_PREFS,
  OPENING,
  QUICK,
  isGameKind,
  loadPrefs,
  localAnswer,
  pageKindOf,
  savePrefs,
  tipsFor,
} from "@/lib/assistant";
import type { Prefs } from "@/lib/assistant";
import { EMPTY_SAVE, loadSave } from "@/lib/storage";

type Msg = { role: "user" | "assistant"; text: string };

const TIP_DELAY = 3000; // через сколько после входа на страницу появится подсказка
const TIP_SHOW = 10000; // сколько подсказка висит на экране

// Талисман: маленький светлячок
function Pip({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="as-pip">
      <ellipse cx="13" cy="35" rx="9" ry="13" fill="#38bdf8" opacity="0.6" transform="rotate(-22 13 35)" className="as-wing as-wing-l" />
      <ellipse cx="51" cy="35" rx="9" ry="13" fill="#38bdf8" opacity="0.6" transform="rotate(22 51 35)" className="as-wing as-wing-r" />
      <line x1="32" y1="17" x2="32" y2="9" stroke="#f4a300" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="7" r="4" fill="#2dd4a0" className="as-glow" />
      <circle cx="32" cy="37" r="20" fill="#ffc857" />
      <ellipse cx="32" cy="44" rx="12" ry="9" fill="#fff1c9" />
      <g className="as-eyes">
        <circle cx="25" cy="34" r="3.6" fill="#0b1020" />
        <circle cx="39" cy="34" r="3.6" fill="#0b1020" />
        <circle cx="26.2" cy="32.8" r="1.2" fill="#fff" />
        <circle cx="40.2" cy="32.8" r="1.2" fill="#fff" />
      </g>
      <circle cx="19" cy="41" r="3" fill="#ff8fa3" opacity="0.6" />
      <circle cx="45" cy="41" r="3" fill="#ff8fa3" opacity="0.6" />
      <path d="M27 42 Q32 47 37 42" fill="none" stroke="#0b1020" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Assistant() {
  const pathname = usePathname();
  const kind = pageKindOf(pathname);
  const inGame = isGameKind(kind);

  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);

  const tipIdx = useRef(0);
  const openRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((p) => {
      const next = { ...p, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  useEffect(() => {
    setPrefsState(loadPrefs());
    setReady(true);
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Отпускаем клавиши игры, чтобы герой не бежал, пока ты печатаешь
  const releaseGameKeys = () => window.dispatchEvent(new Event("blur"));

  const nextTip = useCallback((): string => {
    const list = tipsFor(kind, ready ? loadSave() : EMPTY_SAVE);
    const t = list[tipIdx.current % list.length];
    tipIdx.current += 1;
    return t;
  }, [kind, ready]);

  // Подсказка при входе на страницу
  useEffect(() => {
    setTip(null);
    tipIdx.current = 0;
    if (!ready || !prefs.enabled || !prefs.greeted || !prefs.tips) return;

    const show = window.setTimeout(() => {
      if (!openRef.current) setTip(nextTip());
    }, TIP_DELAY);
    return () => window.clearTimeout(show);
  }, [pathname, ready, prefs.enabled, prefs.greeted, prefs.tips, nextTip]);

  // Подсказка сама уходит через несколько секунд
  useEffect(() => {
    if (!tip) return;
    const hide = window.setTimeout(() => setTip(null), TIP_SHOW);
    return () => window.clearTimeout(hide);
  }, [tip]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, busy, open]);

  const openPanel = () => {
    releaseGameKeys();
    setTip(null);
    setOpen(true);
    setMsgs((m) => (m.length ? m : [{ role: "assistant", text: OPENING[kind] }]));
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const hideAssistant = () => {
    setOpen(false);
    setTip(null);
    setPrefs({ enabled: false, greeted: true });
  };

  const bringBack = () => {
    setPrefs({ enabled: true, greeted: true });
    window.setTimeout(openPanel, 0);
  };

  const accept = () => setPrefs({ greeted: true, enabled: true });
  const decline = () => setPrefs({ greeted: true, enabled: false });

  const askTip = () => {
    const t = nextTip();
    setMsgs((m) => [...m, { role: "assistant", text: `💡 ${t}` }]);
  };

  async function send(text: string) {
    const q = text.trim().slice(0, 500);
    if (!q || busy) return;

    const history: Msg[] = [...msgs, { role: "user", text: q }];
    setMsgs(history);
    setInput("");
    setBusy(true);

    let reply: string | null = null;
    try {
      const s = loadSave();
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-10),
          context: {
            kind,
            hero: {
              xp: s.hero.xp,
              lives: s.hero.lives,
              streak: s.hero.streak,
              rank: getRank(s.hero.xp).current.name,
            },
            level: s.level,
            codeLevel: s.codeLevel,
          },
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { reply?: unknown };
        if (typeof data.reply === "string" && data.reply) reply = data.reply;
      }
    } catch {
      /* сеть недоступна — отвечаем сами */
    }

    setOffline(reply === null);
    setMsgs((m) => [...m, { role: "assistant", text: reply ?? localAnswer(q, kind) }]);
    setBusy(false);
  }

  // Пока человек пишет сообщение, клавиши не должны уходить в игру
  const keepKeysHere = (e: ReactKeyboardEvent) => {
    e.stopPropagation();
    if (e.type === "keydown" && e.key === "Escape") setOpen(false);
  };

  if (!ready) return null;

  /* ---- Помощник убран: маленькая кнопка, чтобы вернуть ---- */
  if (!prefs.enabled && prefs.greeted) {
    return (
      <div className={`as-root ${inGame ? "as-top" : ""}`}>
        <button type="button" className="as-back" onClick={bringBack}>
          ✨ Позвать {ASSISTANT_NAME}а
        </button>
      </div>
    );
  }

  /* ---- Первая встреча ---- */
  if (!prefs.greeted) {
    return (
      <div className="as-root as-welcome-root" onKeyDown={keepKeysHere} onKeyUp={keepKeysHere}>
        <div className="as-welcome" role="dialog" aria-label={`Знакомство с помощником ${ASSISTANT_NAME}`}>
          <Pip size={84} />
          <div>
            <h2>Привет, я {ASSISTANT_NAME}!</h2>
            <p>
              Я буду рядом в игре и в меню: подскажу, что делать, и отвечу на вопросы. Если
              помешаю, меня можно убрать, а потом вернуть.
            </p>
            <div className="as-welcome-btns">
              <button type="button" className="btn" onClick={accept}>
                Привет, {ASSISTANT_NAME}!
              </button>
              <button type="button" className="btn btn-ghost" onClick={decline}>
                Не нужен
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Обычный режим ---- */
  return (
    <div
      className={`as-root ${inGame ? "as-top" : ""}`}
      onKeyDown={keepKeysHere}
      onKeyUp={keepKeysHere}
      onFocusCapture={releaseGameKeys}
    >
      {open && (
        <section className="as-panel" role="dialog" aria-label={`Помощник ${ASSISTANT_NAME}`}>
          <header className="as-head">
            <strong>{ASSISTANT_NAME}</strong>
            <span className="as-sub">{offline ? "без ИИ, только про игру" : "помощник"}</span>
            <div className="as-head-btns">
              <button type="button" onClick={askTip} title="Подсказка" aria-label="Подсказка">
                💡
              </button>
              <button
                type="button"
                onClick={() => setPrefs({ tips: !prefs.tips })}
                aria-pressed={prefs.tips}
                title={prefs.tips ? "Выключить всплывающие подсказки" : "Включить всплывающие подсказки"}
                aria-label="Всплывающие подсказки"
              >
                {prefs.tips ? "🔔" : "🔕"}
              </button>
              <button type="button" onClick={() => setOpen(false)} title="Свернуть" aria-label="Свернуть">
                —
              </button>
              <button type="button" onClick={hideAssistant} title="Убрать помощника" aria-label="Убрать помощника">
                ✕
              </button>
            </div>
          </header>

          <div className="as-list" ref={listRef} aria-live="polite">
            {msgs.map((m, i) => (
              <p key={i} className={m.role === "user" ? "as-msg as-me" : "as-msg as-bot"}>
                {m.text}
              </p>
            ))}
            {busy && <p className="as-msg as-bot as-typing">…</p>}
          </div>

          {msgs.length <= 1 && (
            <div className="as-quick">
              {QUICK[kind].map((q) => (
                <button key={q} type="button" onClick={() => send(q)} disabled={busy}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className="as-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спроси что-нибудь…"
              maxLength={500}
              aria-label="Вопрос помощнику"
            />
            <button type="submit" className="as-send" disabled={busy || !input.trim()} aria-label="Отправить">
              ➤
            </button>
          </form>
        </section>
      )}

      {!open && tip && (
        <button type="button" className="as-bubble" onClick={openPanel}>
          {tip}
        </button>
      )}

      <button
        type="button"
        className="as-fab"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={open ? "Свернуть помощника" : `Позвать помощника ${ASSISTANT_NAME}`}
        aria-expanded={open}
      >
        <Pip size={inGame ? 52 : 60} />
      </button>
    </div>
  );
}
