# Resume Classifier

A full-stack AI project that classifies uploaded resume PDFs into predefined job-domain categories using a fine-tuned Transformer model.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Pydantic, Uvicorn
- **ML/Inference:** Hugging Face Transformers, PyTorch
- **Document Parsing:** pypdf

## Project Structure

```text
Resume-classifier/
|- backend/      # FastAPI API for upload, extraction, and prediction
|- frontend/     # Next.js web UI
|- model/        # Model/tokenizer/label mapping artifacts
|- data/         # Dataset and data files (ignored for git)
`- .gitignore
```

## Features

- Upload one or multiple PDF resumes
- Batch classification with per-file status
- Confidence score and text preview in response
- Health and model information endpoints
- Frontend UI for drag-and-drop upload and results display

## Prerequisites

- Python 3.10+ (recommended)
- Node.js 18+ and npm

## Local Setup

### 1) Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`

### 2) Frontend

Open a new terminal:

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

## Environment Variables

### Backend (`backend/.env`)

Use `backend/.env.example` as reference. Important fields:

- `HOST`
- `PORT`
- `CORS_ORIGINS`
- `MODEL_DIR`
- `LABEL_MAPPING_PATH`
- `MAX_UPLOAD_SIZE_MB`

### Frontend (`frontend/.env.local`)

- `NEXT_PUBLIC_CLASSIFIER_API_URL=http://localhost:8000`

## API Endpoints

- `GET /health` - Service and model status
- `GET /model-info` - Available classes/metadata
- `POST /classify` - Upload PDFs and classify
- `POST /classify-resumes` - Alias endpoint for batch classification
- `POST /classify-text` - Test prediction with plain text

## Model Files

Place model artifacts inside `model/` (or point env paths accordingly):

- `config.json`
- `tokenizer.json`
- `tokenizer_config.json`
- `label_mapping.json`
- `model.safetensors` or `pytorch_model.bin`

## Git Notes

Large/generated files are excluded via `.gitignore` (for example `model/` and dataset files).  
Commit only source code and configuration templates such as `.env.example`.

## License

Add your preferred license here (MIT, Apache-2.0, etc.).
