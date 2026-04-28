# Thin-slice Prototype Plan (V1)

## Objective
Prove the end-to-end flow on managed-cloud-friendly architecture:
prompt -> provider -> validated DiagramSpec -> preview -> PNG export -> persistence.

The prototype should be small but “real”: instrumented, repeatable, and safe by default.

## Milestone 1: Skeleton + contracts
Deliverables:
- Repo scaffold (web + api) and basic routing.
- Draft API contracts (request/response shapes) aligned to PRD.
- `DiagramSpec v1` JSON Schema (minimal primitives).

Acceptance criteria:
- A sample hardcoded `DiagramSpec` renders in the browser preview.
- Schema validation rejects malformed specs.

## Milestone 2: Provider abstraction + one provider enabled
Deliverables:
- `LLMProvider` interface and provider router.
- One provider adapter enabled (default: OpenAI OR Anthropic).
- Prompt template that instructs the model to output strict JSON matching schema.

Acceptance criteria:
- Given a prompt, API returns a `diagramId` and stores generation record.
- Raw provider output is parsed into JSON and validated (failures stored with reason).

## Milestone 3: Preview rendering end-to-end
Deliverables:
- Preview page in web app that fetches by `diagramId`.
- Deterministic renderer library that turns `DiagramSpec` into SVG/Canvas.

Acceptance criteria:
- A newly generated diagram displays without manual steps.
- A stored diagram can be reopened from history.

## Milestone 4: Export pipeline (PNG first)
Deliverables:
- Background job to export PNG from the same render path.
- Object storage integration (S3-compatible) and artifact record in DB.
- Download endpoint or signed URL.

Acceptance criteria:
- PNG becomes available asynchronously after generation.
- User can view/download PNG from the UI.

## Milestone 5: Persistence + history + observability
Deliverables:
- History endpoint and web page.
- Basic operational views: error lists and per-stage timings (logs/metrics).
- Provider usage/cost capture where available.

Acceptance criteria:
- History shows at least: prompt snippet, created time, status, open/download.
- For a failed generation, user sees a clear message and we have traceable diagnostics.

## Test plan (prototype)
### Prompt suite
Create a small fixed suite (10–20 prompts) covering:
- geometry (triangle + labels)
- labeled axes with a curve
- simple flow-like diagram (boxes + arrows) if supported
- edge cases: ambiguous prompt, oversized canvas, too many labels

### Automated checks (minimum)
- Schema validation unit tests
- Renderer snapshot tests for a few stable specs
- One end-to-end test: generate -> preview -> export artifact exists

## Scope controls (to keep prototype shippable)
- Hard caps: primitives, labels, canvas size.
- Limit to 1 provider enabled until success rates are acceptable.
- Prefer “best effort” diagram types but return explicit validation errors for unsupported constructs.

