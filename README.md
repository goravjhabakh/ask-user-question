# Ask User Question

A structured human-in-the-loop question tool for AI agents, inspired by Claude's `AskUserQuestion`.

The goal is to let an agent pause when user input is genuinely needed, present a small interactive questionnaire, receive structured answers, and continue with those answers.

## Planned V1

Question types:

- single select
- multi select
- text
- confirm

Core principles:

- typed and validated contracts
- minimal, accessible UI
- stateless MCP server
- no persistence or authentication in V1
- small dependency surface
- spec-driven development

## Tech Stack

- TypeScript
- Node.js
- pnpm
- `@modelcontextprotocol/sdk`
- Zod
- React + TypeScript
- Vite
- Vitest
- Biome
- GitHub Actions
- free deployment where practical

## Project Docs

- `AGENTS.md` — how coding agents should work in this repository
- `docs/project.md` — product goals, scope, and boundaries
- `docs/architecture.md` — technical design and engineering rules
- `docs/decisions.md` — lightweight decision log
- `docs/specs/` — implementation specifications

## Development Workflow

1. Discuss the feature.
2. Create or refine a spec.
3. Review the spec.
4. Implement only the agreed scope.
5. Run checks and tests.
6. Review the implementation against the spec.
7. Commit and open a PR when appropriate.

The repository is currently in the design/specification stage.
