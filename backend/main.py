from dotenv import load_dotenv

load_dotenv()  # MUST be before other imports that use os.getenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.demo import router as demo_router

app = FastAPI(title="Job Explain Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(demo_router, prefix="/api")


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Welcome to Job Explain Copilot API"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
