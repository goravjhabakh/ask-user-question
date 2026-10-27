# Interactive Question UI

## Context

Provide the React UI that collects a valid answer batch for `ask_user_question` using the shared contract in `001-core-question-contract.md`.

## Requirements

- Render one form containing all request questions in request order.
- Support `single_select`, `multi_select`, `text`, and `confirm`.
- Submit only valid answers; Cancel returns the cancelled interaction result and submits nothing.
- Do not persist answers.

## Behavior

- Each question displays its prompt, optional description, and required state.
- `single_select` uses a radio group; `multi_select` uses checkboxes. Each option displays its label and optional description.
- When `allowCustom` is true, selectable questions include an **Other** choice. Selecting it reveals a text input. For single-select, Other replaces an option selection; for multi-select, it may accompany checked options.
- `text` uses a multiline text area.
- `confirm` uses an initially unselected Yes/No radio group. Either selection satisfies a required confirmation.
- Optional unanswered questions are omitted. Blank text and blank custom text are treated as unanswered.
- Submit validates every question, displays an associated error for each invalid question, focuses the first invalid control, and does not complete the interaction.
- A successful submission creates request-ordered answers that validate with `createQuestionResultSchema(request)` and returns them as `{ status: "completed", answers }`.

## Accessibility

- Use native form controls and semantic `fieldset`/`legend` grouping for selectable and confirmation questions.
- Associate descriptions, required indicators, and validation messages with their controls using accessible names and states.
- All controls, Submit, and Cancel must be keyboard operable; selection state and errors must be perceivable without color alone.
- Errors announced after submission must be exposed to assistive technology.

## Edge Cases

- Long prompts, descriptions, labels, and option descriptions wrap without hiding controls or error messages.
- Changing a selection away from Other clears its custom text; custom text is excluded unless Other is selected.
- Submission must not emit unknown option values, duplicate answers, or answers for optional unanswered questions.
- The UI relies on the validated request contract and must safely handle malformed runtime state by refusing completion rather than returning invalid answers.

## Non-goals

- Per-question submit actions, conditional questions, custom confirmation labels, draft saving, answer persistence, and host-specific UI transport.

## Acceptance Criteria

- [ ] One form renders every supported question type in request order with prompts, descriptions, and required state.
- [ ] Selectable questions support option descriptions and the specified Other behavior when custom answers are allowed.
- [ ] Required omissions and blank text/custom input block submission with accessible, question-associated errors and focus on the first invalid control.
- [ ] Valid submissions return request-ordered answers accepted by the shared result schema; optional unanswered questions are absent.
- [ ] Cancel returns `{ status: "cancelled" }` without submitting answers.
- [ ] Core interaction and keyboard behavior are covered by focused UI tests.
