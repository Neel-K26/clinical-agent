from typing import Any, Dict, List, TypedDict
from langchain_core.messages import BaseMessage


class AgentState(TypedDict, total=False):
    question: str
    messages: List[BaseMessage]
    search_results: List[Dict[str, Any]]
    answer: str
    citations: List[Dict[str, Any]]
    steps: int
    _search_query: str
    _verdict: str
