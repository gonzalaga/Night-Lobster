"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type CreateState = {
  projectId: string;
  missionId: string;
  handoffId: string;
  runId: string;
};

type RunStatus = "queued" | "running" | "completed" | "partial" | "failed";

type RunSnapshot = {
  status: RunStatus;
  startedAt: string | null;
  endedAt: string | null;
  checkedAt: string;
};

const RUN_STATUS_COPY: Record<RunStatus, string> = {
  queued: "Queued. Waiting for the worker to start.",
  running: "Running. The agent is actively executing the mission.",
  completed: "Completed. Morning Review is ready.",
  partial: "Partially completed. Morning Review is ready with partial output.",
  failed: "Run failed. Open Morning Review or logs to inspect details."
};

function isTerminal(status: RunStatus): boolean {
  return status === "completed" || status === "partial" || status === "failed";
}

export default function MissionsPage() {
  const [projectName, setProjectName] = useState("Night Lobster");
  const [purpose, setPurpose] = useState("Nightly autonomous product iteration with morning decisions.");
  const [objective, setObjective] = useState("Validate top onboarding hypotheses and propose next experiment.");
  const [goalLinks, setGoalLinks] = useState("goal_short_activation");
  const [workItemLinks, setWorkItemLinks] = useState("");
  const [openQuestions, setOpenQuestions] = useState("Which checkpoint most impacts activation?");
  const [threadId, setThreadId] = useState("thr_default");
  const [state, setState] = useState<CreateState | null>(null);
  const [runSnapshot, setRunSnapshot] = useState<RunSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const runId = state?.runId;
    if (!runId) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/runs/${runId}`);
        if (!res.ok) {
          throw new Error("Run not available yet");
        }

        const run = (await res.json()) as {
          status: RunStatus;
          startedAt: string | null;
          endedAt: string | null;
        };

        if (cancelled) {
          return;
        }

        setRunSnapshot({
          status: run.status,
          startedAt: run.startedAt,
          endedAt: run.endedAt,
          checkedAt: new Date().toISOString()
        });

        if (!isTerminal(run.status)) {
          timer = setTimeout(() => {
            void poll();
          }, 4000);
        }
      } catch {
        if (!cancelled) {
          timer = setTimeout(() => {
            void poll();
          }, 6000);
        }
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [state?.runId]);

  async function createFlow() {
    setBusy(true);
    setError(null);
    setRunSnapshot(null);

    try {
      const projectRes = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: projectName, purpose })
      });

      if (!projectRes.ok) {
        throw new Error("Failed to create project");
      }

      const project = await projectRes.json();

      const missionRes = await fetch(`${API_URL}/missions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title: "Nightly exploration mission",
          objective,
          constraints: {
            max_runtime_minutes: 120,
            write_mode: "read_write_with_documentation"
          },
          workItemIds: workItemLinks
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          successCriteria: [
            "At least 3 high-quality evidence sources",
            "One ranked recommendation",
            "Top 3 decisions needed"
          ],
          status: "scheduled"
        })
      });

      if (!missionRes.ok) {
        throw new Error("Failed to create mission");
      }

      const mission = await missionRes.json();
      const handoffId = `han_${Date.now()}`;

      const handoffRes = await fetch(`${API_URL}/handoffs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handoff_id: handoffId,
          project_id: project.id,
          thread_id: threadId,
          mission_id: mission.id,
          source_provider: "chatgpt",
          target_mode: "night_run",
          objective,
          goal_links: goalLinks.split(",").map((item) => item.trim()).filter(Boolean),
          work_item_links: workItemLinks
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          decisions_already_made: [],
          open_questions: openQuestions
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          must_use_context: [],
          constraints: {
            max_runtime_minutes: 120,
            tool_policy: {
              allowed_tools: ["web_research", "repo_read", "repo_write_pr"],
              denied_tools: ["prod_deploy", "external_email"],
              scopes: {
                repo_write_pr: {
                  allowed_paths: ["apps/web/**", "apps/server/**"],
                  max_files_changed: 20,
                  max_diff_lines: 800,
                  requires_approval: "pre_run_batch"
                }
              }
            },
            forbidden_actions: ["deploy_prod", "send_external_email", "unrequested_longform_docs"]
          },
          provenance_requirements: {
            min_evidence_items: 3,
            claims_must_link_evidence: true
          },
          assumption_policy: {
            max_open_assumptions: 3,
            when_blocked_convert_to_decision: true
          },
          success_criteria: [
            "At least 3 high-quality evidence sources",
            "One ranked recommendation",
            "Top 3 user decisions required"
          ],
          authority_policy: {
            start_level: "suggest",
            max_level_this_run: "recommend",
            allow_autonomous_write_actions: true,
            escalation_mode: "threshold_gated"
          }
        })
      });

      if (!handoffRes.ok) {
        throw new Error("Failed to create handoff");
      }

      const handoff = await handoffRes.json();

      const runRes = await fetch(`${API_URL}/runs/from-handoff`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handoffId: handoff.id })
      });

      if (!runRes.ok) {
        throw new Error("Failed to queue run");
      }

      const run = await runRes.json();
      setRunSnapshot({
        status: "queued",
        startedAt: null,
        endedAt: null,
        checkedAt: new Date().toISOString()
      });
      setState({
        projectId: project.id,
        missionId: mission.id,
        handoffId: handoff.id,
        runId: run.runId
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Set Up Tonight&apos;s Mission</h1>
      <p>Describe what you want done overnight, queue the run, then follow progress here until Morning Review is ready.</p>

      <div className="grid">
        <div className="panel">
          <label>Project</label>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Night Lobster" />

          <label style={{ marginTop: "0.7rem" }}>Why this project matters</label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="One or two sentences about desired outcomes."
          />

          <label style={{ marginTop: "0.7rem" }}>Tonight&apos;s objective</label>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="What should the agent accomplish tonight?"
          />
        </div>

        <div className="panel">
          <label>Goal tags (comma-separated)</label>
          <input
            value={goalLinks}
            onChange={(e) => setGoalLinks(e.target.value)}
            placeholder="goal_short_activation, goal_medium_retention"
          />

          <label style={{ marginTop: "0.7rem" }}>Related work item IDs (optional)</label>
          <input
            value={workItemLinks}
            onChange={(e) => setWorkItemLinks(e.target.value)}
            placeholder="work_xxx, work_yyy"
          />

          <label style={{ marginTop: "0.7rem" }}>Questions to answer overnight (one per line)</label>
          <textarea
            value={openQuestions}
            onChange={(e) => setOpenQuestions(e.target.value)}
            placeholder="What should we validate tonight?"
          />

          <label style={{ marginTop: "0.7rem" }}>Conversation thread ID</label>
          <input value={threadId} onChange={(e) => setThreadId(e.target.value)} />

          <small>Defaults: 9:00 PM schedule window, 120-minute runtime, read/write with documentation policy.</small>

          <button style={{ marginTop: "0.9rem" }} disabled={busy} onClick={createFlow}>
            {busy ? "Queueing..." : "Queue Night Run"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="panel" style={{ marginTop: "1rem", borderColor: "#bf3f3f" }}>
          <strong>Failed:</strong> {error}
        </div>
      ) : null}

      {state ? (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h2>Run queued</h2>
          <p>Run ID: {state.runId}</p>
          {runSnapshot ? (
            <>
              <p>
                <strong>Status:</strong> {runSnapshot.status}
              </p>
              <p>{RUN_STATUS_COPY[runSnapshot.status]}</p>
              <small>Last checked: {new Date(runSnapshot.checkedAt).toLocaleTimeString()}</small>
            </>
          ) : (
            <p>Checking run status...</p>
          )}

          <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button onClick={() => window.location.assign(`/morning?runId=${encodeURIComponent(state.runId)}`)}>
              Open Morning Review
            </button>
            <button
              className="secondary"
              onClick={() => {
                setState(null);
                setRunSnapshot(null);
              }}
            >
              Queue Another Mission
            </button>
          </div>

          {!runSnapshot || !isTerminal(runSnapshot.status) ? (
            <small style={{ display: "block", marginTop: "0.8rem" }}>
              You can open Morning Review now; if the run is still in progress, refresh in a minute.
            </small>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
