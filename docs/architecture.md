# Architecture

## System

```text
MCP host / AI agent
        |
        v
ask_user_question tool
        |
        v
validation + shared contract
        |
        v
interactive React UI
        |
        v
structured answer result
        |
        v
MCP host / AI agent
```

## Stack

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

Deployment should use a free or low-cost option when practical.

## Repository Structure

Start as a single package unless independent package boundaries provide a real benefit.

Planned shape:

```text
src/
  server/
  ui/
  shared/

docs/
  specs/
```

Move to pnpm workspaces only when separate server/UI/shared packages materially improve the build or dependency boundaries.

## Contract Strategy

The question and answer schemas are the core product contract.

Rules:

- define canonical schemas once;
- derive TypeScript types from the schemas where practical;
- share the contract between server and UI;
- validate all tool input at runtime;
- return deterministic structured results.

Exact schemas belong in the relevant feature spec before implementation.

## Server

V1 server principles:

- stateless;
- no database;
- no authentication;
- no persistence of submitted answers;
- minimal logging of user-provided content;
- clear validation and safe errors.

## UI

The UI should:

- feel lightweight and native to the host;
- support keyboard navigation;
- expose useful accessible names and states;
- handle long labels and descriptions;
- validate before submission;
- work in light and dark host environments where supported.

## Security

V1 should minimize attack surface:

- reject invalid and oversized inputs;
- do not render arbitrary HTML;
- avoid unsafe script execution;
- escape user-controlled text;
- keep dependencies minimal;
- do not log answers unnecessarily.

## Testing

Use focused tests for:

- schemas and validation;
- MCP tool contract;
- important UI behavior;
- end-to-end interaction where practical.

Use Playwright for browser verification and MCP Inspector for MCP-level inspection when useful.
