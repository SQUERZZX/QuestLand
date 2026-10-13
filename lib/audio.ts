// Звуковые эффекты без файлов: всё генерируется через Web Audio.

const KEY = "questlands-audio";

export type AudioSettings = { sfx: boolean };

let settings: AudioSettings | null = null;

export function getAudio(): AudioSettings {
  if (settings) return settings;
  settings = { sfx: true };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) settings = { ...settings, ...(JSON.parse(raw) as Partial<AudioSettings>) };
  } catch {
    /* хранилище недоступно */
  }
  return settings;
}

export function setAudio(patch: Partial<AudioSettings>): AudioSettings {
  settings = { ...getAudio(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* хранилище недоступно */
  }
  return settings;
}

/* ---------- Звуковые эффекты ---------- */

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const C = window.AudioContext ?? w.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  c: AudioContext,
  at: number,
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  freqEnd?: number,
) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.03);
}

export type Sfx = "jump" | "land" | "gem" | "hurt" | "right" | "wrong" | "click" | "win" | "lose" | "load" | "start" | "streak" | "tick" | "fanfare";

export function sfx(name: Sfx) {
  if (!getAudio().sfx) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  switch (name) {
    case "jump":
      tone(c, t, 320, 0.14, "square", 0.05, 720);
      break;
    case "land":
      tone(c, t, 150, 0.1, "sine", 0.12, 60);
      break;
    case "gem":
      tone(c, t, 880, 0.1, "triangle", 0.09);
      tone(c, t + 0.08, 1320, 0.16, "triangle", 0.09);
      break;
    case "hurt":
      tone(c, t, 320, 0.3, "sawtooth", 0.07, 70);
      break;
    case "right":
      [523, 659, 784].forEach((f, i) => tone(c, t + i * 0.09, f, 0.18, "triangle", 0.1));
      break;
    case "wrong":
      tone(c, t, 240, 0.28, "square", 0.06, 150);
      break;
    case "click":
      tone(c, t, 600, 0.05, "square", 0.04);
      break;
    case "lose":
      [392, 330, 262].forEach((f, i) => tone(c, t + i * 0.14, f, 0.3, "triangle", 0.09));
      break;
    case "load":
      tone(c, t, 180, 0.9, "sine", 0.05, 720);
      tone(c, t + 0.15, 270, 0.9, "triangle", 0.03, 1080);
      break;
    case "start":
      [392, 523, 659].forEach((f, i) => tone(c, t + i * 0.08, f, 0.22, "triangle", 0.07));
      break;
    case "streak":
      tone(c, t, 220, 0.9, "sawtooth", 0.04, 660);
      tone(c, t + 0.1, 330, 0.9, "triangle", 0.05, 990);
      break;
    case "tick":
      tone(c, t, 1200, 0.06, "square", 0.05);
      tone(c, t + 0.06, 1600, 0.12, "triangle", 0.08);
      break;
    case "fanfare":
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(c, t + i * 0.1, f, 0.3, "triangle", 0.1));
      break;
    case "win":
      [523, 659, 784, 1046].forEach((f, i) => tone(c, t + i * 0.12, f, 0.28, "triangle", 0.1));
      break;
  }
}

/* ---------- Произношение слов ---------- */

// Кнопки 🔊 в карточке слова и в словаре остались, но голос отключён.
// Чтобы вернуть звук позже (например, проигрывать записанные файлы),
// достаточно дописать воспроизведение здесь: кнопки вызывают только эту функцию.
export function speakWord(word: string) {
  void word;
}
