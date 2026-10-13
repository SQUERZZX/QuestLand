// Всё про серию: недельная полоска, рубежи, склонение, тексты.
// Даты не хранятся: серия считается подряд идущими днями, поэтому достаточно числа.

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

export type CellState = "done" | "pending" | "idle" | "future";

export type Cell = {
  label: string;
  state: CellState;
  today: boolean; // сегодняшний день недели
};

export function isMilestone(n: number): boolean {
  return MILESTONES.includes(n);
}

// Цвет пламени растёт вместе с серией: оранжевый, жаркий, синий, золотой
export function tierOf(n: number): 0 | 1 | 2 | 3 {
  if (n >= 100) return 3;
  if (n >= 30) return 2;
  if (n >= 7) return 1;
  return 0;
}

export function streakWord(n: number): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return "дней";
  if (b === 1) return "день";
  if (b >= 2 && b <= 4) return "дня";
  return "дней";
}

// Неделя с понедельника: прошлые дни закрашены, если входят в серию
export function weekCells(streak: number, todayDone: boolean, now = new Date()): Cell[] {
  const todayIdx = (now.getDay() + 6) % 7;
  return WEEKDAYS.map((label, i): Cell => {
    const offset = i - todayIdx;
    if (offset === 0) {
      return { label, today: true, state: todayDone ? "done" : "pending" };
    }
    if (offset > 0) return { label, today: false, state: "future" };
    const back = -offset;
    const inStreak = todayDone ? back <= streak - 1 : back <= streak;
    return { label, today: false, state: inStreak && streak > 0 ? "done" : "idle" };
  });
}

const MESSAGES: Record<number, string> = {
  1: "Огонь зажжён! Вернись завтра, чтобы он не погас.",
  2: "Два дня подряд. Так рождается привычка.",
  3: "Три дня! Огонь разгорается.",
  7: "Целая неделя без пропусков. Ты в ударе!",
  14: "Две недели подряд. Это уже характер.",
  30: "Месяц без пропусков. Легенда земель!",
  50: "Пятьдесят дней. Огонь не остановить.",
  100: "Сто дней! Ты Хранитель огня.",
  200: "Двести дней. Такое по силам единицам.",
  365: "Целый год. Просто невероятно!",
};

const GENERIC = [
  "Так держать, огонь только сильнее.",
  "Ещё один день в копилку.",
  "Серия растёт, не останавливайся.",
  "Каждый день делает тебя сильнее.",
];

export function streakMessage(n: number): string {
  return MESSAGES[n] ?? GENERIC[n % GENERIC.length];
}
