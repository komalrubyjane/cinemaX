from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.middleware("http")
async def rewrite_vercel_paths(request, call_next):
    if request.scope["path"].startswith("/api/ai/"):
        request.scope["path"] = request.scope["path"].replace("/api/ai/", "/api/", 1)
    return await call_next(request)

@app.get("/api/health")
def health():
    return JSONResponse({"status": "minimal alive config test"})
