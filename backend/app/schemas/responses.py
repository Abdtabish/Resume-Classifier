from typing import Literal

from pydantic import BaseModel, Field

ResultStatus = Literal["processed", "failed", "queued"]


class ResumeResultItem(BaseModel):
    fileName: str
    prediction: str | None = None
    confidence: float | None = None
    textPreview: str | None = None
    status: ResultStatus
    error: str | None = None


class SummaryStats(BaseModel):
    totalFiles: int
    processed: int
    failed: int


class ClassifyResponse(BaseModel):
    results: list[ResumeResultItem]
    summary: SummaryStats


class HealthResponse(BaseModel):
    status: str
    modelLoaded: bool
    modelPath: str | None = None
    numClasses: int | None = None


class ModelInfoResponse(BaseModel):
    modelType: str
    modelDir: str
    classes: list[str]
    labelMappingPath: str | None = None


class ClassifyTextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000)


class ClassifyTextResponse(BaseModel):
    prediction: str
    confidence: float
    textPreview: str
