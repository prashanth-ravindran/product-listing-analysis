'use client';

import { FormEvent, useMemo, useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

const sampleItems = [
  {
    title: "Wireless Noise-Cancelling Headphones",
    price: "$249",
    description: "Over-ear, 30h battery, adaptive noise control, USB-C fast charge."
  },
  {
    title: "Ergonomic Mesh Office Chair",
    price: "$189",
    description: "Adjustable lumbar, breathable mesh, flip-up arms, 275 lb capacity."
  }
];

export default function AnalysisForm() {
  const [query, setQuery] = useState("Summarize these listings and highlight differences.");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const statusPill = useMemo(() => {
    if (status === "loading") return "pill idle";
    if (status === "done") return "pill ok";
    if (status === "error") return "pill error";
    return "pill idle";
  }, [status]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Calling /api/analyze via Python + Gemini...");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, items: sampleItems })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with status ${response.status}`);
      }

      setStatus("done");
      setMessage(data?.analysis || "No analysis returned.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong calling the backend."
      );
    }
  }

  return (
    <section className="card">
      <div className="status-row">
        <div>
          <h3>Run an analysis</h3>
          <p>Submit a prompt to the Python backend, which calls Gemini with sample items.</p>
        </div>
        <span className={statusPill}>
          {status === "loading" ? "Running" : status === "done" ? "Success" : "Idle"}
        </span>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span className="label">Prompt</span>
          <textarea
            className="textarea"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            required
          />
        </label>

        <div className="field">
          <span className="label">Sample listings (sent to backend)</span>
          <ul className="list muted">
            {sampleItems.map((item, idx) => (
              <li key={idx}>
                <strong>{item.title}</strong> — {item.price}
                <br />
                <span className="small">{item.description}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="actions">
          <button className="btn" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Analyzing..." : "Analyze with Gemini"}
          </button>
          <p className="note">
            Requires `GEMINI_API_KEY` in your Vercel env. Backend: `/api/analyze`.
          </p>
        </div>
      </form>

      {message && (
        <div className="result">
          <p className="label">Response</p>
          <p className="note">{message}</p>
        </div>
      )}
    </section>
  );
}
