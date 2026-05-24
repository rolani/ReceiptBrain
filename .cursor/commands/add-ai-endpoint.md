---
description: Add a FastAPI endpoint with pytest (Structured Outputs + mocked OpenAI + fixtures)
---

Follow `python-ai.mdc`, `security-auth.mdc`, `tdd-testing.mdc`, and `.cursor/skills/ai-endpoint-tdd/SKILL.md`.

**User request** (fill in): path, input/output models, OpenAI behavior.

**Do:**

1. Add Pydantic models; mirror the same shape into `packages/contracts` for the worker
2. Write failing pytest with mocked OpenAI client returning a fixture response
3. Add Structured Outputs `response_format` (`json_schema`) — no freeform parsing
4. Require `X-Internal-Token` header (use FastAPI dependency)
5. Implement preprocessing (HEIC, EXIF, resize, PDF) if image input
6. Return `usage` + `costUsdEstimate` + per-field confidence
7. Add fixture-based regression tests under `services/ai/tests/fixtures/`
8. Run `cd services/ai && pytest tests -q` until green

**Output**: module paths, test paths, fixture additions, contracts diff
