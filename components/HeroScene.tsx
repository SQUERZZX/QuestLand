// Анимированная сцена на первом экране: герой прыгает на холмике, вокруг летают кристаллы.
// Только CSS-анимации, поэтому компонент серверный и ничего не весит.

const STARS = [
  [8, 12], [22, 28], [38, 8], [55, 20], [70, 10], [88, 26], [92, 8], [14, 44], [80, 42], [48, 36],
];

export default function HeroScene() {
  return (
    <div className="scene-hero" aria-hidden="true">
      {STARS.map(([x, y], i) => (
        <span
          key={i}
          className="fx-star"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.5}s` }}
        />
      ))}

      <span className="fx-sun" />
      <span className="fx-cloud fx-cloud-a" />
      <span className="fx-cloud fx-cloud-b" />

      {/* Реплики героя сменяют друг друга */}
      <div className="fx-say fx-say-1">Привет! Я Странник 👋</div>
      <div className="fx-say fx-say-2">У меня три жизни ♥ ♥ ♥</div>
      <div className="fx-say fx-say-3">journey = путешествие. Запомнил?</div>

      <svg className="fx-art" viewBox="0 0 400 320" role="presentation">
        <defs>
          <linearGradient id="hs-grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7bd652" />
            <stop offset="1" stopColor="#2f7d32" />
          </linearGradient>
        </defs>

        {/* холм */}
        <ellipse cx="200" cy="300" rx="190" ry="46" fill="#1d2a52" />
        <path d="M20 300 Q200 190 380 300 Z" fill="url(#hs-grass)" />
        <path d="M20 300 Q200 190 380 300" fill="none" stroke="#a6f07a" strokeWidth="4" />

        {/* флажок цели */}
        <g className="fx-flag">
          <rect x="316" y="214" width="4" height="56" fill="#e8e2d0" />
          <path d="M320 216 L356 228 L320 240 Z" fill="#f4a300" />
        </g>

        {/* кристаллы на земле */}
        <path d="M92 262 l10 -22 l10 22 z" fill="#ff7be5" />
        <path d="M108 266 l7 -15 l7 15 z" fill="#ffd166" />

        {/* тень героя */}
        <ellipse className="fx-shadow" cx="200" cy="262" rx="30" ry="7" fill="#000" opacity="0.35" />

        {/* герой */}
        <g className="fx-hero">
          {/* шарф развевается */}
          <path className="fx-scarf" d="M176 176 q-26 -6 -40 10 q18 0 38 8 z" fill="#e5383b" />
          {/* ноги */}
          <rect x="186" y="224" width="12" height="26" rx="5" fill="#3b2f5c" />
          <rect x="204" y="224" width="12" height="26" rx="5" fill="#3b2f5c" />
          <rect x="183" y="244" width="17" height="9" rx="4" fill="#6b3f1d" />
          <rect x="202" y="244" width="17" height="9" rx="4" fill="#6b3f1d" />
          {/* тело */}
          <rect x="176" y="180" width="50" height="50" rx="16" fill="#f4a300" />
          <rect x="176" y="208" width="50" height="7" fill="#7a4b00" />
          {/* руки */}
          <rect className="fx-arm" x="222" y="188" width="10" height="30" rx="5" fill="#f4a300" />
          <rect x="170" y="188" width="10" height="30" rx="5" fill="#f4a300" />
          {/* голова */}
          <circle cx="201" cy="154" r="30" fill="#ffd9a8" />
          <path d="M171 150 a30 30 0 0 1 60 0 q-30 -16 -60 0z" fill="#5a3825" />
          {/* дорожная шляпа с пером */}
          <ellipse cx="201" cy="132" rx="38" ry="9" fill="#2b6cb0" />
          <path d="M181 132 q20 -34 40 0 z" fill="#3b82d6" />
          <path d="M218 126 q22 -20 28 -4 q-12 -2 -24 10 z" fill="#2dd4a0" />
          {/* лицо */}
          <circle cx="191" cy="156" r="4" fill="#0b1020" />
          <circle cx="211" cy="156" r="4" fill="#0b1020" />
          <circle cx="192.5" cy="154.5" r="1.4" fill="#fff" />
          <circle cx="212.5" cy="154.5" r="1.4" fill="#fff" />
          <path d="M193 168 q8 8 16 0" fill="none" stroke="#0b1020" strokeWidth="3" strokeLinecap="round" />
          <circle cx="182" cy="165" r="5" fill="#ff8aa0" opacity="0.5" />
          <circle cx="220" cy="165" r="5" fill="#ff8aa0" opacity="0.5" />
        </g>
      </svg>

      {/* парящие награды */}
      <span className="fx-gem fx-gem-a">◆</span>
      <span className="fx-gem fx-gem-b">◆</span>
      <span className="fx-gem fx-gem-c">✦</span>
      <span className="fx-coin">XP</span>
    </div>
  );
}
