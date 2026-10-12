export type LevelId = "a0" | "a1" | "a2" | "b1";

export type Level = {
  id: LevelId;
  code: string;
  title: string;
  desc: string;
};

export const LEVELS: Level[] = [
  { id: "a0", code: "A0", title: "Первые шаги", desc: "Приветствия, простые слова, глагол to be" },
  { id: "a1", code: "A1", title: "Новичок", desc: "Числа, покупки, повседневные фразы" },
  { id: "a2", code: "A2", title: "Путешественник", desc: "Прошедшее время, планы, сравнения" },
  { id: "b1", code: "B1", title: "Самостоятельный", desc: "Условия, пассив, Present Perfect" },
];

// Те же четыре ступени (id a0..b1), но для земли программирования
export const CODE_LEVELS: Level[] = [
  { id: "a0", code: "C0", title: "Первые строки", desc: "console.log, числа, строки, комментарии" },
  { id: "a1", code: "C1", title: "Данные и условия", desc: "Переменные, типы, if/else, логика" },
  { id: "a2", code: "C2", title: "Циклы и функции", desc: "Циклы, массивы, функции, область видимости" },
  { id: "b1", code: "C3", title: "Объекты и асинхронность", desc: "Объекты, map/filter, Promise, JSON" },
];

export const LEVEL_SETS: Record<string, { pathTitle: string; levels: Level[] }> = {
  english: { pathTitle: "Путь английского", levels: LEVELS },
  code: { pathTitle: "Путь кода", levels: CODE_LEVELS },
};

export function levelsOf(landId: string): Level[] {
  return LEVEL_SETS[landId]?.levels ?? [];
}
