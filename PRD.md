# Product Requirements Document (PRD): Diagram Generation (V1)

## 1) Overview
Build a web app and API where a user describes a diagram in natural language, the system generates a renderable diagram (preferably via a validated intermediate spec compiled into deterministic rendering code), provides an interactive HTML preview, renders an exportable PNG/JPG, and stores prompts + generated outputs for audit and reuse.

## 2) Goals
- **Fast path to “usable diagram”** from a single prompt.
- **Preview + export parity**: what the user sees in preview matches PNG/JPG export.
- **Auditability**: persist original prompt, refined prompt, provider metadata, and generated spec/code.
- **Provider-agnostic**: LLM provider abstraction; enable only 1–2 providers initially.

## 3) Non-goals (V1)
- Running arbitrary, unrestricted AI-generated JS in a privileged server runtime.
- Real-time collaboration, comments, or team workspaces.
- Template marketplace, public gallery, or social features.
- First-class local-LLM support (design for later via abstraction).

## 4) Personas
- **Educator**: needs labeled math/CS diagrams quickly (accuracy + legibility).
- **Writer/Creator**: needs diagrams for blog posts/docs (export quality + ease).
- **Engineer**: wants diagrams for README/runbooks (API + automation).

## 5) Core user stories
- As a user, I can enter a diagram prompt and get a preview.
- As a user, I can download the rendered diagram as PNG (JPG optional).
- As a user, I can reopen previously generated diagrams.
- As a developer, I can generate diagrams through an API and fetch artifacts programmatically.
- As an admin/operator, I can see failures and trace generation/export steps.

## 6) Functional requirements
### 6.1 Web app
- Prompt input with optional settings: width/height, theme (light/dark), background, output format.
- Preview page that shows status (generating/validating/rendering/exporting/failed/succeeded).
- History page listing prior diagrams with open/download.

### 6.2 API
- `POST /api/diagrams/generate`: creates a diagram request and starts generation.
- `GET /api/diagrams/:id`: returns state + metadata.
- `GET /api/diagrams/:id/html`: returns preview payload (or a signed URL if stored).
- `GET /api/diagrams/:id/image`: returns image artifact (or signed URL).
- `GET /api/diagrams/history`: returns recent items (scoped by user).

### 6.3 Generation pipeline
Pipeline stages (minimum):
- prompt normalization/refinement
- provider call (LLM)
- validation (schema and safety checks)
- preview render (HTML payload)
- export render (PNG; JPG optional)
- persistence of prompts and outputs

### 6.4 Provider abstraction
Support:
- multiple providers behind a single interface
- model selection and per-provider config
- retries/timeouts
- structured metadata capture (latency, usage, cost when available)

### 6.5 Persistence
Store:
- original prompt and refined/system prompt
- provider + model identifiers
- raw provider response (or redacted equivalent)
- validated DiagramSpec and/or generated code
- validation result with reason codes
- artifact records (html, png/jpg) with dimensions, checksum, storage keys

## 7) Non-functional requirements
### 7.1 Performance (initial targets)
- Preview-ready: median < 10s (provider-dependent; best effort).
- PNG-ready: median < 20s (async allowed).

### 7.2 Reliability
- Export pipeline succeeds for valid specs at high rate; transient failures retried.
- Clear user-facing errors when a request cannot be fulfilled.

### 7.3 Security
- Treat all model outputs as untrusted.
- Prefer spec/DSL generation over arbitrary JS generation.
- If any JS execution is allowed, sandbox with strict allowlists, timeouts, and no network by default.

### 7.4 Observability
- Trace diagramId across: API -> provider -> validation -> preview -> export -> storage.
- Capture error classes: provider_error, validation_error, render_error, export_error.

## 8) Success metrics
- **Preview success rate** on a fixed prompt suite.
- **Export success rate** (PNG produced and downloadable).
- **Human-rated quality** (1–5 rubric: correctness, legibility, aesthetics).
- **Latency** (median/p95 to preview/export).
- **Cost per diagram** (tokens/$).

## 9) Risks & mitigations
- **Unsafe output**: mitigate via spec/DSL, schema validation, sandboxing.
- **Quality variance**: mitigate via prompt templates, few-shot examples, fallback provider rules.
- **Preview/export mismatch**: mitigate via deterministic renderer and versioned spec.
- **Abuse/cost blowups**: mitigate via rate limits, quotas, size caps, caching/dedup.

## 10) V1 acceptance criteria (Definition of Done)
- Web app supports prompt -> preview -> PNG download end-to-end.
- API endpoints documented and working for generate + fetch + artifact retrieval.
- DB stores prompts and generated outputs with provider metadata.
- Provider abstraction exists and at least one provider is enabled.
- Validation prevents unsafe/invalid outputs from reaching the renderer.

