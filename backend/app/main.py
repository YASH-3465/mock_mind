from fastapi import FastAPI
from app.api.auth import router as auth_router

app = FastAPI(
    title="Mock Mind API",
    description="AI-Powered Interview Platform",
    version="1.0.0"
)
app.include_router(auth_router)

@app.get("/")
def home():
    return {
        "status": "success",
        "message": "Welcome to Mock Mind 🚀"
    }