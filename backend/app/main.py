from fastapi import FastAPI

app = FastAPI(
    title="Mock Mind API",
    description="AI-Powered Interview Platform",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "status": "success",
        "message": "Welcome to Mock Mind 🚀"
    }