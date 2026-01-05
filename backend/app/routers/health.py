from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import time
from ..database import get_db

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/ready")
async def health_ready(db: Session = Depends(get_db)):
    start = time.time()
    try:
        db.execute(text("SELECT 1"))
        latency = (time.time() - start) * 1000
        database_status = "healthy"
    except Exception as e:
        database_status = "unhealthy"
        latency = 0.0
        # In a real app, you might want to log the error 'e' here

    return {
        "status": "healthy" if database_status == "healthy" else "unhealthy",
        "checks": {
            "database": {
                "status": database_status,
                "latency_ms": round(latency, 2)
            }
        }
    }
