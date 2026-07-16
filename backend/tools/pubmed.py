import os
from typing import Any, Dict, List

from Bio import Entrez

Entrez.email = os.getenv("ENTREZ_EMAIL", "")
_api_key = os.getenv("ENTREZ_API_KEY")
if _api_key:
    Entrez.api_key = _api_key


def search_pubmed(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """Search PubMed for a query and return article metadata with abstracts."""
    try:
        with Entrez.esearch(db="pubmed", term=query, retmax=max_results, sort="relevance") as handle:
            search_results = Entrez.read(handle)

        pmids = search_results.get("IdList", [])
        if not pmids:
            return []

        with Entrez.efetch(db="pubmed", id=pmids, rettype="abstract", retmode="xml") as handle:
            records = Entrez.read(handle)

        return [_parse_article(article) for article in records.get("PubmedArticle", [])]
    except Exception:
        return []


def _parse_article(article: Dict[str, Any]) -> Dict[str, Any]:
    medline = article["MedlineCitation"]
    pmid = str(medline["PMID"])
    article_data = medline["Article"]

    title = str(article_data.get("ArticleTitle", ""))

    abstract_parts = article_data.get("Abstract", {}).get("AbstractText", [])
    abstract = " ".join(str(part) for part in abstract_parts)

    authors = []
    for author in article_data.get("AuthorList", []):
        last = author.get("LastName", "")
        initials = author.get("Initials", "")
        if last:
            authors.append(f"{last} {initials}".strip())

    return {
        "pmid": pmid,
        "title": title,
        "authors": authors,
        "abstract": abstract,
        "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
    }
