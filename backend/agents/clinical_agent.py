from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from agents.state import AgentState
from tools.pubmed import search_pubmed
import os


llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-lite",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.2,
    max_retries=1,
)


# ── Node 1: understand the question ──────────────────────────────────────────
def understand_node(state: AgentState) -> AgentState:
    """Reformulate the clinical question for better PubMed search."""
    prompt = f"""You are a clinical AI assistant. 
A user asked: "{state['question']}"

Reformulate this as a precise PubMed search query (max 8 words, 
use MeSH terms where possible). Return ONLY the search query, nothing else."""

    response = llm.invoke([HumanMessage(content=prompt)])
    search_query = response.content.strip()

    return {
        **state,
        "messages": state["messages"] + [
            HumanMessage(content=state["question"]),
            AIMessage(content=f"Searching PubMed for: {search_query}")
        ],
        "steps": state.get("steps", 0) + 1,
        "_search_query": search_query
    }


# ── Node 2: search PubMed ────────────────────────────────────────────────────
def search_node(state: AgentState) -> AgentState:
    """Call PubMed tool and store results."""
    query = state.get("_search_query", state["question"])
    results = search_pubmed(query, max_results=5)

    return {
        **state,
        "search_results": results,
        "messages": state["messages"] + [
            AIMessage(content=f"Found {len(results)} relevant articles.")
        ],
        "steps": state["steps"] + 1
    }


# ── Node 3: synthesize answer ────────────────────────────────────────────────
def synthesize_node(state: AgentState) -> AgentState:
    """Synthesize a cited clinical answer from search results."""
    articles = state["search_results"]

    context = "\n\n".join([
        f"[{i+1}] {a['title']}\nAuthors: {', '.join(a['authors'])}\n{a['abstract']}"
        for i, a in enumerate(articles)
        if a.get("abstract")
    ])

    prompt = f"""You are a clinical AI assistant. Using ONLY the provided articles, 
answer the clinical question with evidence-based reasoning.

Question: {state['question']}

Articles:
{context}

Instructions:
- Answer in 3-5 sentences
- Cite articles using [1], [2] etc
- State uncertainty where evidence is limited
- Do NOT add information beyond the articles

Answer:"""

    response = llm.invoke([HumanMessage(content=prompt)])
    answer = response.content.strip()

    citations = [
        {
            "index": i + 1,
            "title": a["title"],
            "authors": a["authors"],
            "pmid": a["pmid"],
            "url": a["url"]
        }
        for i, a in enumerate(articles)
        if a.get("title")
    ]

    return {
        **state,
        "answer": answer,
        "citations": citations,
        "messages": state["messages"] + [AIMessage(content=answer)],
        "steps": state["steps"] + 1
    }


# ── Node 4: reflect and check ────────────────────────────────────────────────
def reflect_node(state: AgentState) -> AgentState:
    """Agent self-reflects: is the answer grounded? Should we re-search?"""
    prompt = f"""You are a clinical AI quality checker.

Question: {state['question']}
Answer: {state['answer']}

Is this answer:
1. Directly addressing the question? (yes/no)
2. Grounded in the provided context? (yes/no)
3. Free of hallucinations? (yes/no)

Reply with ONLY: GOOD or RETRY"""

    response = llm.invoke([HumanMessage(content=prompt)])
    verdict = response.content.strip().upper()

    return {
        **state,
        "_verdict": verdict,
        "steps": state["steps"] + 1
    }


# ── Conditional edge ─────────────────────────────────────────────────────────
def should_retry(state: AgentState) -> str:
    if state.get("_verdict") == "RETRY" and state["steps"] < 8:
        return "search"
    return "end"


# ── Build the graph ──────────────────────────────────────────────────────────
def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("understand", understand_node)
    graph.add_node("search", search_node)
    graph.add_node("synthesize", synthesize_node)
    graph.add_node("reflect", reflect_node)

    graph.set_entry_point("understand")
    graph.add_edge("understand", "search")
    graph.add_edge("search", "synthesize")
    graph.add_edge("synthesize", "reflect")
    graph.add_conditional_edges(
        "reflect",
        should_retry,
        {"search": "search", "end": END}
    )

    return graph.compile()


clinical_agent = build_graph()
