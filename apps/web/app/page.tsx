import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <p className="kicker">Night Lobster MVP</p>
      <h1>Nightly build/research loop</h1>
      <p>
        Build missions during the day, run autonomous jobs at night, and review compact decisions in the
        morning.
      </p>

      <div className="grid" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <h2>1. Create mission + handoff</h2>
          <p>Define objective, constraints, and queue a run from one form.</p>
          <Link href="/missions">
            <button>Open Mission Setup</button>
          </Link>
        </div>

        <div className="panel">
          <h2>2. Morning review</h2>
          <p>Load a run, inspect the report, and submit outcome feedback.</p>
          <Link href="/morning">
            <button className="secondary">Open Morning Review</button>
          </Link>
        </div>

        <div className="panel">
          <h2>3. Work board</h2>
          <p>Track work items and link them to missions for continuity.</p>
          <Link href="/workboard">
            <button className="secondary">Open Work Board</button>
          </Link>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h3>Current defaults</h3>
        <p>
          Nightly schedule: <strong>9:00 PM local</strong> | Runtime budget: <strong>120 minutes</strong> |
          Policy: <strong>read/write with documentation</strong>
        </p>
      </div>
    </main>
  );
}
