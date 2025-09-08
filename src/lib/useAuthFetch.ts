"use client";
import { useSession } from "next-auth/react";
import { authFetch, HttpOptions } from "./http";

export function useAuthFetch() {
  const { data: session } = useSession();
  const token = session?.accessToken || null;

  async function fetchWithAuth(path: string, opts: HttpOptions = {}) {
    return authFetch(path, { ...opts, authToken: opts.authToken ?? token });
  }

  // SWR-friendly fetcher: supports (url: string) or (url: string, { signal })
  const swrFetcher = async (url: string, init?: RequestInit) => {
    const headers = (init?.headers || {}) as Record<string, string>;
    const method = init?.method;
    // body no se usa en GET de SWR, pero respetamos si viene
    const body =
      init && "body" in init ? (init as { body?: unknown }).body : undefined;
    const signal = init?.signal as AbortSignal | undefined;
    const res = await authFetch(url, {
      headers,
      body,
      method,
      authToken: token,
      signal,
    });
    return res.json();
  };

  return { authToken: token, authFetch: fetchWithAuth, swrFetcher } as const;
}
