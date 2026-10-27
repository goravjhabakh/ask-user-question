# Core Question Contract

## Context

The MCP tool and UI need one shared, runtime-validatable contract for collecting a related batch of structured answers.

## Requirements

- A request contains one or more questions with caller-provided unique IDs.
- Support `single_select`, `multi_select`, `text`, and `confirm` questions.
- Every question has a required `prompt`, optional `description`, and explicit `required` boolean.
- Selectable questions use stable option values separate from display labels.
- Optional unanswered questions do not produce an answer.

## Contract

The canonical shared schema defines this input:

```ts
type QuestionRequest = { questions: Question[] };

type BaseQuestion = {
  id: string;
  prompt: string;
  description?: string;
  required: boolean;
};

type Option = {
  value: string;
  label: string;
  description?: string;
};

type Question =
  | (BaseQuestion & {
      type: "single_select" | "multi_select";
      options: Option[];
      allowCustom: boolean;
    })
  | (BaseQuestion & { type: "text" })
  | (BaseQuestion & { type: "confirm" });
```

The successful result is:

```ts
type QuestionResult = { answers: Answer[] };

type Answer =
  | {
      questionId: string;
      type: "single_select";
      value?: string;
      customText?: string;
    }
  | {
      questionId: string;
      type: "multi_select";
      value: string[];
      customText?: string;
    }
  | { questionId: string; type: "text"; value: string }
  | { questionId: string; type: "confirm"; value: boolean };
```

For a single-select answer, exactly one of `value` and `customText` is present. For a multi-select answer, `value` contains selected option values; `customText` may additionally be present. A custom answer is permitted only when `allowCustom` is true.

## Behavior

- Return answers in request question order, omitting optional questions the user leaves unanswered.
- A required single-select must select one option or supply custom text.
- A required multi-select must select at least one option or supply custom text.
- A required text answer must be non-blank after trimming.
- A confirm answer is `true` for confirmation and `false` for decline. Required confirmation still permits either boolean value; it requires a decision, not agreement.
- The server and UI validate requests and submitted answers against the same schema. The implementation applies safe input-size limits and rejects invalid or oversized data.

## Edge Cases

- Reject an empty question batch, duplicate or blank question IDs, blank prompts, and unsupported types.
- Reject selectable questions with no options, duplicate or blank option values, or blank option labels.
- Reject selected values not defined by that question, custom text when custom input is disabled, and blank custom text.
- Treat whitespace-only text as unanswered.

## Non-goals

- Conditional questions, per-question text-length constraints, custom confirmation labels, persistence, and arbitrary form fields.

## Acceptance Criteria

- [ ] Shared runtime schemas and derived TypeScript types represent the contract above.
- [ ] Valid batches covering all four question types parse successfully.
- [ ] Invalid IDs, option values, answer shapes, and required-answer omissions are rejected.
- [ ] Results correlate answers through caller-provided question IDs and preserve request order.
- [ ] Optional unanswered questions are absent from the result.
