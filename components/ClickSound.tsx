"use client";

import { useEffect } from "react";
import { sfx } from "@/lib/audio";

// Один звук клика на все кнопки и ссылки сайта
export default function ClickSound() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("button, a");
      if (!el || (el as HTMLButtonElement).disabled) return;
      // у вариантов ответа свои звуки: верно / неверно
      if (el.classList.contains("opt")) return;
      sfx("click");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
