# MCP App Question Integration

## Context

Connect `ask_user_question` to the existing React form through MCP Apps so a compatible host can display the interactive UI and receive the resulting structured answer batch.

## Requirements

- Publish the question UI as an MCP App resource and associate it with `ask_user_question` using the MCP Apps UI metadata mechanism.
- The app receives the validated `QuestionRequest` for the current tool invocation and renders `QuestionForm` with it.
- The app submits completion and cancellation through the MCP Apps host bridge to one app-only completion tool. It must not use a project callback endpoint or persisted session state.
- The server validates every app-provided result against the request before returning it to the caller.
- If the host cannot present or complete the MCP App interaction, return the existing clear MCP tool error.

## Contract

The app input is the validated `QuestionRequest` from `001-core-question-contract.md`.

The only app completion messages are:

```ts
type AppQuestionCompletion =
  | { status: "completed"; answers: unknown }
  | { status: "cancelled" };
```

The server exposes one app-only MCP tool, not available to the model, that accepts an invocation identifier and `AppQuestionCompletion`. The UI calls this tool through `App.callServerTool`. It is the only permitted app-to-server completion path.

Before returning a completed MCP result, the server parses `answers` with `createQuestionResultSchema(request)`. The caller receives the existing tool contract from `002-mcp-tool.md`:

```ts
type AskUserQuestionResult =
  | { status: "completed"; answers: Answer[] }
  | { status: "cancelled" };
```

## Behavior

- On a valid tool call, the server creates one transient MCP App interaction for that request and waits for its terminal app-only completion-tool call.
- The UI passes a valid form submission unchanged as a completed message; Cancel passes a cancelled message.
- The bridge handles only the current invocation. Completion is accepted once; later, malformed, or mismatched messages cannot alter the result.
- The server returns structured content only after a valid completion or cancellation. It does not log or retain answer content.
- App resource load, bridge connection, and host presentation failures are MCP tool errors, not cancellations or text fallbacks.

## Edge Cases

- Reject a completion message with malformed answers, unknown question IDs, incorrect types, duplicate or out-of-order answers, or unmet required questions.
- If the UI closes without a cancellation message, or its bridge disconnects before completion, fail the tool interaction clearly.
- Do not accept a message belonging to a different invocation.

## Non-goals

- Supporting hosts without MCP Apps.
- A conversational fallback, callback endpoint, answer persistence, resumable sessions, or general-purpose app-to-server tools.
- Changing the core question, answer, or UI form contracts.

## Acceptance Criteria

- [ ] A compatible MCP Apps host discovers the UI resource from `ask_user_question` and renders the supplied request with `QuestionForm`.
- [ ] A valid UI submission returns the request-validated, request-ordered `{ status: "completed", answers }` result as MCP structured content.
- [ ] UI cancellation returns exactly `{ status: "cancelled" }` as MCP structured content.
- [ ] Invalid, duplicate, late, or invocation-mismatched bridge messages do not produce a successful tool result.
- [ ] Unsupported presentation, app-resource, bridge, and premature-close failures return a clear MCP tool error without a text fallback or persisted answers.
