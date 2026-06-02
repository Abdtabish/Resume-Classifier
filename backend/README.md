# Resume Field Classifier — Backend API

Production-ready FastAPI backend for PDF resume upload, text extraction, ML inference, and batch JSON responses for the Next.js frontend.

## Project structure

```text
backend/
├── app/
│   ├── main.py                 # FastAPI app + CORS + lifespan model load
│   ├── api/
│   │   ├── routes.py           # /health, /classify, /classify-resumes, ...
│   │   └── deps.py             # Dependency injection
│   ├── core/
│   │   ├── config.py           # Environment settings
│   │   ├── errors.py           # JSON error handlers
│   │   └── logging.py
│   ├── ml/
│   │   ├── inference.py        # HuggingFace model load + predict
│   │   └── loader.py           # label_mapping.json loader
│   ├── services/
│   │   └── classification.py   # PDF -> text -> predict pipeline
│   ├── schemas/
│   │   └── responses.py        # Pydantic response models
│   └── utils/
│       ├── pdf.py              # PDF text extraction (pypdf)
│       └── preprocessing.py    # Text cleaning + preview
├── requirements.txt
├── .env.example
└── README.md
```

## Model artifacts

Drop your Colab exports into `../model/` (repo root `model/` folder):

- `config.json`
- `model.safetensors` (or `pytorch_model.bin`)
- `tokenizer.json` / `tokenizer_config.json`
- `label_mapping.json` — maps `LABEL_0` → human-readable classes (e.g. `ENGINEERING`)

If label order differs from training, update `label_mapping.json` to match your `LabelEncoder.classes_` from Colab.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend env:

```env
NEXT_PUBLIC_CLASSIFIER_API_URL=http://localhost:8000
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service + model load status |
| GET | `/model-info` | Available prediction classes |
| POST | `/classify-resumes` | Batch PDF classification |
| POST | `/classify` | Alias for frontend compatibility |
| POST | `/classify-text` | Predict from plain text (testing) |

### Upload format

`multipart/form-data` with field name **`files`** (one or many PDFs).

```bash
curl -X POST "http://localhost:8000/classify" \
  -F "files=@resume1.pdf" \
  -F "files=@resume2.pdf"
```

### Example response

```json
{
  "results": [
    {
      "fileName": "resume1.pdf",
      "prediction": "ENGINEERING",
      "confidence": 86.71,
      "textPreview": "engineering lab technician ...",
      "status": "processed",
      "error": null
    }
  ],
  "summary": {
    "totalFiles": 1,
    "processed": 1,
    "failed": 0
  }
}
```

### Plain text test

```bash
curl -X POST "http://localhost:8000/classify-text" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"software engineer with python and machine learning experience\"}"
```

## Behavior

- Validates PDF-only uploads and rejects empty/oversized files
- Extracts text per file; one failure does not stop the batch
- Returns structured per-file `processed` / `failed` status
- CORS enabled for Next.js dev server
- Logs validation, extraction, and inference steps
