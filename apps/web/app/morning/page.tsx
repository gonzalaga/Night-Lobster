"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RecommendationOutcomeValue = "accepted" | "modified" | "rejected" | "deferred";

type RecommendationOutcome = {
  recommendationId: string;
  outcome: RecommendationOutcomeValue;
  reason?: string;
};

type ReportRecommendation = {
  recommendation_id: string;
  text: string;
  confidence: number;
  tradeoffs: string[];
};

type RunReport = {
  objective_result?: string;
  delta_summary?: string[];
  decisions_needed_top3?: string[];
  recommended_actions_top3?: ReportRecommendation[];
  provider?: {
    mode: string;
    planner_source: string;
    planner_model: string;
    synthesizer_source: string;
    synthesizer_model: string;
  };
};

type RunPayload = {
  reports?: Array<{ reportJson?: RunReport }>;
  recommendationOutcomes?: Array<{
    recommendationId: string;
    outcome: RecommendationOutcomeValue;
    reason?: string;
  }>;
  claimLinks?: Array<{
    claimId: string | null;
    artifactId: string;
    evidenceId: string;
    supportStrength: string;
  }>;
};

export default function MorningPage() {
  const [runId, setRunId] = useState("");
  const [data, setData] = useState<RunPayload | null>(null);
  const [replay, setReplay] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [usefulness, setUsefulness] = useState(4);
  const [brevity, setBrevity] = useState(4);
  const [trust, setTrust] = useState(4);
  const [notes, setNotes] = useState("");
  const [outcomeByRecommendation, setOutcomeByRecommendation] = useState<
    Record<string, RecommendationOutcomeValue>
  >({});
  const [reasonByRecommendation, setReasonByRecommendation] = useState<Record<string, string>>({});

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

      const json = (await res.json()) as RunPayload;
      setData(json);

      const report = json.reports?.[0]?.reportJson;
      const recommendations = report?.recommended_actions_top3 ?? [];
      const existingOutcomes = new Map(
        (json.recommendationOutcomes ?? []).map((item) => [
          item.recommendationId,
          { outcome: item.outcome, reason: item.reason ?? "" }
        ])
      );

      const nextOutcomes: Record<string, RecommendationOutcomeValue> = {};
      const nextReasons: Record<string, string> = {};

      for (const item of recommendations) {
        const existing = existingOutcomes.get(item.recommendation_id);
        nextOutcomes[item.recommendation_id] = existing?.outcome ?? "accepted";
        nextReasons[item.recommendation_id] = existing?.reason ?? "";
      }

      setOutcomeByRecommendation(nextOutcomes);
      setReasonByRecommendation(nextReasons);
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

    const report = data.reports?.[0]?.reportJson;
    const recommendations = report?.recommended_actions_top3 ?? [];
    const outcomes: RecommendationOutcome[] = recommendations.map((item) => {
      const recommendationId = item.recommendation_id;
      const reason = (reasonByRecommendation[recommendationId] ?? "").trim();
      return {
        recommendationId,
        outcome: outcomeByRecommendation[recommendationId] ?? "accepted",
        ...(reason ? { reason } : {})
      };
    });

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
  const recommendations = latestReport?.recommended_actions_top3 ?? [];
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
            <h3>Recommendations</h3>
            <ul>
              {recommendations.map((item) => (
                <li key={item.recommendation_id}>
                  <strong>{item.text}</strong> ({Math.round(item.confidence * 100)}% confidence)
                </li>
              ))}
            </ul>
            <small>Claim links captured: {data?.claimLinks?.length ?? 0}</small>
            <br />
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

            {recommendations.length > 0 ? (
              <>
                <h3 style={{ marginTop: "0.9rem" }}>Recommendation outcomes</h3>
                {recommendations.map((item) => (
                  <div key={item.recommendation_id} style={{ marginBottom: "0.8rem" }}>
                    <label>{item.text}</label>
                    <select
                      value={outcomeByRecommendation[item.recommendation_id] ?? "accepted"}
                      onChange={(e) =>
                        setOutcomeByRecommendation((current) => ({
                          ...current,
                          [item.recommendation_id]: e.target.value as RecommendationOutcomeValue
                        }))
                      }
                    >
                      <option value="accepted">Accepted</option>
                      <option value="modified">Modified</option>
                      <option value="deferred">Deferred</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <input
                      style={{ marginTop: "0.35rem" }}
                      value={reasonByRecommendation[item.recommendation_id] ?? ""}
                      onChange={(e) =>
                        setReasonByRecommendation((current) => ({
                          ...current,
                          [item.recommendation_id]: e.target.value
                        }))
                      }
                      placeholder="Optional reason"
                    />
                  </div>
                ))}
              </>
            ) : null}

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
