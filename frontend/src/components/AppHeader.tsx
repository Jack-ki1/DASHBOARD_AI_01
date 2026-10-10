import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { CommandPalette } from "./CommandPalette";

const links = [
  { to: "/generate", label: "AI Builder" },
  { to: "/templates", label: "Templates" },
  { to: "/data", label: "Data" },
  { to: "/workspace", label: "Workspace" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
        <LayoutDashboard className="h-4 w-4" />
      </span>
      <span className="font-display text-sm font-bold tracking-tight">
        DASHBOARD <span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const email = user?.email ?? "";
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary !text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
            }
            className="hidden items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground sm:flex"
            aria-label="Open command palette (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5" /> Ctrl+K
          </button>
          {user ? (
            <>
              <span
                title={email}
                className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-bold uppercase text-accent-foreground"
              >
                {email.slice(0, 1)}
              </span>
              <button
                onClick={logout}
                className="hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary sm:block"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="hidden text-sm font-semibold text-muted-foreground hover:text-foreground sm:block"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/generate"
            className="hidden rounded-lg bg-gradient-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-glow sm:block"
          >
            New dashboard
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-background px-5 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={logout} className="py-2 text-sm font-medium text-muted-foreground">
              Sign out
            </button>
          ) : (
            <Link to="/auth" className="block py-2 text-sm font-semibold text-primary">
              Sign in
            </Link>
          )}
        </nav>
      )}
      <CommandPalette />
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row md:items-center">
        <Logo />
        <nav className="flex flex-wrap gap-5">
          <Link to="/templates" className="hover:text-foreground">
            Templates
          </Link>
          <Link to="/generate" className="hover:text-foreground">
            AI Builder
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </nav>
        <p>© 2026 DASHBOARD AI</p>
      </div>
    </footer>
  );
}
