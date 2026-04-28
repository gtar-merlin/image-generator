# DiagGen (initial implementation slice)

This is the first runnable implementation of the planned AI diagram generator.

## What is implemented
- Web app + API in one Node/Express service.
- Provider abstraction with three adapters:
  - `mock` (works end-to-end now)
  - `openai` (implemented with Chat Completions JSON output)
  - `anthropic` (stub wired)
- DiagramSpec JSON schema validation (AJV).
- Deterministic SVG renderer from DiagramSpec.
- Storage of:
  - original prompt
  - refined prompt
  - generated spec
  - compiled JS (generated from spec)
  - provider/model metadata
- Local file persistence in `data/local-db.json`.
- API endpoints:
  - `POST /api/diagrams/generate`
  - `GET /api/diagrams/:id`
  - `GET /api/diagrams/:id/html`
  - `GET /api/diagrams/:id/image`
  - `GET /api/diagrams/history`

## Current limitation
- The image endpoint returns SVG (`image/svg+xml`) in this initial slice.
- PNG/JPG export worker is the next step (headless Chromium or SVG rasterization worker).

## Run
1. Copy `.env.example` to `.env` and keep `LLM_PROVIDER=mock`.
2. Install deps:
   - `npm install`
3. Start:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

### Use OpenAI provider
- Set in `.env`:
  - `LLM_PROVIDER=openai`
  - `OPENAI_API_KEY=...`
  - optional `OPENAI_MODEL=gpt-4o-mini`

## Postgres path (prepared)
- A starter schema is included at `sql/schema.postgres.sql`.
- Current prototype persists to local JSON for quick validation.
- Next step is swapping `src/db/storage.js` to a Postgres repository.

