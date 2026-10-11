import WorldMap from "@/components/WorldMap";
import { RANKS } from "@/lib/lands";
import Link from "next/link";

export default function Home() {
  return (
    <main className="wrap">
      <header className="top">
        <span className="logo">QuestLands</span>
        <button type="button" className="btn btn-ghost">
          Войти
        </button>
      </header>

      <section className="hero">
        <h1>Учись как в приключении. Пропустил день — потерял жизнь.</h1>
        <p className="lead">
          Английский, программирование, математика или привычки. Выбери землю,
          проходи квесты каждый день и открывай карту дальше.
        </p>
       <Link href="/dashboard" className="btn">
  Начать путь
</Link>
      </section>

      <WorldMap />

      <section className="rules">
        <article className="rule rule-life">
          <h3>Жизни</h3>
          <p>
            У героя три жизни:{" "}
            <span className="hearts" aria-label="3 жизни">
              ♥ ♥ ♥
            </span>
            . Каждый пропущенный день отнимает одну. Закончились — серия
            обнуляется.
          </p>
        </article>

        <article className="rule rule-xp">
          <h3>Опыт</h3>
          <p>
            Каждый квест даёт XP. Серия дней подряд увеличивает награду, а
            пропуск сбрасывает её.
          </p>
        </article>

        <article className="rule rule-rank">
          <h3>Ранги</h3>
          <ul className="ranks">
            {RANKS.map((r) => (
              <li key={r.name}>
                <span>{r.name}</span>
                <span className="dim">{r.xp} XP</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <footer className="foot dim">QuestLands</footer>
    </main>
  );
}