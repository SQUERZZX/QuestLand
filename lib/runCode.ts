// Запуск JavaScript из терминала.
// Код выполняется в отдельном Web Worker: у него нет доступа к странице,
// а зависший или бесконечный цикл просто обрывается по таймауту.

export type RunKind = "log" | "info" | "warn" | "error" | "result";
export type RunLine = { kind: RunKind; text: string };

export const RUN_TIMEOUT_MS = 3000;

// Исходник воркера хранится строкой. Внутри нет обратных кавычек и ${}, чтобы не ломать эту строку.
const WORKER_SOURCE = `
var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
var pending = 0;

["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "indexedDB"].forEach(function (k) {
  try { self[k] = undefined; } catch (e) {}
});

function ins(v, d, seen) {
  if (typeof v === "string") return d ? "'" + v + "'" : v;
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "function") return "[Function" + (v.name ? ": " + v.name : " (anonymous)") + "]";
  if (typeof v === "bigint") return v + "n";
  if (typeof v === "symbol") return v.toString();
  if (typeof v !== "object") return String(v);
  if (v instanceof Error) return v.name + ": " + v.message;
  if (seen.indexOf(v) !== -1) return "[Circular]";
  if (d > 3) return Array.isArray(v) ? "[Array]" : "[Object]";
  seen.push(v);
  var r;
  if (Array.isArray(v)) {
    r = v.length ? "[ " + v.map(function (x) { return ins(x, d + 1, seen); }).join(", ") + " ]" : "[]";
  } else if (v instanceof Promise) {
    r = "Promise { <pending> }";
  } else if (v instanceof Map) {
    var m = [];
    v.forEach(function (val, key) { m.push(ins(key, d + 1, seen) + " => " + ins(val, d + 1, seen)); });
    r = "Map(" + v.size + ") { " + m.join(", ") + " }";
  } else if (v instanceof Set) {
    var s = [];
    v.forEach(function (val) { s.push(ins(val, d + 1, seen)); });
    r = "Set(" + v.size + ") { " + s.join(", ") + " }";
  } else {
    var ks = Object.keys(v);
    r = ks.length ? "{ " + ks.map(function (k) { return k + ": " + ins(v[k], d + 1, seen); }).join(", ") + " }" : "{}";
  }
  seen.pop();
  return r;
}

function line(kind, args) {
  var text = args.map(function (a) { return ins(a, 0, []); }).join(" ");
  self.postMessage({ t: "line", kind: kind, text: text });
}

var fakeConsole = {
  log: function () { line("log", [].slice.call(arguments)); },
  info: function () { line("info", [].slice.call(arguments)); },
  warn: function () { line("warn", [].slice.call(arguments)); },
  error: function () { line("error", [].slice.call(arguments)); },
};

var realSetTimeout = self.setTimeout.bind(self);
var realSetInterval = self.setInterval.bind(self);
var realClearInterval = self.clearInterval.bind(self);
var intervals = {};

self.setTimeout = function (fn, ms) {
  var args = [].slice.call(arguments, 2);
  pending++;
  return realSetTimeout(function () {
    try { fn.apply(null, args); }
    catch (e) { line("error", [e]); }
    finally { pending--; check(); }
  }, ms);
};
self.setInterval = function (fn, ms) {
  var args = [].slice.call(arguments, 2);
  pending++;
  var id = realSetInterval(function () {
    try { fn.apply(null, args); } catch (e) { line("error", [e]); }
  }, ms);
  intervals[id] = true;
  return id;
};
self.clearInterval = function (id) {
  if (intervals[id]) { delete intervals[id]; pending--; check(); }
  realClearInterval(id);
};

var mainDone = false;
function check() {
  if (mainDone && pending <= 0) self.postMessage({ t: "done" });
}

self.onmessage = function (ev) {
  var code = ev.data;
  var fn;
  var asExpression = false;
  try {
    fn = new AsyncFunction("console", "return (" + code + "\\n)");
    asExpression = true;
  } catch (e1) {
    try {
      fn = new AsyncFunction("console", code);
    } catch (e2) {
      var hint = e2.name === "SyntaxError" ? " (проверь скобки, кавычки и запятые)" : "";
      self.postMessage({ t: "line", kind: "error", text: e2.name + ": " + e2.message + hint });
      self.postMessage({ t: "done" });
      return;
    }
  }
  fn(fakeConsole).then(function (value) {
    if (asExpression && value !== undefined) {
      self.postMessage({ t: "line", kind: "result", text: ins(value, 1, []) });
    }
    mainDone = true;
    check();
  }, function (e) {
    var text = e && e.name ? e.name + ": " + e.message : String(e);
    self.postMessage({ t: "line", kind: "error", text: text });
    mainDone = true;
    check();
  });
};
`;

export function runCode(
  code: string,
  onLine: (line: RunLine) => void,
  timeoutMs = RUN_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve) => {
    let worker: Worker;
    let url = "";

    try {
      url = URL.createObjectURL(
        new Blob([WORKER_SOURCE], { type: "text/javascript" }),
      );
      worker = new Worker(url);
    } catch {
      onLine({ kind: "error", text: "Не удалось запустить код в этом браузере." });
      resolve();
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve();
    };

    const timer = setTimeout(() => {
      onLine({
        kind: "error",
        text: "Выполнение прервано: код работает слишком долго (возможно, бесконечный цикл).",
      });
      finish();
    }, timeoutMs);

    worker.onmessage = (ev: MessageEvent) => {
      const data = ev.data as { t: string; kind?: RunKind; text?: string };
      if (data.t === "line" && data.kind) {
        onLine({ kind: data.kind, text: data.text ?? "" });
      } else if (data.t === "done") {
        finish();
      }
    };

    worker.onerror = (ev: ErrorEvent) => {
      onLine({ kind: "error", text: ev.message || "Ошибка выполнения." });
      finish();
    };

    worker.postMessage(code);
  });
}
