"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type CreateState = {
  projectId: string;
  missionId: string;
  handoffId: string;
  runId: string;
};

export default function MissionsPage() {
  const [projectName, setProjectName] = useState("Night Lobster");
  const [purpose, setPurpose] = useState("Nightly autonomous product iteration with morning decisions.");
  const [objective, setObjective] = useState("Validate top onboarding hypotheses and propose next experiment.");
  const [goalLinks, setGoalLinks] = useState("goal_short_activation");
  const [openQuestions, setOpenQuestions] = useState("Which checkpoint most impacts activation?");
  const [threadId, setThreadId] = useState("thr_default");
  const [state, setState] = useState<CreateState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createFlow() {
    setBusy(true);
    setError(null);

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
          work_item_links: [],
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
      <h1>Mission Setup</h1>
      <p>Create a project + mission + handoff, then queue the night run.</p>

      <div className="grid">
        <div className="panel">
          <label>Project name</label>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} />

          <label style={{ marginTop: "0.7rem" }}>Purpose</label>
          <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} />

          <label style={{ marginTop: "0.7rem" }}>Mission objective</label>
          <textarea value={objective} onChange={(e) => setObjective(e.target.value)} />
        </div>

        <div className="panel">
          <label>Goal links (comma-separated)</label>
          <input value={goalLinks} onChange={(e) => setGoalLinks(e.target.value)} />

          <label style={{ marginTop: "0.7rem" }}>Open questions (one per line)</label>
          <textarea value={openQuestions} onChange={(e) => setOpenQuestions(e.target.value)} />

          <label style={{ marginTop: "0.7rem" }}>Thread ID</label>
          <input value={threadId} onChange={(e) => setThreadId(e.target.value)} />

          <small>Defaults include 9pm scheduling assumptions and 120-minute runtime budget.</small>

          <button style={{ marginTop: "0.9rem" }} disabled={busy} onClick={createFlow}>
            {busy ? "Creating..." : "Create + Queue Night Run"}
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
          <h2>Queued successfully</h2>
          <p>Run ID: {state.runId}</p>
          <p>Open Morning Review and load this run ID after the worker completes.</p>
        </div>
      ) : null}
    </main>
  );
}
