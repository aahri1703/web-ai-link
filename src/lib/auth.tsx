// Firebase Auth for students. Loaded only in the browser (dynamic import), so
// server-side rendering never touches the Firebase SDK.
import type { Auth, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { setTokenGetter } from "@/lib/api";
import { DEMO_MODE } from "@/lib/demo";

// Demo mode skips Firebase sign-in so the site can be tried on any domain.
const DEMO_USER = {
  uid: "demo-student",
  displayName: "Demo student",
  email: null,
  photoURL: null,
} as unknown as User;

const env = import.meta.env;

// Web config is public by design (it identifies the project, it is not a secret).
const firebaseConfig = {
  apiKey: env["VITE_FIREBASE_API_KEY"] ?? "AIzaSyDyoeLao3i_xUkJfZs0PWoe22gy0VRfM48",
  authDomain: env["VITE_FIREBASE_AUTH_DOMAIN"] ?? "autonomusagent-5bfc6.firebaseapp.com",
  projectId: env["VITE_FIREBASE_PROJECT_ID"] ?? "autonomusagent-5bfc6",
  appId: env["VITE_FIREBASE_APP_ID"] ?? "1:810956785364:web:08377ebf05a1ce15a3dd41",
};

let authPromise: Promise<Auth> | null = null;

export function getFirebaseAuth(): Promise<Auth> {
  authPromise ??= (async () => {
    const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ]);
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    return getAuth(app);
  })();
  return authPromise;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_MODE ? DEMO_USER : null);
  const [loading, setLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) return;
    let unsub = () => {};
    getFirebaseAuth().then(async (auth) => {
      const { onIdTokenChanged } = await import("firebase/auth");
      // Every API call sends a fresh ID token; Firebase refreshes it hourly.
      setTokenGetter(() => auth.currentUser?.getIdToken() ?? Promise.resolve(null));
      unsub = onIdTokenChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  const signOut = async () => {
    if (DEMO_MODE) return;
    const auth = await getFirebaseAuth();
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Turns Firebase error codes into messages a student can act on. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string }).code ?? "";
  const messages: Record<string, string> = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/email-already-in-use": "An account with this email already exists — sign in instead.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in window was closed.",
    "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups and try again.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled in Firebase yet.",
    "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
    "auth/network-request-failed": "No internet connection.",
  };
  return messages[code] ?? (e as Error).message ?? "Sign-in failed.";
}
