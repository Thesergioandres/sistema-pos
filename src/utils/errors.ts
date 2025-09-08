export function parseError(e: unknown, fallback = "Error inesperado") {
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return fallback;
  }
}

export const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") console.error(...args);
  },
};
