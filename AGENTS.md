# Agent Instructions

## Purpose

This file defines how AI coding agents should work in this repository.

## Read Before Making Changes

Read, in order:

1. `AGENTS.md`
2. `docs/project.md`
3. `docs/architecture.md`
4. `docs/decisions.md` when relevant
5. the active file in `docs/specs/`

Do not implement a feature without understanding its active specification.

## Working Principles

- Follow the active spec.
- Prefer the smallest coherent solution.
- Do not add dependencies, infrastructure, or abstractions without a clear need.
- Avoid unrelated refactors.
- Reuse shared schemas and types instead of duplicating contracts.
- Validate external and tool input.
- Keep MCP behavior deterministic and structured.
- Keep UI accessible and keyboard usable.
- Do not persist user answers in V1.
- Do not silently change agreed architecture or scope.

## Spec-Driven Workflow

For meaningful features:

1. create or refine a spec in `docs/specs/`;
2. resolve important ambiguity before implementation;
3. implement only the agreed scope;
4. test the acceptance criteria;
5. report deviations from the spec;
6. update documentation when an agreed decision changes.

Use the repository skills when appropriate:

- `create-spec`
- `implement-spec`
- `review-spec`

## External References

Use current documentation instead of guessing when library or protocol behavior may have changed.

- Use `gh_grep` for useful real-world GitHub examples.
- Use Playwright MCP for browser/UI verification when relevant.
- Use MCP Inspector when testing the MCP server itself.

External examples are references, not authority. Prefer official documentation for contracts and APIs.

## Code Quality

- TypeScript strict mode.
- pnpm only.
- Biome for formatting and linting.
- Keep modules focused.
- Prefer explicit types at public boundaries.
- Avoid `any` unless justified.
- Tests should target important behavior and contracts rather than maximize coverage.

## Verification

Before considering implementation complete, run the project-defined checks for:

- formatting/linting
- type checking
- tests
- build

Exact commands will be defined when the project is scaffolded.

## Git

Use focused changes and conventional commits where practical.

Examples:

- `feat(schema): define question contract`
- `feat(mcp): add ask_user_question tool`
- `test(ui): cover required question behavior`
- `docs: record contract decision`

Do not create commits unless requested by the user or the active workflow explicitly requires it.
