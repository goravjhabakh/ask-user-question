# MCP Ask User Question Tool

## Context

Expose the shared core question contract through an MCP tool so compatible hosts can present an interactive question UI and return its answers to the calling agent.

## Requirements

- Register one public MCP tool named `ask_user_question`.
- Its input is exactly `QuestionRequest` from `001-core-question-contract.md`; do not add batch metadata.
- Validate input with the shared runtime schema before starting an interaction.
- Return deterministic structured results and do not persist answers.

## Contract

The tool input is:

```ts
type AskUserQuestionInput = QuestionRequest;
```

Its successful structured result is one of:

```ts
type AskUserQuestionResult =
  | { status: "completed"; answers: Answer[] }
  | { status: "cancelled" };
```

For `completed`, `answers` follow the `QuestionResult` rules in the core contract. The MCP response supplies this value through structured content. The server declares the corresponding output schema so hosts can validate it.

## Behavior

- On valid input, request an interactive UI session and wait for it to complete or cancel.
- On submission, validate the answers with the shared contract and return `{ status: "completed", answers }`.
- If the user dismisses or cancels the UI, return `{ status: "cancelled" }`; this is not a tool error.
- If input is invalid, submitted data is invalid, or an interactive UI cannot be presented, return a clear MCP tool error and do not return a successful result.
- Do not log answer content unnecessarily.

## Edge Cases

- Validation failures must identify the invalid input or answer without including unrelated user-provided content.
- An unavailable, unsupported, or failed UI integration is an error, not an unstructured conversational fallback.
- A completed result cannot contain answers for questions absent from the request.

## Non-goals

- Conversational/text fallback collection.
- Persistence, resuming interactions, or concurrent multi-session management.
- Defining the UI transport or host-specific rendering mechanism.

## Acceptance Criteria

- [ ] The server advertises an `ask_user_question` tool whose input schema matches `QuestionRequest`.
- [ ] A valid completed interaction returns schema-valid structured content with `status: "completed"` and request-ordered answers.
- [ ] Cancellation returns exactly `{ status: "cancelled" }` as successful structured content.
- [ ] Invalid input, invalid submitted answers, and unavailable UI presentation return clear MCP tool errors.
- [ ] The tool does not store submitted answers.
