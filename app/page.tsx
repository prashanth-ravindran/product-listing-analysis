import AnalysisForm from "@/components/analysis-form";
import HealthCheckCard from "@/components/health-check";
import AuthGuard from "@/components/auth-guard";

export default function Home() {
  return (
    <AuthGuard>
      <main className="main">
        <div className="shell">
          <header className="hero">
            <span className="eyebrow">Product Listing Analysis</span>
            <h1 className="hero-title">React front end with a Python backend on Vercel</h1>
            <p className="hero-subtitle">
              This scaffold pairs a Next.js UI with a Python serverless function. Use it to
              explore product listing analysis, call Gemini from the backend, and ship fast on
              Vercel.
            </p>
          </header>

          <div className="grid">
            <section className="card">
              <h3>How to extend</h3>
              <p>Add your React flows here and route backend calls through the Python functions.</p>
              <ul className="list">
                <li>Build UI flows under the <code>app</code> directory.</li>
                <li>Call your Python endpoints under <code>/api</code> (e.g., <code>/api/health</code>).</li>
                <li>Wire Gemini requests from Python and keep secrets in Vercel env vars.</li>
              </ul>
            </section>

            <AnalysisForm />
            <HealthCheckCard />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
