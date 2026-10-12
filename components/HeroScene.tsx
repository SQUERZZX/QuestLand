// Сцена первого экрана: горы в сумерках и путник с фонарём.
// Только SVG и медленные CSS-анимации, поэтому компонент серверный и почти ничего не весит.

const STARS: [number, number, number][] = [
  [40, 40, 1.2], [96, 78, 1], [150, 28, 1.4], [212, 62, 1], [268, 30, 1.2], [330, 56, 1],
  [452, 40, 1.3], [484, 96, 1], [64, 130, 1], [196, 118, 1.1], [420, 130, 1], [300, 110, 0.9],
];

export default function HeroScene() {
  return (
    <div className="scene-hero" aria-hidden="true">
      <svg className="fx-art" viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#070b1d" />
            <stop offset="0.55" stopColor="#161c45" />
            <stop offset="0.85" stopColor="#3b2b52" />
            <stop offset="1" stopColor="#8a5a48" />
          </linearGradient>
          <radialGradient id="hs-moon" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#f6efd8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#f6efd8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hs-lamp" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffc86b" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffc86b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hs-fog" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#9fb0e6" stopOpacity="0" />
            <stop offset="0.5" stopColor="#9fb0e6" stopOpacity="0.16" />
            <stop offset="1" stopColor="#9fb0e6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="500" height="400" fill="url(#hs-sky)" />

        {STARS.map(([x, y, r], i) => (
          <circle
            key={i}
            className="fx-star"
            cx={x}
            cy={y}
            r={r}
            fill="#e9edff"
            style={{ animationDelay: `${(i % 6) * 0.9}s` }}
          />
        ))}

        {/* луна */}
        <circle cx="388" cy="92" r="70" fill="url(#hs-moon)" />
        <circle cx="388" cy="92" r="22" fill="#f1ead6" />
        <circle cx="397" cy="86" r="20" fill="#161c45" opacity="0.18" />

        {/* дальние хребты */}
        <path
          d="M0 250 L60 212 L112 242 L172 188 L240 236 L302 198 L372 246 L432 208 L500 242 V400 H0Z"
          fill="#1c2352"
        />
        <rect className="fx-fog fx-fog-a" x="-200" y="228" width="500" height="34" fill="url(#hs-fog)" />

        {/* средние хребты */}
        <path
          d="M0 296 L84 252 L146 284 L224 236 L304 288 L384 256 L462 294 L500 278 V400 H0Z"
          fill="#131a42"
        />
        <rect className="fx-fog fx-fog-b" x="-300" y="276" width="560" height="38" fill="url(#hs-fog)" />

        {/* ближний склон */}
        <path
          d="M0 352 C 80 332, 140 338, 204 326 S 282 302, 316 304 S 404 332, 500 322 V400 H0Z"
          fill="#0a0f2c"
        />

        {/* сосны слева */}
        <g fill="#060a1e">
          <path d="M22 360 l22 -70 l22 70z" />
          <path d="M44 360 l18 -52 l18 52z" />
          <path d="M80 362 l16 -44 l16 44z" />
        </g>

        {/* путник */}
        <g fill="#04061a">
          <circle cx="304" cy="262" r="6.5" />
          <path d="M295 270 Q304 265 313 270 L320 305 L288 305 Z" />
          <path className="fx-scarf" d="M299 268 q-14 3 -22 12 q10 -2 22 -3 z" />
          <rect x="322" y="254" width="2.6" height="52" rx="1.3" />
          <path d="M292 280 L284 290" stroke="#04061a" strokeWidth="3" strokeLinecap="round" />
        </g>
        {/* фонарь */}
        <circle className="fx-lamp" cx="282" cy="294" r="42" fill="url(#hs-lamp)" />
        <rect x="278.5" y="289" width="7" height="10" rx="1.5" fill="#ffd488" />
      </svg>

      <div className="scene-card">
        <span className="scene-card-label">Первый квест</span>
        <span className="scene-card-title">Туман над деревней Эхо</span>
        <span className="scene-card-meta">Глава 1 · A0 · +60 XP</span>
      </div>
    </div>
  );
}
