/**
 * Typed fetch wrapper for the DASHBOARD AI backend.
 * In dev, `/api` is proxied to the backend by Vite; in production the
 * backend serves the frontend, so relative URLs work. Set VITE_API_URL
 * to point at a backend on another origin.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const TOKEN_KEY = "dashboard-ai:token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; message?: string; status: number };

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    return { ok: false, error: "NETWORK", message: "Couldn't reach the server.", status: 0 };
  }
  let payload: { ok?: boolean; data?: T; error?: string; message?: string } = {};
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    return { ok: false, error: "BAD_RESPONSE", status: res.status };
  }
  if (payload.ok) return { ok: true, data: payload.data as T, status: res.status };
  return {
    ok: false,
    error: payload.error ?? "REQUEST_FAILED",
    message: payload.message,
    status: res.status,
  };
}
