import { useSyncExternalStore } from "react";
import { api, isAuthenticated } from "./api";
import { differentiateDashboard, type Dashboard } from "./dashboard";

/**
 * Dashboards live in a local cache (instant UI, works offline) and, when
 * signed in, sync to the backend API so they follow the user across devices.
 */
const KEY = "dashboard-ai:projects";
const listeners = new Set<() => void>();
let cache: Dashboard[] | null = null;
const EMPTY: Dashboard[] = [];

function read(): Dashboard[] {
  if (typeof window === "undefined") return EMPTY;
  if (!cache) {
    try {
      cache = (JSON.parse(localStorage.getItem(KEY) || "[]") as Dashboard[]).map(
        differentiateDashboard,
      );
    } catch {
      cache = [];
    }
  }
  return cache ?? EMPTY;
}

function write(list: Dashboard[]) {
  cache = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full or unavailable — keep the in-memory cache.
  }
  listeners.forEach((l) => l());
}

const pending = new Map<string, ReturnType<typeof setTimeout>>();

function pushRemote(d: Dashboard) {
  if (!isAuthenticated()) return;
  clearTimeout(pending.get(d.id));
  pending.set(
    d.id,
    setTimeout(async () => {
      const res = await api(`/api/dashboards/${encodeURIComponent(d.id)}`, {
        method: "PUT",
        body: d,
      });
      if (!res.ok && res.status !== 401) console.error("Cloud save failed", res.error);
    }, 600),
  );
}

/** Pulls the server list and merges it with device-local dashboards. */
export async function syncFromCloud() {
  if (!isAuthenticated()) return;
  const res = await api<Dashboard[]>("/api/dashboards");
  if (!res.ok) return;
  const remote = res.data.map(differentiateDashboard);
  const ids = new Set(remote.map((d) => d.id));
  const localOnly = read().filter((d) => !ids.has(d.id));
  localOnly.forEach(pushRemote); // claim dashboards made before signing in
  write([...localOnly, ...remote].sort((a, b) => b.updatedAt - a.updatedAt));
}

export const projects = {
  all: read,
  get: (id: string) => read().find((d) => d.id === id),
  save(d: Dashboard) {
    const next = { ...d, updatedAt: Date.now() };
    write([next, ...read().filter((x) => x.id !== d.id)]);
    pushRemote(next);
  },
  async remove(id: string) {
    write(read().filter((x) => x.id !== id));
    if (isAuthenticated()) {
      await api(`/api/dashboards/${encodeURIComponent(id)}`, { method: "DELETE" });
    }
  },
  /**
   * Loads a dashboard from the device cache, from the account, or — for
   * published dashboards — from the public share endpoint (no sign-in needed).
   */
  async fetch(id: string): Promise<Dashboard | null> {
    const local = read().find((d) => d.id === id);
    if (local) return local;
    if (isAuthenticated()) {
      const res = await api<Dashboard>(`/api/dashboards/${encodeURIComponent(id)}`);
      if (res.ok) return differentiateDashboard(res.data);
    }
    const shared = await api<Dashboard>(`/api/dashboards/shared/${encodeURIComponent(id)}`);
    return shared.ok ? differentiateDashboard(shared.data) : null;
  },
};

export function useProjects() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}
