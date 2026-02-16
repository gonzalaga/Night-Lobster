"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RecommendationOutcome = {
  recommendationId: string;
  outcome: "accepted" | "modified" | "rejected" | "deferred";
  reason?: string;
};

export default function MorningPage() {
  const [runId, setRunId] = useState("");
  const [data, setData] = useState<any>(null);
  const [replay, setReplay] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [usefulness, setUsefulness] = useState(4);
  const [brevity, setBrevity] = useState(4);
  const [trust, setTrust] = useState(4);
  const [notes, setNotes] = useState("");

  async function loadRun() {
    setBusy(true);
    setError(null);
    setData(null);
    setReplay(null);

    try {
      const res = await fetch(`${API_URL}/morning/${runId}`);
      if (!res.ok) {
        throw new Error("Run not found or not ready");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function loadReplay() {
    if (!runId) {
      return;
    }

    const res = await fetch(`${API_URL}/runs/${runId}/replay`);
    if (!res.ok) {
      setError("Replay data unavailable");
      return;
    }

    const json = await res.json();
    setReplay(json);
    setError(null);
  }

  async function submitReview() {
    if (!data) {
      return;
    }

    const outcomes: RecommendationOutcome[] = (data.recommendationOutcomes ?? []).map((outcome: any) => ({
      recommendationId: outcome.recommendationId,
      outcome: "accepted" as const
    }));

    const res = await fetch(`${API_URL}/morning/${runId}/evaluation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        usefulnessRating: usefulness,
        brevityRating: brevity,
        trustRating: trust,
        notes,
        flaggedIssueTypes: [],
        outcomes
      })
    });

    if (!res.ok) {
      setError("Failed to submit review");
      return;
    }

    const payload = await res.json();
    setError(null);
    alert(`Submitted. Post-review score: ${payload.postScore.toFixed(2)}`);
  }

  const latestReport = data?.reports?.[0]?.reportJson;
  const provider = latestReport?.provider;

  return (
    <main>
      <h1>Morning Review</h1>
      <p>Load a run, skim recommendations, and submit outcome feedback.</p>

      <div className="panel">
        <label>Run ID</label>
        <input value={runId} onChange={(e) => setRunId(e.target.value)} placeholder="run id from mission setup" />
        <button style={{ marginTop: "0.75rem" }} onClick={loadRun} disabled={busy || runId.length === 0}>
          {busy ? "Loading..." : "Load Run"}
        </button>
      </div>

      {error ? (
        <div className="panel" style={{ marginTop: "1rem", borderColor: "#bf3f3f" }}>
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="panel" style={{ marginTop: "1rem" }}>
            <h2>Coffee Brief</h2>
            <p>{latestReport?.objective_result ?? "No objective result yet."}</p>
            <h3>Delta summary</h3>
            <ul>
              {(latestReport?.delta_summary ?? []).map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>Decisions needed</h3>
            <ul>
              {(latestReport?.decisions_needed_top3 ?? []).map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {provider ? (
              <small>
                Provider mode: {provider.mode} | Planner: {provider.planner_source} ({provider.planner_model}) |
                Synthesizer: {provider.synthesizer_source} ({provider.synthesizer_model})
              </small>
            ) : null}

            <button className="secondary" style={{ marginTop: "0.75rem" }} onClick={loadReplay}>
              Load Replay Timeline
            </button>
          </div>

          <div className="panel" style={{ marginTop: "1rem" }}>
            <h2>Feedback</h2>
            <div className="grid">
              <div>
                <label>Usefulness (1-5)</label>
                <input type="number" min={1} max={5} value={usefulness} onChange={(e) => setUsefulness(Number(e.target.value))} />
              </div>
              <div>
                <label>Brevity (1-5)</label>
                <input type="number" min={1} max={5} value={brevity} onChange={(e) => setBrevity(Number(e.target.value))} />
              </div>
              <div>
                <label>Trust (1-5)</label>
                <input type="number" min={1} max={5} value={trust} onChange={(e) => setTrust(Number(e.target.value))} />
              </div>
            </div>

            <label style={{ marginTop: "0.75rem" }}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

            <button style={{ marginTop: "0.75rem" }} onClick={submitReview}>
              Submit Morning Review
            </button>
          </div>
        </>
      ) : null}

      {replay ? (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h2>Replay Timeline</h2>
          <small>Ordered stage and tool events for this run.</small>
          <ul style={{ marginTop: "0.75rem" }}>
            {(replay.timeline ?? []).map((item: any, idx: number) => (
              <li key={`${item.type}-${idx}`}>
                <strong>{item.type}</strong> [{item.label}] {item.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
