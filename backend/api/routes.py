from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents.clinical_agent import clinical_agent

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


class Citation(BaseModel):
    index: int
    title: str
    authors: List[str]
    pmid: str
    url: str


class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    steps: int


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="question must not be empty")

    result = clinical_agent.invoke({
        "question": request.question,
        "messages": [],
        "search_results": [],
        "citations": [],
        "answer": "",
        "steps": 0,
    })

    return QueryResponse(
        answer=result["answer"],
        citations=result["citations"],
        steps=result["steps"],
    )
