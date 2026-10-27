# Decisions

Keep entries short. Record decisions that materially affect architecture, contracts, workflow, or future compatibility.

## D001 — TypeScript stack

**Status:** Accepted

Use TypeScript and Node.js with pnpm, `@modelcontextprotocol/sdk`, Zod, React, Vite, Vitest, Biome, and GitHub Actions.

**Why:** Strong typing across the MCP contract and UI with a small, familiar toolchain.

## D002 — Spec-driven development

**Status:** Accepted

Meaningful features are defined in `docs/specs/` before implementation.

**Why:** Keeps human decisions explicit and gives coding agents a stable implementation contract.

## D003 — No persistence in V1

**Status:** Accepted

The MCP server will not store questionnaire answers.

**Why:** Persistence is unnecessary for the core interaction and would add privacy, security, and infrastructure complexity.

## D004 — Start as a single package

**Status:** Accepted

Start with a normal pnpm project. Move to pnpm workspaces only if package boundaries become useful.

**Why:** Avoid monorepo complexity before it provides value.

## D005 — Minimal AI tooling

**Status:** Accepted

Start with three repository skills (`create-spec`, `implement-spec`, `review-spec`) plus existing Playwright and `gh_grep` MCPs. Use MCP Inspector for MCP debugging/testing.

**Why:** Enough structure for reliable agent work without bloating context or workflow.
