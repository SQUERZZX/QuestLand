export type Quest = { title: string; xp: number };

export type Land = {
  id: string;
  name: string;
  tagline: string;
  color: string;
  x: number; // 0-100
  y: number; // 0-70
  quests: Quest[];
};

export const LANDS: Land[] = [
  {
    id: "english",
    name: "Земли английского",
    tagline: "Слова, фразы и живая речь",
    color: "var(--sky)",
    x: 12,
    y: 50,
    quests: [
            { title: "Глава 1: Туман над деревней Эхо", xp: 60 },
      { title: "Повтори вчерашние слова", xp: 15 },
      { title: "Напиши 3 предложения", xp: 30 },
    ],
  },
  {
    id: "code",
    name: "Лес кода",
    tagline: "Программирование шаг за шагом",
    color: "var(--ok)",
    x: 36,
    y: 20,
    quests: [
      { title: "Реши одну задачу", xp: 40 },
      { title: "Прочитай чужой код", xp: 20 },
      { title: "Допиши свой мини-проект", xp: 50 },
    ],
  },
  {
    id: "math",
    name: "Горы математики",
    tagline: "Логика, числа и задачи",
    color: "var(--magic)",
    x: 62,
    y: 52,
    quests: [
      { title: "5 задач на разминку", xp: 25 },
      { title: "Разбери одну сложную тему", xp: 45 },
    ],
  },
  {
    id: "habits",
    name: "Долина привычек",
    tagline: "Спорт, чтение, ранний подъём",
    color: "var(--fire)",
    x: 86,
    y: 18,
    quests: [
      { title: "Подъём до 7:00", xp: 20 },
      { title: "20 минут чтения", xp: 20 },
      { title: "Тренировка", xp: 35 },
    ],
  },
];

export const RANKS = [
  { name: "Странник", xp: 0 },
  { name: "Следопыт", xp: 500 },
  { name: "Покоритель земель", xp: 2000 },
  { name: "Хранитель карты", xp: 6000 },
];