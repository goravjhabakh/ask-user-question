---
name: create-spec
description: Create or refine a concise implementation specification in docs/specs by reading project context, asking targeted questions when important decisions are missing, and writing a clear contract before coding.
---

# Create Spec

Use this skill when a feature or meaningful change needs a specification.

## Workflow

1. Read `AGENTS.md`, `docs/project.md`, `docs/architecture.md`, and relevant decisions/specs.
2. Inspect existing code when it affects the proposed change.
3. Identify only the decisions that materially affect implementation.
4. Ask targeted questions using the host's structured question tool when available.
5. Prefer small batches of high-value questions over long questionnaires.
6. Do not ask for information already present in repository context.
7. Draft or update one spec in `docs/specs/`.
8. Keep the spec concise but complete enough to implement without guessing.
9. Do not implement the feature while using this skill unless explicitly asked.

## Spec Shape

Use only relevant sections:

- Context
- Requirements
- Contract
- Behavior
- Edge Cases
- Non-goals
- Acceptance Criteria

## Rules

- Separate product requirements from implementation choices.
- Put reusable architectural decisions in `docs/architecture.md` or `docs/decisions.md`, not every spec.
- Make acceptance criteria observable and testable.
- Flag unresolved decisions instead of inventing answers.
- Avoid speculative future scope.
