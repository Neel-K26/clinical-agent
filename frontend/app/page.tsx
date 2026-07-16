"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
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
    <div className="relative min-h-screen w-full">
      <div className="fixed inset-0 -z-10">
        <Image src="/aero-bg.webp" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/55 via-sky-950/15 to-transparent" />
      </div>

      <div className="relative flex flex-col min-h-screen">
        <header className="pt-14 pb-6 px-4 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight drop-shadow-[0_2px_16px_rgba(0,40,90,0.55)]">
            ClinIQ
          </h1>
          <p className="mt-2 text-lg sm:text-xl font-medium text-white drop-shadow-[0_1px_8px_rgba(0,40,90,0.5)]">
            Ask clinical. Get cited.
          </p>
          <p className="mt-1 text-sm text-white/85 drop-shadow-[0_1px_6px_rgba(0,40,90,0.5)]">
            Evidence-based answers with PubMed citations.
          </p>
        </header>

        <div className="flex-1 flex justify-center px-4 pb-8">
          <div className="glass-aero flex flex-col w-full max-w-3xl h-[65vh] rounded-3xl overflow-hidden">
            <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {turns.length === 0 && (
                <p className="text-sm text-slate-600 mt-8 text-center italic">
                  e.g. &quot;What is the first-line treatment for community-acquired pneumonia?&quot;
                </p>
              )}

              {turns.map((turn, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-end">
                    <div className="aero-gloss bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-2xl px-4 py-2.5 max-w-[80%] shadow-lg shadow-sky-900/30">
                      {turn.question}
                    </div>
                  </div>

                  {turn.response && (
                    <div className="flex justify-start">
                      <div className="border border-white/70 bg-white/40 backdrop-blur-sm rounded-2xl px-4 py-3.5 max-w-[85%] space-y-3 text-slate-800 shadow-sm">
                        <p className="whitespace-pre-wrap">{turn.response.answer}</p>

                        {turn.response.citations.length > 0 && (
                          <ol className="text-xs text-slate-600 space-y-1 border-t border-slate-900/10 pt-2">
                            {turn.response.citations.map((c) => (
                              <li key={c.index}>
                                [{c.index}]{" "}
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-700 underline decoration-sky-700/30 hover:text-sky-900"
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
                      <div className="border border-red-400/50 bg-red-50/60 text-red-700 rounded-2xl px-4 py-2 max-w-[85%] text-sm">
                        {turn.error}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 border border-white/70 bg-white/40 rounded-2xl px-4 py-3.5">
                    <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-sky-600" style={{ animationDelay: "0ms" }} />
                    <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-sky-600" style={{ animationDelay: "200ms" }} />
                    <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-sky-600" style={{ animationDelay: "400ms" }} />
                  </div>
                </div>
              )}
            </main>

            <form
              onSubmit={handleSubmit}
              className="px-6 py-4 border-t border-white/60 bg-white/20"
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a clinical question…"
                  disabled={loading}
                  className="flex-1 rounded-full border border-white/70 bg-white/50 px-4 py-2.5 text-slate-800 placeholder-slate-500 outline-none focus:border-sky-500 focus:bg-white/70 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="aero-gloss rounded-full bg-gradient-to-r from-sky-400 to-blue-500 text-white px-5 py-2.5 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-sky-500/30 transition-shadow"
                >
                  Send
                </button>
              </div>
              <p className="text-center text-[10px] uppercase tracking-widest text-slate-600/70 pt-3">
                Powered by LangGraph · Groq · PubMed
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
