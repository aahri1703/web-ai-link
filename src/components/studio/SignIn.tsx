import { Loader2, Plug } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage, getFirebaseAuth } from "@/lib/auth";

type Mode = "signin" | "signup" | "reset";

export function SignIn() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const google = () =>
    run(async () => {
      const auth = await getFirebaseAuth();
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(auth, new GoogleAuthProvider());
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const auth = await getFirebaseAuth();
      const fb = await import("firebase/auth");
      if (mode === "reset") {
        await fb.sendPasswordResetEmail(auth, email);
        setNotice("Check your email for a link to reset your password.");
        setMode("signin");
      } else if (mode === "signup") {
        const cred = await fb.createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await fb.updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await fb.signInWithEmailAndPassword(auth, email, password);
      }
    });
  };

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-6 sm:p-8">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[image:var(--gradient-brand)]">
          <Plug className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
        </span>
        <h1 className="mt-4 text-center font-display text-xl font-semibold">
          {mode === "signup"
            ? "Create your account"
            : mode === "reset"
              ? "Reset password"
              : "Sign in to Studio"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Make designs and mock papers, then print them.
        </p>

        {mode !== "reset" && (
          <>
            <Button variant="outline" className="mt-6 w-full" onClick={google} disabled={busy}>
              <GoogleIcon /> Continue with Google
            </Button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or{" "}
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={submit} className={`space-y-3 ${mode === "reset" ? "mt-6" : ""}`}>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          {mode !== "reset" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-400">{notice}</p>}

          <Button type="submit" className="w-full bg-[image:var(--gradient-brand)]" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === "signup"
              ? "Create account"
              : mode === "reset"
                ? "Send reset link"
                : "Sign in"}
          </Button>
        </form>

        <div className="mt-5 space-y-1 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              <p>
                New here?{" "}
                <button className="text-cyan hover:underline" onClick={() => setMode("signup")}>
                  Create an account
                </button>
              </p>
              <button className="text-xs hover:underline" onClick={() => setMode("reset")}>
                Forgot password?
              </button>
            </>
          ) : (
            <button className="text-cyan hover:underline" onClick={() => setMode("signin")}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"
      />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8z" />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"
      />
    </svg>
  );
}
