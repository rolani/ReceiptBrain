"""ReceiptBrain AI service FastAPI app."""

from __future__ import annotations

import base64
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse

from . import openai_client
from .schemas import (
    ExtractRequest,
    ExtractResponse,
    RecommendRequest,
    RecommendResponse,
    Usage,
)
from .settings import get_settings

INTERNAL_TOKEN_HEADER = "X-Internal-Token"


def _require_internal_token(request: Request) -> None:
    settings = get_settings()
    provided = request.headers.get(INTERNAL_TOKEN_HEADER)
    if provided != settings.ai_service_token:
        raise HTTPException(status_code=401, detail={"error": "unauthorized"})


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="ReceiptBrain AI", version="0.0.0")

    @app.exception_handler(HTTPException)
    async def _format_http(_req: Request, exc: HTTPException) -> JSONResponse:
        body = exc.detail if isinstance(exc.detail, dict) else {"error": str(exc.detail)}
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.get("/health")
    def health() -> dict[str, object]:
        return {
            "ok": True,
            "service": "ai",
            "model_extract": settings.openai_model_extract,
            "model_recommend": settings.openai_model_recommend,
            "prompt_versions": {
                "extract": settings.prompt_version_extract,
                "recommend": settings.prompt_version_recommend,
            },
        }

    @app.post("/extract", response_model=ExtractResponse)
    async def extract(req: ExtractRequest, request: Request) -> Any:
        _require_internal_token(request)
        try:
            image_bytes = base64.b64decode(req.image_b64)
        except Exception as e:
            raise HTTPException(
                status_code=400, detail={"error": "bad_image", "message": str(e)}
            ) from e

        prompt_version = req.promptVersion or settings.prompt_version_extract
        try:
            payload, usage = await openai_client.call_extract(
                image_bytes, prompt_version=prompt_version
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={"error": "upstream_error", "message": str(e)},
            ) from e

        payload.pop("_durationMs", None)
        return ExtractResponse(
            **payload,
            model=settings.openai_model_extract,
            promptVersion=prompt_version,
            usage=Usage(**usage),
        )

    @app.post("/recommend", response_model=RecommendResponse)
    async def recommend(req: RecommendRequest, request: Request) -> Any:
        _require_internal_token(request)
        prompt_version = settings.prompt_version_recommend
        try:
            items, usage = await openai_client.call_recommend(
                req.model_dump(), prompt_version=prompt_version
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={"error": "upstream_error", "message": str(e)},
            ) from e

        return RecommendResponse(
            items=items,
            model=settings.openai_model_recommend,
            promptVersion=prompt_version,
            usage=Usage(**usage),
        )

    return app


app = create_app()
