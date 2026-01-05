from fastapi import FastAPI

app = FastAPI(title="Northwind API")

@app.get("/")
async def root():
    return {"message": "Welcome to Northwind API"}
