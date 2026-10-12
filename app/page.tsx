import HeroScene from "@/components/HeroScene";
import WorldMap from "@/components/WorldMap";
import { CHAPTERS } from "@/lib/chapters";
import { LANDS, RANKS } from "@/lib/lands";
import Link from "next/link";

export default function Home() {
  const chapters = Object.keys(CHAPTERS).length;

  return (
    <main className="wrap">
      <header className="top">
        <span className="logo">QuestLands</span>
        <button type="button" className="btn btn-ghost">
          Войти
        </button>
      </header>

      <section className="hero-wrap">
        <div className="hero">
          <span className="hero-tag">Ежедневное обучение</span>
          <h1>
            Учись как в <em>приключении</em>. Пропустил день — потерял жизнь.
          </h1>
          <p className="lead">
            Английский, программирование, математика или привычки. Выбери землю,
            проходи квесты каждый день и открывай карту дальше.
          </p>
          <div className="hero-cta">
            <Link href="/dashboard" className="btn btn-big">
              Начать путь →
            </Link>
            <a href="#how" className="btn btn-ghost btn-big-ghost">
              Как это работает
            </a>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>Глав</dt>
              <dd>{chapters}</dd>
            </div>
            <div>
              <dt>Уровни</dt>
              <dd>A0–B1</dd>
            </div>
            <div>
              <dt>Земель</dt>
              <dd>{LANDS.length}</dd>
            </div>
          </dl>
        </div>
        <HeroScene />
      </section>

      <WorldMap />

      <section className="rules" id="how">
        <article className="rule rule-life">
          <span className="rule-num">01</span>
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
          <span className="rule-num">02</span>
          <h3>Опыт</h3>
          <p>
            Каждый квест даёт XP. Серия дней подряд увеличивает награду, а
            пропуск сбрасывает её.
          </p>
        </article>

        <article className="rule rule-rank">
          <span className="rule-num">03</span>
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
