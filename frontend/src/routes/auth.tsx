import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ next: z.string().optional() }),
  component: AuthPage,
});

const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/workspace");

function AuthPage() {
  useTitle("Sign in — DASHBOARD AI");
  const { next } = Route.useSearch();
  const nav = useNavigate();
  const { user, ready, login, register } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) nav({ to: safeNext(next) });
  }, [ready, user, next, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "up") {
        await register(email.trim(), password);
        toast.success("Account created — welcome!");
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="surface p-6 shadow-float">
          <h1 className="text-xl font-bold">
            {mode === "in" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save dashboards to your account, use the AI builder, and share links.
          </p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (8+ characters)"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-70"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>
          <div className="mt-4 text-xs">
            <button
              onClick={() => setMode(mode === "in" ? "up" : "in")}
              className="font-semibold text-primary"
            >
              {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
