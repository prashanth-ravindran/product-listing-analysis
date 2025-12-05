'use client';

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthUser, setAuthUser } from "@/components/auth-guard";

type Status = "idle" | "loading" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("xtract1234");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const pillClass = useMemo(() => {
    if (status === "loading") return "pill idle";
    if (status === "error") return "pill error";
    return "pill idle";
  }, [status]);

  useEffect(() => {
    const existing = localStorage.getItem("pla_auth_user");
    if (existing) {
      router.replace("/");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Authenticating...");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Login failed.");
      }
      clearAuthUser();
      setAuthUser(data?.user || username);
      router.replace("/");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Login failed.");
      return;
    }
    setStatus("idle");
    setMessage(null);
  }

  return (
    <main className="main">
      <div className="shell">
        <header className="hero">
          <span className="eyebrow">Sign in</span>
          <h1 className="hero-title">Access Product Listing Analysis</h1>
          <p className="hero-subtitle">
            Identity is backed by SQLite and enforced via the Python backend. Default user is
            <code> admin </code> / <code> xtract1234</code>.
          </p>
        </header>

        <section className="card">
          <div className="status-row">
            <div>
              <h3>Login</h3>
              <p>Authenticate to proceed to the landing page.</p>
            </div>
            <span className={pillClass}>{status === "loading" ? "Checking" : "Idle"}</span>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span className="label">Username</span>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="field">
              <span className="label">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <div className="actions">
              <button className="btn" type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Signing in..." : "Sign in"}
              </button>
              {message && <p className="note">{message}</p>}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
