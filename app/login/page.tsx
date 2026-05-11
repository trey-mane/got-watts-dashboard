"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/overview");
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
      {/* MM Logo */}
      <div className="mb-12 animate-fade-in">
        <Image
          src="/MM.png"
          alt="Micheletti Media"
          width={80}
          height={80}
          className="object-contain"
          priority
        />
      </div>

      {/* Greeting */}
      <div className="mb-10 text-center">
        <p
          className="font-serif text-5xl text-text-primary animate-fade-in"
          style={{ animationDuration: "0.8s" }}
        >
          Hello,
        </p>
        <p
          className="font-serif text-5xl text-brand mt-1 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          welcome back.
        </p>
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-sm opacity-0 animate-fade-up"
        style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
      >
        <form
          onSubmit={handleSubmit}
          className="bg-surface-card border border-surface-border rounded-2xl p-8 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-xs uppercase tracking-widest font-sans">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-surface-muted border border-surface-border rounded-lg px-4 py-3 text-text-primary text-sm font-sans outline-none focus:border-brand transition-colors placeholder:text-text-muted"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-xs uppercase tracking-widest font-sans">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-surface-muted border border-surface-border rounded-lg px-4 py-3 text-text-primary text-sm font-sans outline-none focus:border-brand transition-colors placeholder:text-text-muted"
              placeholder="••••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-sans text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-sans font-medium text-sm rounded-lg px-4 py-3 transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-text-muted text-xs font-sans mt-6">
          Micheletti Media Client Portal
        </p>
      </div>
    </div>
  );
}
