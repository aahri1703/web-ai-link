import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { FileText, Loader2, LogOut, Palette, Plug, Printer } from "lucide-react";

import { SignIn } from "@/components/studio/SignIn";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { api } from "@/lib/api";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/demo";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio — ConnectAI" },
      {
        name: "description",
        content: "Create designs and mock papers, then send them to the printer.",
      },
    ],
  }),
  component: StudioLayout,
});

const tabs = [
  { to: "/studio", label: "Design", icon: Palette, exact: true },
  { to: "/studio/papers", label: "Mock paper", icon: FileText, exact: false },
  { to: "/studio/print", label: "Print queue", icon: Printer, exact: false },
] as const;

function StudioLayout() {
  return (
    <AuthProvider>
      <StudioShell />
    </AuthProvider>
  );
}

function StudioShell() {
  const { user, loading } = useAuth();
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] grid-backdrop opacity-60" />
      <div className="pointer-events-none absolute -top-48 left-1/3 h-[480px] w-[480px] rounded-full bg-primary/20 blur-[140px]" />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-brand)]">
              <Plug className="h-4 w-4 text-primary-foreground" strokeWidth={2.4} />
            </span>
            <span className="hidden font-display font-bold tracking-tight sm:inline">
              Connect<span className="text-gradient">AI</span> Studio
            </span>
          </Link>

          <nav className="mx-auto flex min-w-0 gap-1 overflow-x-auto rounded-xl border border-border bg-glass p-1">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: t.exact }}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                <t.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </Link>
            ))}
          </nav>

          {user && <StatusPills />}
          {user && <UserMenu />}
        </div>
      </header>

      {DEMO_MODE && (
        <div className="relative border-b border-amber-400/40 bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-200">
          <strong>Demo mode</strong> — no AI is connected. Ask for a house to see a sample image,
          then try printing it. The school printer is simulated.
        </div>
      )}

      <main className="relative mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
        {loading ? (
          <div className="grid min-h-[60vh] place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
          </div>
        ) : user ? (
          <Outlet />
        ) : (
          <SignIn />
        )}
      </main>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

function StatusPills() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 15_000,
    retry: false,
  });
  const quota = useQuery({
    queryKey: ["quota"],
    queryFn: api.quota,
    refetchInterval: 15_000,
    retry: false,
  });

  if (health.isError) {
    return (
      <span className="shrink-0 rounded-full border border-destructive/50 bg-destructive/15 px-3 py-1 text-xs text-destructive">
        Backend offline
      </span>
    );
  }
  const h = health.data;
  return (
    <div className="hidden shrink-0 items-center gap-2 md:flex">
      {h && h.shared_printer !== "none" && (
        <span
          title={`School printer (${h.shared_printer})`}
          className="flex items-center gap-1.5 rounded-full border border-border bg-glass px-3 py-1 text-xs text-muted-foreground"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${h.shared_printer_online ? "bg-emerald-400" : "bg-amber-400"}`}
          />
          School printer {h.shared_printer_online ? "online" : "offline"}
        </span>
      )}
      {quota.data && (
        <span className="rounded-full border border-border bg-glass px-3 py-1 text-xs text-muted-foreground tabular-nums">
          {quota.data.remaining}/{quota.data.daily_limit} pages left
        </span>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  if (!user) return null;
  const label = user.displayName ?? user.email ?? "Student";
  return (
    <div className="flex shrink-0 items-center gap-2">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          className="h-8 w-8 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-sm font-semibold">
          {label[0]?.toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-32 truncate text-sm xl:inline">{label}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => signOut().then(() => qc.clear())}
        aria-label="Sign out"
      >
        <LogOut />
      </Button>
    </div>
  );
}
