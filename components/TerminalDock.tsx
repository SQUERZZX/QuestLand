"use client";

import { useState } from "react";
import Terminal from "@/components/Terminal";

// Кнопка и окно терминала поверх игрового мира в Лесу кода
export default function TerminalDock() {
  const [open, setOpen] = useState(false);

  const show = () => {
    // отпускаем клавиши игры, чтобы герой не бежал, пока ты печатаешь
    window.dispatchEvent(new Event("blur"));
    setOpen(true);
  };

  return (
    <>
      {!open && (
        <button type="button" className="dock-btn" onClick={show}>
          <span aria-hidden="true">⌨</span> Терминал
        </button>
      )}

      {open && (
        <div
          className="dock-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Терминал"
          onClick={() => setOpen(false)}
        >
          <div className="dock-panel" onClick={(e) => e.stopPropagation()}>
            <Terminal autoFocus onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
