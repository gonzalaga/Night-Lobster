function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)\]\}"]+/g);
  return matches ?? [];
}

type WebEvidence = {
  kind: "web";
  citation: string;
  qualityScore: number;
  excerpt: string;
  notes: string;
};

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow"
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match) {
    return "Untitled";
  }

  return match[1].trim().slice(0, 120);
}

export async function gatherWebEvidence(inputs: string[], maxItems: number): Promise<WebEvidence[]> {
  const uniqueUrls = Array.from(new Set(inputs.flatMap((value) => extractUrls(value))));
  const evidence: WebEvidence[] = [];

  for (const url of uniqueUrls) {
    if (evidence.length >= maxItems) {
      break;
    }

    try {
      const res = await fetchWithTimeout(url, 4500);
      const body = await res.text();
      const title = extractTitle(body);

      evidence.push({
        kind: "web",
        citation: url,
        qualityScore: res.ok ? 0.65 : 0.45,
        excerpt: `${res.status} ${res.statusText} | ${title}`,
        notes: "Fetched from context-linked URL during nightly execution"
      });
    } catch {
      evidence.push({
        kind: "web",
        citation: url,
        qualityScore: 0.3,
        excerpt: "Request failed or timed out",
        notes: "Captured as low-confidence external signal"
      });
    }
  }

  return evidence;
}
