// All backend calls go through here — never fetch() directly in components.
// Set NEXT_PUBLIC_API_URL in Vercel dashboard → Environment Variables.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export interface Citation {
  index: number;
  title: string;
  authors: string[];
  pmid: string;
  url: string;
}

export interface QueryResponse {
  answer: string;
  citations: Citation[];
  steps: number;
}

export const api = {
  query: async (question: string): Promise<QueryResponse> => {
    const res = await fetch(`${API_BASE}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? `Server error ${res.status}`);
    }

    return res.json();
  },

  health: async (): Promise<{ status: string }> => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
};
