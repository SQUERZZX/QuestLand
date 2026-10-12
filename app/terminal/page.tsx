import Link from "next/link";
import Terminal from "@/components/Terminal";

export const metadata = { title: "Терминал — QuestLands" };

export default function TerminalPage() {
  return (
    <main className="wrap">
      <header className="top">
        <Link href="/" className="logo">
          QuestLands
        </Link>
        <Link href="/dashboard" className="dim">
          ← К герою
        </Link>
      </header>

      <h1 className="term-h1">Терминал</h1>
      <p className="dim term-lead">
        Пиши и запускай JavaScript прямо здесь. Код выполняется у тебя в
        браузере, а бесконечный цикл остановится сам через три секунды.
      </p>

      <Terminal />
    </main>
  );
}
