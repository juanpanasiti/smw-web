"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLoginMutation } from "@/features/auth/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

const initialState = { username: "", password: "" };

export default function LoginPage() {
  const [form, setForm] = useState(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate(form);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-slate-950">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <main className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg shadow-zinc-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/50">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">Sign in</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm text-zinc-600 dark:text-slate-400">Username</span>
            <input
              className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-zinc-700 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
              name="username"
              placeholder="your username"
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-600 dark:text-slate-400">Password</span>
            <div className="relative">
              <input
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-zinc-900 outline-none focus:border-zinc-700 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                name="password"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-slate-400 dark:hover:text-slate-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>
          {loginMutation.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {loginMutation.error instanceof Error
                ? loginMutation.error.message
                : "Could not sign in."}
            </p>
          )}
          <button
            type="submit"
            disabled={loginMutation.status === "pending"}
            className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {loginMutation.status === "pending" ? "Validating..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-sm text-zinc-600 dark:text-slate-400">
          Don&apos;t have an account? <Link className="font-semibold text-slate-900 dark:text-emerald-400" href="/register">Sign up</Link>
        </p>
      </main>
    </div>
  );
}
