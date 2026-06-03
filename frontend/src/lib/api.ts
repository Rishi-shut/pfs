import { session } from "./session";
import type {
  ChatResponse,
  DashboardData,
  Insight,
  Proposal,
  SimulateResult,
} from "../types";

const BASE = "http://localhost:8000";

function authHeaders(): Record<string, string> {
  const sid = session.id;
  return sid ? { "X-Session-Id": sid } : {};
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });
  if (!r.ok) {
    let detail: string;
    try {
      detail = JSON.stringify(await r.json());
    } catch {
      detail = r.statusText;
    }
    throw new Error(`HTTP ${r.status}: ${detail}`);
  }
  return r.json();
}

export const api = {
  createSession: (name: string) =>
    jsonFetch<{ session_id: string; name: string }>(
      `${BASE}/api/auth/session`,
      { method: "POST", body: JSON.stringify({ name }) },
    ),

  uploadCsv: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${BASE}/api/upload`, {
      method: "POST",
      headers: authHeaders(),
      body: fd,
    });
    if (!r.ok) throw new Error(`Upload failed: ${r.statusText}`);
    return r.json() as Promise<{ transaction_count: number; session_id: string }>;
  },

  uploadSample: () =>
    jsonFetch<{ transaction_count: number; session_id: string }>(
      `${BASE}/api/upload/sample`,
      { method: "POST" },
    ),

  listSamples: () =>
    jsonFetch<{ key: string; label: string; description: string; available: boolean }[]>(
      `${BASE}/api/samples`,
    ),

  uploadNamedSample: (key: string) =>
    jsonFetch<{ transaction_count: number; session_id: string }>(
      `${BASE}/api/upload/sample/${key}`,
      { method: "POST" },
    ),

  processSSE: (sid: string): EventSource =>
    new EventSource(`${BASE}/api/process/${sid}`),

  insights: (sid: string) => jsonFetch<Insight[]>(`${BASE}/api/insights/${sid}`),

  dashboard: (sid: string) => jsonFetch<DashboardData>(`${BASE}/api/dashboard/${sid}`),

  simulate: (sid: string, deltas: Record<string, number>) =>
    jsonFetch<SimulateResult>(`${BASE}/api/simulate/${sid}`, {
      method: "POST",
      body: JSON.stringify({ deltas }),
    }),

  chat: (message: string) =>
    jsonFetch<ChatResponse>(`${BASE}/api/agent/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  proposals: (sid: string) =>
    jsonFetch<Proposal[]>(`${BASE}/api/proposals/${sid}`),

  confirmProposal: (proposalId: string) =>
    jsonFetch<Proposal>(`${BASE}/api/proposals/${proposalId}/confirm`, {
      method: "POST",
    }),
};
