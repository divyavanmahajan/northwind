from fastapi import FastAPI
from .config import settings

app = FastAPI(
    title="Northwind API",
    debug=settings.DEBUG
)

@app.on_event("startup")
async def startup_event():
    # Mask password in logs
    masked_url = settings.DATABASE_URL.replace(settings.DB_PASSWORD, "********")
    print(f"Starting Northwind API with DB: {masked_url}")

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Northwind API",
        "version": "0.1.0"
    }
