import HeroScene from "@/components/HeroScene";
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

      <section className="hero-wrap">
        <div className="hero">
          <span className="hero-tag">🎮 Учёба как игра</span>
          <h1>
            Учись как в <span className="grad">приключении</span>. Пропустил день — потерял{" "}
            <span className="hero-heart">♥</span>
          </h1>
          <p className="lead">
            Английский, программирование, математика или привычки. Выбери землю,
            проходи квесты каждый день и открывай карту дальше.
          </p>
          <div className="hero-cta">
            <Link href="/dashboard" className="btn btn-big">
              ▶ Начать путь
            </Link>
            <a href="#how" className="btn btn-ghost">
              Как это работает
            </a>
          </div>
          <ul className="chips">
            <li>🔥 Серия дней</li>
            <li>💎 Кристаллы речи</li>
            <li>🗣 Слова с озвучкой</li>
            <li>⌨ Код в терминале</li>
          </ul>
        </div>
        <HeroScene />
      </section>

      <WorldMap />

      <section className="rules" id="how">
        <article className="rule rule-life">
          <span className="rule-ico">❤️</span>
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
          <span className="rule-ico">⭐</span>
          <h3>Опыт</h3>
          <p>
            Каждый квест даёт XP. Серия дней подряд увеличивает награду, а
            пропуск сбрасывает её.
          </p>
        </article>

        <article className="rule rule-rank">
          <span className="rule-ico">🏆</span>
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

      <footer className="foot dim">QuestLands · учись, играя ✨</footer>
    </main>
  );
}