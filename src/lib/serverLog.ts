// Utilidad de logging en servidor con control por entorno
const DEBUG =
  process.env.NODE_ENV !== "production" || process.env.LOG_LEVEL === "debug";

function ts() {
  return new Date().toISOString();
}

function toSimple(obj: unknown) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

export function logDebug(msg: string, meta?: unknown) {
  if (!DEBUG) return;
  if (typeof meta === "undefined") console.log(`[DEBUG ${ts()}] ${msg}`);
  else console.log(`[DEBUG ${ts()}] ${msg}`, toSimple(meta));
}

export function logInfo(msg: string, meta?: unknown) {
  if (typeof meta === "undefined") console.info(`[INFO  ${ts()}] ${msg}`);
  else console.info(`[INFO  ${ts()}] ${msg}`, toSimple(meta));
}

export function logWarn(msg: string, meta?: unknown) {
  if (typeof meta === "undefined") console.warn(`[WARN  ${ts()}] ${msg}`);
  else console.warn(`[WARN  ${ts()}] ${msg}`, toSimple(meta));
}

export function logError(msg: string, meta?: unknown) {
  if (typeof meta === "undefined") console.error(`[ERROR ${ts()}] ${msg}`);
  else console.error(`[ERROR ${ts()}] ${msg}`, toSimple(meta));
}
