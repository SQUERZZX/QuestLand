"use client";

import { useEffect, useState } from "react";

// Телефон в вертикальном положении
const PORTRAIT_PHONE = "(orientation: portrait) and (pointer: coarse) and (max-width: 820px)";

type Orientation = ScreenOrientation & {
  lock?: (o: string) => Promise<void>;
  unlock?: () => void;
};

// На телефоне просит повернуть экран. Где браузер позволяет — сам разворачивает на весь экран
// и фиксирует горизонтальное положение.
export default function LandscapeGate() {
  const [portrait, setPortrait] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(PORTRAIT_PHONE);
    const update = () => {
      setPortrait(mq.matches);
      if (!mq.matches) setSkipped(false);
    };
    update();
    mq.addEventListener("change", update);

    return () => {
      mq.removeEventListener("change", update);
      try {
        (screen.orientation as Orientation | undefined)?.unlock?.();
      } catch {
        /* не поддерживается */
      }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const goLandscape = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* полноэкранный режим недоступен */
    }
    try {
      await (screen.orientation as Orientation | undefined)?.lock?.("landscape");
    } catch {
      /* браузер не умеет фиксировать ориентацию */
    }
  };

  if (!portrait || skipped) return null;

  return (
    <div className="lg-overlay" role="dialog" aria-modal="true" aria-label="Поверни телефон">
      <div className="lg-phone" aria-hidden="true">
        <span />
      </div>
      <h2>Поверни телефон</h2>
      <p>В горизонтальном режиме в игре больше места и удобнее управлять.</p>
      <div className="lg-btns">
        <button type="button" className="btn" onClick={goLandscape}>
          ⤢ На весь экран
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setSkipped(true)}>
          Играть так
        </button>
      </div>
      <p className="lg-note">Если экран не поворачивается, включи автоповорот в настройках телефона.</p>
    </div>
  );
}
