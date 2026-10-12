// Звук без файлов: эффекты через Web Audio, голоса и произношение через речевой синтез браузера.

const KEY = "questlands-audio";

export type AudioSettings = { sfx: boolean; voice: boolean };
export type VoiceProfile = {
  pitch: number; // высота голоса 0.5–1.8
  rate: number; // скорость речи
  pick: number; // какой из доступных голосов брать
  blip: number; // частота «болтовни» при печати текста
};

let settings: AudioSettings | null = null;

export function getAudio(): AudioSettings {
  if (settings) return settings;
  settings = { sfx: true, voice: true };
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
  if (!settings.voice) stopSpeech();
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

export type Sfx = "jump" | "land" | "gem" | "hurt" | "right" | "wrong" | "click" | "win" | "blip";

export function sfx(name: Sfx, pitch = 300) {
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
    case "win":
      [523, 659, 784, 1046].forEach((f, i) => tone(c, t + i * 0.12, f, 0.28, "triangle", 0.1));
      break;
    case "blip":
      tone(c, t, pitch, 0.035, "square", 0.025);
      break;
  }
}

/* ---------- Голоса ---------- */

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

export function hasSpeech(): boolean {
  return synth() !== null;
}

// Голос включён и браузер умеет говорить
export function voiceActive(): boolean {
  return getAudio().voice && hasSpeech();
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const NARRATOR_VOICE: VoiceProfile = { pitch: 0.85, rate: 0.95, pick: 0, blip: 190 };

// У каждого жителя свой голос: считается из имени и внешности
export function voiceProfile(
  name: string,
  look: { build: string; beard: boolean; hat: string },
): VoiceProfile {
  const h = hash(name);
  const words = name.trim().split(/\s+/);
  const fem = [words[0], words[words.length - 1]].some((w) => /[аяАЯ]$/.test(w));
  let pitch = 1;
  if (fem) pitch += 0.35;
  if (look.build === "slim") pitch += 0.15;
  if (look.build === "stout") pitch -= 0.25;
  if (look.beard) pitch -= 0.2;
  if (look.hat === "helm") pitch -= 0.15;
  pitch = clamp(pitch + ((h % 21) - 10) / 100, 0.5, 1.8);
  const rate = clamp((look.beard ? 0.85 : 0.95) + ((h >> 5) % 11) / 100, 0.8, 1.1);
  return { pitch, rate, pick: h % 7, blip: Math.round(180 + pitch * 170) };
}

function pickVoice(lang: string, n: number): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const all = s.getVoices();
  const exact = all.filter((v) => v.lang.toLowerCase().replace("_", "-") === lang.toLowerCase());
  const loose = all.filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  const pool = exact.length > 0 ? exact : loose;
  return pool.length > 0 ? pool[n % pool.length] : null;
}

// Режем текст на русские и английские куски, чтобы каждый читал свой голос
function parts(text: string): { text: string; lang: string }[] {
  const out: { text: string; lang: string }[] = [];
  const push = (t: string, lang: string) => {
    if (/[\p{L}\d]/u.test(t)) out.push({ text: t.trim(), lang });
  };
  let last = 0;
  for (const m of text.matchAll(/[A-Za-z][A-Za-z0-9'’,.!?\- ]*/g)) {
    const at = m.index ?? 0;
    push(text.slice(last, at), "ru-RU");
    push(m[0], "en-US");
    last = at + m[0].length;
  }
  push(text.slice(last), "ru-RU");
  return out;
}

export function stopSpeech() {
  synth()?.cancel();
}

function say(text: string, p: VoiceProfile) {
  const s = synth();
  if (!s) return;
  s.cancel();
  for (const part of parts(text)) {
    const u = new SpeechSynthesisUtterance(part.text);
    u.lang = part.lang;
    const v = pickVoice(part.lang, p.pick);
    if (v) u.voice = v;
    u.pitch = p.pitch;
    u.rate = p.rate;
    s.speak(u);
  }
}

// Реплика жителя. force=true, если игрок сам нажал «повторить»
export function speak(text: string, profile: VoiceProfile = NARRATOR_VOICE, force = false) {
  if (!hasSpeech()) return;
  if (!force && !getAudio().voice) return;
  say(text, profile);
}

// Произношение слова: всегда по нажатию, голос обычный, чуть медленнее
export function speakWord(word: string) {
  const s = synth();
  if (!s) return;
  s.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  const v = pickVoice("en-US", 0);
  if (v) u.voice = v;
  u.rate = 0.85;
  s.speak(u);
}
