export type HttpOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  authToken?: string | null;
  signal?: AbortSignal;
};

const configuredBase = process.env.NEXT_PUBLIC_API_BASE || "";

function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;
  // Si existe base configurada pero no coincide con el origen actual, usar relativo para enviar cookies
  if (typeof window !== "undefined" && configuredBase) {
    try {
      const b = new URL(configuredBase);
      if (b.origin !== window.location.origin) return path;
    } catch {
      return path;
    }
  }
  return `${configuredBase}${path}`;
}

export async function authFetch(path: string, opts: HttpOptions = {}) {
  const url = resolveUrl(path);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (opts.authToken) headers["Authorization"] = `Bearer ${opts.authToken}`;
  const res = await fetch(url, {
    method: opts.method || (opts.body ? "POST" : "GET"),
    headers,
    body: opts.body
      ? JSON.stringify(opts.body as Record<string, unknown>)
      : undefined,
    credentials: "same-origin",
    signal: opts.signal,
  });
  // Mensaje claro para gateway timeout
  if (res.status === 504) {
    throw new Error(
      "El servidor tardó demasiado en responder (504). Intenta de nuevo."
    );
  }
  if (res.status === 401) {
    // opcionalmente: redirigir o limpiar sesión
    if (typeof window !== "undefined") {
      if (process.env.NODE_ENV === "development")
        console.warn("401 no autorizado");
    }
  }
  return res;
}

export function getBaseUrl() {
  return configuredBase;
}

export async function json<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // devolver texto crudo cuando no es JSON
    return text as unknown as T;
  }
}
