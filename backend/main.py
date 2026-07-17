from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="ClinIQ API",
    description="Agentic clinical reasoning over medical literature",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    # TODO: scope this down to the real deployed frontend origin(s) before shipping.
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "service": "ClinIQ"}
