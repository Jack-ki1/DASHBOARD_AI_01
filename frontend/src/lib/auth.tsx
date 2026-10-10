import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, clearToken, setToken } from "./api";
import { syncFromCloud } from "./store";

export type User = { id: string; email: string };

type AuthState = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ user: User }>("/api/auth/me");
        if (!cancelled && res.ok) {
          setUser(res.data.user);
          await syncFromCloud();
        } else if (!cancelled && !res.ok && res.status === 401) {
          clearToken();
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveSession = useCallback(async (token: string, nextUser: User) => {
    setToken(token);
    setUser(nextUser);
    await syncFromCloud();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      if (!res.ok) throw new Error(res.message ?? "Sign-in failed.");
      await saveSession(res.data.token, res.data.user);
    },
    [saveSession],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: { email, password },
      });
      if (!res.ok) throw new Error(res.message ?? "Couldn't create the account.");
      await saveSession(res.data.token, res.data.user);
    },
    [saveSession],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
