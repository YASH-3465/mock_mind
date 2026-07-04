from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.api.analysis import router as analysis_router

app = FastAPI(
    title="Mock Mind API",
    description="AI-Powered Interview Platform",
    version="1.0.0"
)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(resume_router)
app.include_router(analysis_router)

@app.get("/")
def home():
    return {
        "status": "success",
        "message": "Welcome to Mock Mind 🚀"
    }