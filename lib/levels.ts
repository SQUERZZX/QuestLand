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