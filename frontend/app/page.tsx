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
    <div className="flex flex-col h-screen max-w-3xl mx-auto w-full">
      <header className="px-6 py-4 border-b border-black/10 dark:border-white/10">
        <h1 className="text-lg font-semibold">ClinicalAgent</h1>
        <p className="text-sm opacity-60">
          Ask a clinical question, get an evidence-based answer with PubMed citations.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {turns.length === 0 && (
          <p className="text-sm opacity-50 mt-8 text-center">
            e.g. &quot;What is the first-line treatment for community-acquired pneumonia?&quot;
          </p>
        )}

        {turns.map((turn, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-foreground text-background rounded-2xl px-4 py-2 max-w-[80%]">
                {turn.question}
              </div>
            </div>

            {turn.response && (
              <div className="flex justify-start">
                <div className="border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 max-w-[85%] space-y-3">
                  <p className="whitespace-pre-wrap">{turn.response.answer}</p>

                  {turn.response.citations.length > 0 && (
                    <ol className="text-xs opacity-70 space-y-1 border-t border-black/10 dark:border-white/10 pt-2">
                      {turn.response.citations.map((c) => (
                        <li key={c.index}>
                          [{c.index}]{" "}
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:opacity-80"
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
                <div className="border border-red-500/30 text-red-500 rounded-2xl px-4 py-2 max-w-[85%] text-sm">
                  {turn.error}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="border border-black/10 dark:border-white/10 rounded-2xl px-4 py-2 text-sm opacity-60">
              Thinking…
            </div>
          </div>
        )}
      </main>

      <form
        onSubmit={handleSubmit}
        className="px-6 py-4 border-t border-black/10 dark:border-white/10 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a clinical question…"
          disabled={loading}
          className="flex-1 rounded-full border border-black/10 dark:border-white/10 px-4 py-2 bg-transparent outline-none focus:border-black/30 dark:focus:border-white/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-foreground text-background px-5 py-2 font-medium disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
