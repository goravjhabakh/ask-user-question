# Specifications

Specifications define the implementation contract for meaningful features.

Create specs only when needed. Number them in implementation order, for example:

```text
001-core-question-contract.md
002-mcp-tool.md
003-question-ui.md
```

## Template

```md
# Feature Name

## Context

Why this change exists.

## Requirements

What must be true.

## Contract

Inputs, outputs, schemas, or public interfaces when relevant.

## Behavior

Expected behavior.

## Edge Cases

Important failure or boundary cases.

## Non-goals

What is intentionally excluded.

## Acceptance Criteria

- [ ] ...
```

Sections may stay short or be omitted when genuinely irrelevant. Avoid duplicating `project.md` or `architecture.md`.
