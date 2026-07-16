"use client";

import { useState, FormEvent } from "react";
import { api, QueryResponse } from "@/lib/api";

interface Turn {
  question: string;
  response?: QueryResponse;
  error?: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setTurns((prev) => [...prev, { question }]);
    setLoading(true);

    try {
      const response = await api.query(question);
      setTurns((prev) =>
        prev.map((t, i) => (i === prev.length - 1 ? { ...t, response } : t))
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : "Something went wrong";
      setTurns((prev) =>
        prev.map((t, i) => (i === prev.length - 1 ? { ...t, error } : t))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-gradient-bg min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
      <div className="flex flex-col w-full max-w-3xl h-[85vh] rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
        <header className="px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <h1 className="text-lg font-semibold tracking-tight text-white">ClinicalAgent</h1>
          <p className="text-sm text-white/50 mt-0.5">
            Ask a clinical question, get an evidence-based answer with PubMed citations.
          </p>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {turns.length === 0 && (
            <p className="text-sm text-white/40 mt-8 text-center italic">
              e.g. &quot;What is the first-line treatment for community-acquired pneumonia?&quot;
            </p>
          )}

          {turns.map((turn, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-end">
                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl px-4 py-2.5 max-w-[80%] shadow-lg shadow-teal-950/30">
                  {turn.question}
                </div>
              </div>

              {turn.response && (
                <div className="flex justify-start">
                  <div className="border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl px-4 py-3.5 max-w-[85%] space-y-3 text-white/90">
                    <p className="whitespace-pre-wrap">{turn.response.answer}</p>

                    {turn.response.citations.length > 0 && (
                      <ol className="text-xs text-white/50 space-y-1 border-t border-white/10 pt-2">
                        {turn.response.citations.map((c) => (
                          <li key={c.index}>
                            [{c.index}]{" "}
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 underline decoration-cyan-300/30 hover:text-cyan-200"
                            >
                              {c.title}
                            </a>
                            {c.authors.length > 0 && ` — ${c.authors.join(", ")}`}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              )}

              {turn.error && (
                <div className="flex justify-start">
                  <div className="border border-red-500/30 bg-red-500/5 text-red-300 rounded-2xl px-4 py-2 max-w-[85%] text-sm">
                    {turn.error}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 border border-white/10 bg-white/[0.03] rounded-2xl px-4 py-3.5">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ animationDelay: "0ms" }} />
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ animationDelay: "200ms" }} />
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ animationDelay: "400ms" }} />
              </div>
            </div>
          )}
        </main>

        <form
          onSubmit={handleSubmit}
          className="px-6 py-4 border-t border-white/10 bg-white/[0.02]"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a clinical question…"
              disabled={loading}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-cyan-400/50 focus:bg-white/[0.07] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-5 py-2.5 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/20 transition-shadow"
            >
              Send
            </button>
          </div>
          <p className="text-center text-[10px] uppercase tracking-widest text-white/25 pt-3">
            Powered by LangGraph · Groq · PubMed
          </p>
        </form>
      </div>
    </div>
  );
}
