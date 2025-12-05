'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "idle" | "ok" | "error";

export default function HealthCheckCard() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Checking backend health...");

  const pillClass = useMemo(() => {
    if (status === "ok") return "pill ok";
    if (status === "error") return "pill error";
    return "pill idle";
  }, [status]);

  const runCheck = useCallback(async () => {
    setStatus("idle");
    setMessage("Checking backend health...");

    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Unexpected status: ${response.status}`);
      }

      setStatus("ok");
      setMessage(
        data?.status === "ok"
          ? "Python endpoint is responding."
          : "Received a response, but status was unexpected."
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        "Unable to reach /api/health. Start `vercel dev` or deploy to check the Python function."
      );
    }
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return (
    <section className="card">
      <div className="status-row">
        <div>
          <h3>Backend health</h3>
          <p>Python handler deployed under /api/health.</p>
        </div>
        <span className={pillClass}>
          {status === "ok" ? "Healthy" : status === "error" ? "Issue" : "Checking"}
        </span>
      </div>
      <p className="note">{message}</p>
      <div className="actions">
        <button className="btn" onClick={runCheck}>
          Re-run check
        </button>
      </div>
    </section>
  );
}
