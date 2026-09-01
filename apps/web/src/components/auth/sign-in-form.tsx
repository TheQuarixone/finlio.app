"use client";

import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Email OTP and Google (PRD ON-1).
 *
 * Both flows finish at `/auth/callback`, which is the only place that writes a
 * session. Apple is tracked separately — it needs an Apple Developer Program
 * membership and is mandatory only once the iOS app ships in Phase 4.
 */
export function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callback = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    const supabase = browserSupabase();
    if (!supabase) return setError("Sign-in isn't configured on this environment yet.");

    setBusy(true);
    setError(null);
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: callback() },
    });
    setBusy(false);

    if (sendError) return setError(sendError.message);
    setStage("code");
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    const supabase = browserSupabase();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);

    if (verifyError) return setError(verifyError.message);
    // The session now exists client-side; the server needs its cookie, which
    // only the callback route may set.
    window.location.assign(next);
  }

  async function signInWithGoogle() {
    const supabase = browserSupabase();
    if (!supabase) return setError("Sign-in isn't configured on this environment yet.");

    setBusy(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback() },
    });
    if (oauthError) {
      setBusy(false);
      setError(oauthError.message);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in to Finlio</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your holdings stay encrypted on your own device. Signing in is only how we
        remember your goals and your plan.
      </p>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy}
        className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-medium transition hover:bg-muted disabled:opacity-60"
      >
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      {stage === "email" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <Input
              className="mt-1"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Sending…" : "Email me a code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Six-digit code</span>
            <Input
              className="mt-1 tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Sent to {email}
            </span>
          </label>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Checking…" : "Sign in"}
          </Button>
          <button
            type="button"
            onClick={() => setStage("email")}
            className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
