from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.api.analysis import router as analysis_router
from app.api.interview import router as interview_router
from app.api.interview_answer import router as interview_answer_router
from app.db import base

app = FastAPI(
    title="Mock Mind API",
    description="AI-Powered Interview Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://z69fvbnv-5173.inc1.devtunnels.ms/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(resume_router)
app.include_router(analysis_router)
app.include_router(interview_router)
app.include_router(interview_answer_router)

@app.get("/")
def home():
    return {
        "status": "success",
        "message": "Welcome to Mock Mind 🚀"
    }