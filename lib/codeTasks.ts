// Задания с кодом: житель просит что-то написать, игрок пишет код в терминале.
// Проверка идёт по тому, что код вывел через console.log, плюс (по желанию) по тексту кода.

import { runCode } from "@/lib/runCode";

export type CodeTask = {
  prompt: string; // что просит сделать житель
  starter: string; // заготовка в терминале
  expected: string[]; // какие строки должен вывести код, по порядку
  mustMatch?: string; // регулярное выражение, которое должно встретиться в самом коде
  mustMatchMsg?: string; // что сказать, если его не нашли
  hint: string; // подсказка после неудачи
  success: string; // что сказать после успеха
};

export type CheckResult =
  | { ok: true; output: string[] }
  | { ok: false; output: string[]; reason: string };

export async function checkTask(
  task: CodeTask,
  code: string,
): Promise<CheckResult> {
  const output: string[] = [];
  const state: { error: string | null } = { error: null };

  await runCode(code, (line) => {
    if (line.kind === "error") state.error = state.error ?? line.text;
    else output.push(line.text);
  });

  if (state.error) {
    return { ok: false, output, reason: `Ошибка в коде: ${state.error}` };
  }

  if (task.mustMatch && !new RegExp(task.mustMatch).test(code)) {
    return {
      ok: false,
      output,
      reason: task.mustMatchMsg ?? "Код выводит не то, чего ждёт житель.",
    };
  }

  const same =
    output.length === task.expected.length &&
    output.every((l, i) => l.trim() === task.expected[i]);

  if (!same) {
    return {
      ok: false,
      output,
      reason:
        output.length === 0
          ? "Код ничего не вывел. Не забудь console.log()."
          : `Нужно вывести: ${task.expected.join(" / ")}. Твой код вывел: ${output.join(" / ")}.`,
    };
  }

  return { ok: true, output };
}

// id главы -> задания жителей по порядку. Пока заполнены первые две главы Леса кода.
export const CODE_TASKS: Record<string, (CodeTask | undefined)[]> = {
  "code-a0-1": [
    {
      prompt: "Выведи на экран слово Привет.",
      starter: "// напиши команду ниже\n",
      expected: ["Привет"],
      hint: 'Текст берут в кавычки: console.log("...")',
      success: "Экран снова говорит. Спасибо!",
    },
    {
      prompt: "Выведи слово Hello. Не забудь про кавычки.",
      starter: "",
      expected: ["Hello"],
      hint: 'Без кавычек Hello считается именем переменной. Нужно console.log("Hello").',
      success: "Теперь моя программа здоровается. Спасибо!",
    },
    {
      prompt: "У меня 12 поленьев и ещё 8. Выведи, сколько всего. Посчитай в коде, а не в голове.",
      starter: "console.log()",
      expected: ["20"],
      mustMatch: "\\d+\\s*\\+\\s*\\d+",
      mustMatchMsg: "Пусть считает компьютер: напиши сложение, например 12 + 8.",
      hint: "Внутри скобок можно писать выражение: console.log(1 + 2).",
      success: "Дров хватит на зиму. Спасибо!",
    },
    {
      prompt: "Выведи две строки подряд: сначала a, потом b.",
      starter: "",
      expected: ["a", "b"],
      hint: "Каждый console.log печатает отдельную строку. Нужно два вызова.",
      success: "Теперь я знаю, как печатать по строкам. Спасибо!",
    },
    {
      prompt: "Напиши в одной строке две команды через точку с запятой: выведи A и выведи B.",
      starter: "",
      expected: ["A", "B"],
      mustMatch: ";",
      mustMatchMsg: "Разделяй команды точкой с запятой.",
      hint: 'Пример: console.log("1"); console.log("2");',
      success: "Теперь я знаю, зачем она нужна. Спасибо!",
    },
    {
      prompt: "Оставь в коде комментарий (начни его с //), а потом выведи слово OK.",
      starter: "",
      expected: ["OK"],
      mustMatch: "//",
      mustMatchMsg: "Не вижу комментария. Он начинается с //.",
      hint: '// это заметка\nconsole.log("OK")',
      success: "Терминал зажёгся! Спасибо, Странник.",
    },
    {
      prompt: "Склей слова «до» и «мой» и выведи получившееся слово.",
      starter: "",
      expected: ["домой"],
      mustMatch: "\\+",
      mustMatchMsg: "Склеивай строки плюсом.",
      hint: 'console.log("до" + "мой")',
      success: "Слова склеились! Спасибо!",
    },
    {
      prompt: "Выведи число 42. Кавычки не нужны.",
      starter: "",
      expected: ["42"],
      hint: "console.log(42)",
      success: "Теперь я знаю, как печатать числа. Спасибо!",
    },
  ],
  "code-a0-2": [
    {
      prompt: "Выведи остаток от деления 10 на 3.",
      starter: "",
      expected: ["1"],
      mustMatch: "%",
      mustMatchMsg: "Остаток считает оператор %.",
      hint: "console.log(10 % 3)",
      success: "Остаток найден. Спасибо!",
    },
    {
      prompt: "Раздели 7 яблок на двоих и выведи результат.",
      starter: "",
      expected: ["3.5"],
      mustMatch: "/",
      mustMatchMsg: "Деление записывается как /.",
      hint: "console.log(7 / 2)",
      success: "Теперь поделю честно. Спасибо!",
    },
    {
      prompt: "Выведи два в третьей степени.",
      starter: "",
      expected: ["8"],
      mustMatch: "\\*\\*",
      mustMatchMsg: "Степень записывается как **.",
      hint: "console.log(2 ** 3)",
      success: "Теперь я знаю степени. Спасибо!",
    },
    {
      prompt: "Выведи результат выражения: 2 плюс 3, умноженное на 4.",
      starter: "",
      expected: ["14"],
      mustMatch: "\\*",
      mustMatchMsg: "Напиши выражение с умножением: 2 + 3 * 4.",
      hint: "Умножение выполняется раньше сложения.",
      success: "Всё встало на места. Спасибо!",
    },
    {
      prompt: "Заведи let count = 5, увеличь её на единицу через ++ и выведи.",
      starter: "let count = 5;\n",
      expected: ["6"],
      mustMatch: "\\+\\+",
      mustMatchMsg: "Используй count++.",
      hint: "count++;\nconsole.log(count);",
      success: "Теперь счёт ведётся честно. Спасибо!",
    },
    {
      prompt: "Выведи 4.9, округлённое вниз до целого.",
      starter: "",
      expected: ["4"],
      mustMatch: "Math\\.floor",
      mustMatchMsg: "Округлять вниз умеет Math.floor().",
      hint: "console.log(Math.floor(4.9))",
      success: "Счёты щёлкают! Спасибо, Странник.",
    },
    {
      prompt: "Выведи результат выражения 10 минус 4 умножить на 2.",
      starter: "",
      expected: ["2"],
      mustMatch: "\\*",
      mustMatchMsg: "Запиши выражение с умножением: 10 - 4 * 2.",
      hint: "console.log(10 - 4 * 2)",
      success: "Булки посчитаны. Спасибо!",
    },
  ],
};
