from fastapi import FastAPI

app = FastAPI(
    title="StudyPilot API",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Welcome to StudyPilot API"
    }