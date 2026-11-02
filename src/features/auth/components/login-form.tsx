"use client";

import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.includes("@") || password.length < 1) {
      setError("Enter the admin email and password.");
      return;
    }

    setLoading(true);

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/videos",
    });

    if (result.error) {
      setLoading(false);
      const message =
        result.error.message || "The email or password is incorrect.";
      setError(message);
      toast.error("Login failed", message);
      return;
    }

    router.push("/videos");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-[#111]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight">Admin sign in</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign in to upload and manage the video library.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@videoapp.local"
            className="h-10 w-full rounded-md border border-border bg-[#181818] px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="h-10 w-full rounded-md border border-border bg-[#181818] pl-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LockKeyhole className="size-4" />
          )}
          {loading ? "Signing in…" : "Sign in to studio"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
        <span>Public viewing stays open.</span>
        <Link href="/" className="font-medium text-foreground hover:text-primary">
          Back home
        </Link>
      </div>
    </div>
  );
}
