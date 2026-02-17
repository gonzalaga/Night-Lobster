"use client";

import { useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type MissionSummary = {
  id: string;
  title: string;
  status: string;
};

type WorkItem = {
  id: string;
  projectId: string;
  title: string;
  type: string;
  status: "backlog" | "in_progress" | "blocked" | "done";
  priority: number;
  nextStep: string | null;
  owner: "agent" | "human";
  linksJson: string[] | null;
  goalLinksJson: string[] | null;
  missions: Array<{ mission: MissionSummary }>;
};

export default function WorkBoardPage() {
  const [projectId, setProjectId] = useState("");
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("research");
  const [status, setStatus] = useState<WorkItem["status"]>("backlog");
  const [priority, setPriority] = useState(3);
  const [nextStep, setNextStep] = useState("");
  const [owner, setOwner] = useState<WorkItem["owner"]>("agent");
  const [goalLinks, setGoalLinks] = useState("");
  const [links, setLinks] = useState("");
  const [missionLinkByWorkItem, setMissionLinkByWorkItem] = useState<Record<string, string>>({});

  const canLoad = projectId.trim().length > 0;

  const missionOptions = useMemo(
    () => missions.map((mission) => ({ value: mission.id, label: `${mission.title} (${mission.status})` })),
    [missions]
  );

  async function loadData() {
    if (!canLoad) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const [workRes, missionRes] = await Promise.all([
        fetch(`${API_URL}/work-items?projectId=${encodeURIComponent(projectId.trim())}`),
        fetch(`${API_URL}/missions?projectId=${encodeURIComponent(projectId.trim())}`)
      ]);

      if (!workRes.ok) {
        throw new Error("Failed to load work items");
      }
      if (!missionRes.ok) {
        throw new Error("Failed to load missions");
      }

      const workJson = (await workRes.json()) as WorkItem[];
      const missionJson = (await missionRes.json()) as Array<{ id: string; title: string; status: string }>;

      setWorkItems(workJson);
      setMissions(missionJson.map((item) => ({ id: item.id, title: item.title, status: item.status })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function createWorkItem() {
    if (!canLoad || title.trim().length === 0) {
      return;
    }

    setError(null);
    const res = await fetch(`${API_URL}/work-items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: projectId.trim(),
        title: title.trim(),
        type: type.trim(),
        status,
        priority,
        nextStep: nextStep.trim() || undefined,
        owner,
        goalLinks: goalLinks
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        links: links
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      })
    });

    if (!res.ok) {
      setError("Failed to create work item");
      return;
    }

    setTitle("");
    setNextStep("");
    setGoalLinks("");
    setLinks("");
    await loadData();
  }

  async function updateWorkItem(item: WorkItem, patch: Partial<Pick<WorkItem, "status" | "nextStep" | "owner">>) {
    const res = await fetch(`${API_URL}/work-items/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });

    if (!res.ok) {
      setError(`Failed to update work item ${item.id}`);
      return;
    }

    await loadData();
  }

  async function linkMission(workItemId: string) {
    const missionId = missionLinkByWorkItem[workItemId];
    if (!missionId) {
      return;
    }

    const res = await fetch(`${API_URL}/work-items/${workItemId}/link-mission`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ missionId })
    });

    if (!res.ok) {
      setError("Failed to link mission");
      return;
    }

    await loadData();
  }

  async function unlinkMission(workItemId: string, missionId: string) {
    const res = await fetch(`${API_URL}/work-items/${workItemId}/link-mission/${missionId}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      setError("Failed to unlink mission");
      return;
    }

    await loadData();
  }

  return (
    <main>
      <h1>Work Board</h1>
      <p>Create and maintain work items, then link them to missions for continuity.</p>

      <div className="panel">
        <label>Project ID</label>
        <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="proj_xxx" />
        <button className="secondary" style={{ marginTop: "0.75rem" }} onClick={loadData} disabled={!canLoad || busy}>
          {busy ? "Loading..." : "Load Work Board"}
        </button>
      </div>

      {error ? (
        <div className="panel" style={{ marginTop: "1rem", borderColor: "#bf3f3f" }}>
          {error}
        </div>
      ) : null}

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Create work item</h2>
        <div className="grid">
          <div>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label>Type</label>
            <input value={type} onChange={(e) => setType(e.target.value)} />
          </div>
          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as WorkItem["status"])}>
              <option value="backlog">Backlog</option>
              <option value="in_progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label>Priority (1-5)</label>
            <input type="number" min={1} max={5} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
          </div>
          <div>
            <label>Owner</label>
            <select value={owner} onChange={(e) => setOwner(e.target.value as WorkItem["owner"])}>
              <option value="agent">Agent</option>
              <option value="human">Human</option>
            </select>
          </div>
        </div>
        <label style={{ marginTop: "0.75rem" }}>Next step</label>
        <input value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
        <label style={{ marginTop: "0.75rem" }}>Goal links (comma-separated)</label>
        <input value={goalLinks} onChange={(e) => setGoalLinks(e.target.value)} />
        <label style={{ marginTop: "0.75rem" }}>External links (comma-separated)</label>
        <input value={links} onChange={(e) => setLinks(e.target.value)} />
        <button style={{ marginTop: "0.75rem" }} onClick={createWorkItem} disabled={!canLoad || title.trim().length === 0}>
          Create Work Item
        </button>
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Items ({workItems.length})</h2>
        {workItems.length === 0 ? <small>No items loaded.</small> : null}
        {workItems.map((item) => (
          <div key={item.id} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.9rem", marginTop: "0.9rem" }}>
            <strong>{item.title}</strong>
            <small style={{ display: "block" }}>
              {item.type} | priority {item.priority} | owner {item.owner}
            </small>
            <div className="grid" style={{ marginTop: "0.5rem" }}>
              <div>
                <label>Status</label>
                <select
                  value={item.status}
                  onChange={(e) =>
                    updateWorkItem(item, {
                      status: e.target.value as WorkItem["status"]
                    })
                  }
                >
                  <option value="backlog">Backlog</option>
                  <option value="in_progress">In progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label>Owner</label>
                <select
                  value={item.owner}
                  onChange={(e) =>
                    updateWorkItem(item, {
                      owner: e.target.value as WorkItem["owner"]
                    })
                  }
                >
                  <option value="agent">Agent</option>
                  <option value="human">Human</option>
                </select>
              </div>
            </div>
            <label style={{ marginTop: "0.5rem" }}>Next step</label>
            <input
              defaultValue={item.nextStep ?? ""}
              onBlur={(e) =>
                updateWorkItem(item, {
                  nextStep: e.target.value.trim() || null
                })
              }
              placeholder="Update then blur to save"
            />

            <label style={{ marginTop: "0.5rem" }}>Linked missions</label>
            <ul>
              {item.missions.map((link) => (
                <li key={`${item.id}:${link.mission.id}`}>
                  {link.mission.title} ({link.mission.status}){" "}
                  <button
                    className="secondary"
                    style={{ width: "auto", display: "inline-block", marginLeft: "0.5rem", padding: "0.2rem 0.5rem" }}
                    onClick={() => unlinkMission(item.id, link.mission.id)}
                  >
                    Unlink
                  </button>
                </li>
              ))}
            </ul>

            <label>Link mission</label>
            <select
              value={missionLinkByWorkItem[item.id] ?? ""}
              onChange={(e) =>
                setMissionLinkByWorkItem((current) => ({
                  ...current,
                  [item.id]: e.target.value
                }))
              }
            >
              <option value="">Select mission</option>
              {missionOptions.map((mission) => (
                <option key={mission.value} value={mission.value}>
                  {mission.label}
                </option>
              ))}
            </select>
            <button className="secondary" style={{ marginTop: "0.35rem" }} onClick={() => linkMission(item.id)}>
              Link to Mission
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
