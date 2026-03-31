import sys
import os
import traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app_real import *  # Import all globals such as _get_movies_df
    from app_real import app # Import the real ASGI FastAPI app
except Exception as e:
    err_text = traceback.format_exc()
    import fastapi
    from fastapi import FastAPI, Request
    from fastapi.responses import PlainTextResponse
    
    app = FastAPI()
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
    def catch_all(path: str, request: Request):
        return PlainTextResponse(err_text, status_code=500)
    
    def _get_movies_df():
        return None
