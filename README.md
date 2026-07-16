# ClinicalAgent

> Production agentic pipeline for clinical reasoning over medical literature.  
> Built with LangGraph · Gemini Flash · PubMed API · FastAPI · Next.js

---

## What this is

ClinicalAgent is a multi-step reasoning agent that answers clinical questions using real PubMed literature. It doesn't just retrieve — it plans, searches, synthesizes, and self-reflects before returning an answer.

---

## Agent architecture

```
User Question
     │
     ▼
┌─────────────┐
│  Understand │  Reformulates question into precise PubMed MeSH query
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Search    │  Calls PubMed API (Entrez), fetches top 5 abstracts
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Synthesize  │  LLM synthesizes cited answer from retrieved context only
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Reflect   │  Agent self-checks: grounded? on-topic? hallucination-free?
└──────┬──────┘
       │
  RETRY if poor        END if good
       │                    │
       └────────────────────┘
```

### Key agentic concepts demonstrated

| Concept | Where |
|---|---|
| ReAct loop | understand → search → synthesize → reflect → retry |
| Tool calling | `tools/pubmed.py` — structured PubMed API wrapper |
| Short-term memory | `AgentState` carries full message history across nodes |
| Self-reflection | `reflect_node` — agent critiques its own output |
| Conditional edges | `should_retry` — agent decides whether to loop |
| Structured output | Pydantic response model with citations |

---

## Stack

| Layer | Technology |
|---|---|
| Agent framework | LangGraph 0.1.x |
| LLM | Gemini 1.5 Flash |
| Literature search | PubMed via Biopython Entrez |
| Backend | FastAPI + Uvicorn |
| Frontend | Next.js 14 + TypeScript |
| Evaluation | RAGAS (faithfulness, answer relevancy) |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Project structure

```
clinical-agent/
├── backend/
│   ├── agents/
│   │   ├── state.py          # LangGraph AgentState TypedDict
│   │   └── clinical_agent.py # Graph definition + all nodes
│   ├── tools/
│   │   └── pubmed.py         # PubMed Entrez search tool
│   ├── api/
│   │   └── routes.py         # FastAPI endpoints
│   ├── eval/                 # RAGAS evaluation scripts
│   ├── main.py               # FastAPI app + CORS
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── lib/
│       │   └── api.ts        # Single API client (no hardcoded URLs)
│       ├── components/
│       └── app/
└── README.md
```

---

## Local setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in GEMINI_API_KEY and ENTREZ_EMAIL

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install

cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

npm run dev
```

---

## Deployment

### Backend → Render
1. Push to GitHub
2. New Web Service → connect repo → `backend/` root
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env vars: `GEMINI_API_KEY`, `ENTREZ_EMAIL`

### Frontend → Vercel
1. Import repo → `frontend/` root
2. **Add env var in Vercel dashboard:**
   `NEXT_PUBLIC_API_URL` = `https://your-render-app.onrender.com/api`
3. Deploy

> Never hardcode the backend URL in code. Always use `NEXT_PUBLIC_API_URL`.

---

## Why environment variables matter

OmniRAG-style NetworkError happens when Next.js bakes the backend URL at build time. The fix: all API calls go through `src/lib/api.ts` which reads `process.env.NEXT_PUBLIC_API_URL` at runtime. Set this in the Vercel dashboard, never in committed code.

---

## Evaluation (RAGAS)

```bash
cd backend
python eval/run_eval.py
```

Metrics tracked:
- **Faithfulness** — is the answer grounded in retrieved context?
- **Answer relevancy** — does the answer address the question?
- **Context recall** — did we retrieve what was needed?

---

*Built by Neel Khairnar — github.com/Neel-K26*
