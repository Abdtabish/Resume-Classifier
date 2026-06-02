from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base application error with HTTP status."""

    def __init__(self, message: str, status_code: int = 400, code: str = "app_error"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class ModelNotLoadedError(AppError):
    def __init__(self, message: str = "Model is not loaded. Check server logs."):
        super().__init__(message, status_code=503, code="model_not_loaded")


def error_payload(message: str, code: str, details: dict | None = None) -> dict:
    payload: dict = {"error": {"message": message, "code": code}}
    if details:
        payload["error"]["details"] = details
    return payload


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_payload(exc.message, exc.code),
    )


async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    message = detail if isinstance(detail, str) else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content=error_payload(message, "http_error"),
    )


async def validation_exception_handler(
    _: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=error_payload(
            "Invalid request payload",
            "validation_error",
            details={"errors": exc.errors()},
        ),
    )
