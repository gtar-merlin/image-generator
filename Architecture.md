# Technical Architecture (V1)

## Summary
V1 is a managed-cloud-first web app + API that turns a user prompt into a validated `DiagramSpec`, renders an interactive HTML preview, exports PNG/JPG, stores prompts and artifacts, and supports multiple LLM providers behind an abstraction layer (enable 1–2 initially).

## Key design decisions
- **Rendering contract**: LLM outputs `DiagramSpec` (JSON) validated by schema; system renders deterministically.
- **Provider abstraction**: adapters for OpenAI/Anthropic/etc. behind a single interface.
- **Async export**: image rendering happens out-of-band (job queue/worker) to keep API responsive.
- **Untrusted output handling**: treat provider output as untrusted; validate before any render.

## Component diagram
```mermaid
flowchart TD
    User[User] --> WebApp[WebApp]
    WebApp --> Api[API]
    Api --> Orchestrator[PromptOrchestrator]
    Orchestrator --> ProviderRouter[LLMProviderRouter]
    ProviderRouter --> ProviderA[ProviderAdapterA]
    ProviderRouter --> ProviderB[ProviderAdapterB]
    Api --> Validator[SpecValidator]
    Api --> PreviewRenderer[PreviewRenderer]
    Api --> JobQueue[JobQueue]
    JobQueue --> ExportWorker[ExportWorker]
    ExportWorker --> ObjectStore[ObjectStorage]
    Api --> DB[(PostgreSQL)]
    WebApp --> ObjectStore
```

## Sequence (generate -> preview -> export)
```mermaid
sequenceDiagram
    participant U as User
    participant W as WebApp
    participant A as API
    participant O as PromptOrchestrator
    participant P as ProviderAdapter
    participant V as SpecValidator
    participant Q as JobQueue
    participant X as ExportWorker
    participant S as ObjectStorage
    participant D as Postgres

    U->>W: Enter prompt + settings
    W->>A: POST /api/diagrams/generate
    A->>D: Insert diagram_request (status=queued)
    A->>O: Build refined prompt + schema instructions
    O->>P: Generate DiagramSpec
    P-->>O: Provider response
    O-->>A: Candidate DiagramSpec + metadata
    A->>V: Validate DiagramSpec
    alt valid
        A->>D: Insert generation + store refined prompt, spec
        A-->>W: 202/200 with diagramId + preview payload
        A->>Q: Enqueue export job
        Q->>X: Run export
        X->>S: Write PNG/JPG artifacts
        X->>D: Update artifacts + status=ready
    else invalid
        A->>D: Store failure + reason codes
        A-->>W: Error with validation diagnostics
    end
```

## API responsibilities
- Authenticate user (MVP+ if public).
- Create and track `diagram_request` state machine.
- Orchestrate provider calls and retries (with timeouts).
- Validate spec and reject unsafe/unsupported output.
- Provide preview payload and artifact URLs.
- Enqueue and monitor export jobs.

## Provider abstraction
### Interface (conceptual)
- `generateDiagramSpec(request): ProviderResult`
  - inputs: refined prompt, schema, examples, constraints
  - outputs: spec, rawResponse, usage/cost, providerLatency, modelId

### Routing (V1)
- Default provider (configured).
- Optional explicit provider selection in request (internal/admin).
- Fallback on transient errors (e.g., switch to provider #2).

## Validation & safety
Minimum checks:
- JSON Schema validation for `DiagramSpec`
- caps on primitives, text length, canvas size
- denylist unexpected fields
- strict type checking on numeric ranges

## Rendering & export
### Preview
Render `DiagramSpec` to SVG/Canvas in the browser using our renderer library.

### Export
Two viable approaches (choose one in implementation):
- **Headless browser**: render the same preview HTML in headless Chromium and screenshot.
- **SVG rasterization**: render SVG and rasterize to PNG/JPG server-side.

V1 recommendation: headless browser for parity, then optimize later if needed.

## Data + storage
- **PostgreSQL** for requests, generations, artifacts, audit events.
- **Object storage (S3-compatible)** for PNG/JPG (and optionally HTML bundles).
- Use signed URLs for downloads when appropriate.

## Observability
Minimum signals:
- requestId/diagramId trace fields on all logs
- provider latency, validation outcome, export latency
- error categorization: provider_error / validation_error / export_error

## Deployment (managed cloud-first)
- One web+api service (monolith) is acceptable for V1.
- One worker service for export jobs.
- Managed Postgres and S3 bucket.
- Secrets via managed secret store; per-provider API keys scoped by environment.

