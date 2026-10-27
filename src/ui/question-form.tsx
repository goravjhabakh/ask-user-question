import { useRef, useState } from "react";

import {
  type Answer,
  createQuestionResultSchema,
  type QuestionRequest,
} from "../shared/questions.js";

const OTHER_VALUE = "__ask_user_question_other__";

export type QuestionFormProps = {
  request: QuestionRequest;
  onComplete: (result: { status: "completed"; answers: Answer[] }) => void;
  onCancel: (result: { status: "cancelled" }) => void;
};

type ChoiceState = Record<string, string | undefined>;
type MultiChoiceState = Record<string, string[] | undefined>;
type BooleanState = Record<string, boolean | undefined>;
type TextState = Record<string, string | undefined>;

export function QuestionForm({
  request,
  onComplete,
  onCancel,
}: QuestionFormProps) {
  const [singleChoices, setSingleChoices] = useState<ChoiceState>({});
  const [multiChoices, setMultiChoices] = useState<MultiChoiceState>({});
  const [confirmations, setConfirmations] = useState<BooleanState>({});
  const [texts, setTexts] = useState<TextState>({});
  const [customChoices, setCustomChoices] = useState<BooleanState>({});
  const [customTexts, setCustomTexts] = useState<TextState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const controlRefs = useRef(new Map<string, HTMLElement>());

  function registerControl(
    questionId: string,
    control: HTMLElement | null,
  ): void {
    if (control) {
      controlRefs.current.set(questionId, control);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const answers: Answer[] = [];
    const nextErrors: Record<string, string> = {};

    for (const question of request.questions) {
      const customText = customTexts[question.id]?.trim();

      switch (question.type) {
        case "single_select": {
          const value = singleChoices[question.id];
          const answer = customChoices[question.id]
            ? customText
              ? { questionId: question.id, type: question.type, customText }
              : undefined
            : value
              ? { questionId: question.id, type: question.type, value }
              : undefined;
          addAnswerOrError(
            question.required,
            answer,
            answers,
            nextErrors,
            question.id,
          );
          break;
        }
        case "multi_select": {
          const value = multiChoices[question.id] ?? [];
          const answer =
            value.length > 0 || (customChoices[question.id] && customText)
              ? {
                  questionId: question.id,
                  type: question.type,
                  value,
                  ...(customChoices[question.id] && customText
                    ? { customText }
                    : {}),
                }
              : undefined;
          addAnswerOrError(
            question.required,
            answer,
            answers,
            nextErrors,
            question.id,
          );
          break;
        }
        case "text": {
          const value = texts[question.id]?.trim();
          const answer = value
            ? { questionId: question.id, type: question.type, value }
            : undefined;
          addAnswerOrError(
            question.required,
            answer,
            answers,
            nextErrors,
            question.id,
          );
          break;
        }
        case "confirm": {
          const value = confirmations[question.id];
          const answer =
            value === undefined
              ? undefined
              : { questionId: question.id, type: question.type, value };
          addAnswerOrError(
            question.required,
            answer,
            answers,
            nextErrors,
            question.id,
          );
          break;
        }
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      controlRefs.current.get(Object.keys(nextErrors)[0])?.focus();
      return;
    }

    const result = createQuestionResultSchema(request).safeParse({ answers });
    if (!result.success) {
      setErrors({
        form: "Answers could not be validated. Please review the form.",
      });
      return;
    }

    setErrors({});
    onComplete({ status: "completed", answers: result.data.answers });
  }

  return (
    <form noValidate onSubmit={submit}>
      {errors.form ? <p role="alert">{errors.form}</p> : null}
      {request.questions.map((question) => {
        const error = errors[question.id];
        const descriptionId = question.description
          ? `${question.id}-description`
          : undefined;
        const errorId = error ? `${question.id}-error` : undefined;
        const describedBy =
          [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

        return (
          <fieldset
            key={question.id}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
          >
            <legend>
              {question.prompt}{" "}
              {question.required ? <span>(required)</span> : null}
            </legend>
            {question.description ? (
              <p id={descriptionId}>{question.description}</p>
            ) : null}
            {renderQuestion(question, {
              singleChoices,
              multiChoices,
              confirmations,
              texts,
              customChoices,
              customTexts,
              setSingleChoices,
              setMultiChoices,
              setConfirmations,
              setTexts,
              setCustomChoices,
              setCustomTexts,
              registerControl,
              describedBy,
            })}
            {error ? (
              <p id={errorId} role="alert">
                {error}
              </p>
            ) : null}
          </fieldset>
        );
      })}
      <button type="submit">Submit</button>
      <button type="button" onClick={() => onCancel({ status: "cancelled" })}>
        Cancel
      </button>
    </form>
  );
}

function addAnswerOrError(
  required: boolean,
  answer: Answer | undefined,
  answers: Answer[],
  errors: Record<string, string>,
  questionId: string,
): void {
  if (answer) {
    answers.push(answer);
  } else if (required) {
    errors[questionId] = "This question requires an answer.";
  }
}

type RenderState = Omit<
  QuestionFormProps,
  "request" | "onComplete" | "onCancel"
> & {
  singleChoices: ChoiceState;
  multiChoices: MultiChoiceState;
  confirmations: BooleanState;
  texts: TextState;
  customChoices: BooleanState;
  customTexts: TextState;
  setSingleChoices: React.Dispatch<React.SetStateAction<ChoiceState>>;
  setMultiChoices: React.Dispatch<React.SetStateAction<MultiChoiceState>>;
  setConfirmations: React.Dispatch<React.SetStateAction<BooleanState>>;
  setTexts: React.Dispatch<React.SetStateAction<TextState>>;
  setCustomChoices: React.Dispatch<React.SetStateAction<BooleanState>>;
  setCustomTexts: React.Dispatch<React.SetStateAction<TextState>>;
  registerControl: (questionId: string, control: HTMLElement | null) => void;
  describedBy: string | undefined;
};

function renderQuestion(
  question: QuestionRequest["questions"][number],
  state: RenderState,
) {
  const name = `question-${question.id}`;

  switch (question.type) {
    case "single_select":
      return (
        <>
          {question.options.map((option, index) => (
            <label key={option.value}>
              <input
                ref={
                  index === 0
                    ? (control) => state.registerControl(question.id, control)
                    : undefined
                }
                type="radio"
                name={name}
                value={option.value}
                checked={state.singleChoices[question.id] === option.value}
                onChange={() => {
                  state.setSingleChoices((choices) => ({
                    ...choices,
                    [question.id]: option.value,
                  }));
                  state.setCustomChoices((choices) => ({
                    ...choices,
                    [question.id]: false,
                  }));
                  state.setCustomTexts((texts) => ({
                    ...texts,
                    [question.id]: undefined,
                  }));
                }}
                aria-describedby={state.describedBy}
              />
              {option.label}
              {option.description ? <span> — {option.description}</span> : null}
            </label>
          ))}
          {question.allowCustom ? (
            <label>
              <input
                type="radio"
                name={name}
                value={OTHER_VALUE}
                checked={state.customChoices[question.id] === true}
                onChange={() => {
                  state.setSingleChoices((choices) => ({
                    ...choices,
                    [question.id]: undefined,
                  }));
                  state.setCustomChoices((choices) => ({
                    ...choices,
                    [question.id]: true,
                  }));
                }}
                aria-describedby={state.describedBy}
              />
              Other
            </label>
          ) : null}
          {state.customChoices[question.id]
            ? customTextInput(question.id, state)
            : null}
        </>
      );
    case "multi_select":
      return (
        <>
          {question.options.map((option, index) => {
            const selected = state.multiChoices[question.id] ?? [];
            return (
              <label key={option.value}>
                <input
                  ref={
                    index === 0
                      ? (control) => state.registerControl(question.id, control)
                      : undefined
                  }
                  type="checkbox"
                  name={name}
                  value={option.value}
                  checked={selected.includes(option.value)}
                  onChange={(event) => {
                    state.setMultiChoices((choices) => {
                      const values = choices[question.id] ?? [];
                      return {
                        ...choices,
                        [question.id]: event.target.checked
                          ? [...values, option.value]
                          : values.filter((value) => value !== option.value),
                      };
                    });
                  }}
                  aria-describedby={state.describedBy}
                />
                {option.label}
                {option.description ? (
                  <span> — {option.description}</span>
                ) : null}
              </label>
            );
          })}
          {question.allowCustom ? (
            <label>
              <input
                type="checkbox"
                name={`${name}-other`}
                checked={state.customChoices[question.id] === true}
                onChange={(event) => {
                  state.setCustomChoices((choices) => ({
                    ...choices,
                    [question.id]: event.target.checked,
                  }));
                  if (!event.target.checked) {
                    state.setCustomTexts((texts) => ({
                      ...texts,
                      [question.id]: undefined,
                    }));
                  }
                }}
                aria-describedby={state.describedBy}
              />
              Other
            </label>
          ) : null}
          {state.customChoices[question.id]
            ? customTextInput(question.id, state)
            : null}
        </>
      );
    case "text":
      return (
        <textarea
          ref={(control) => state.registerControl(question.id, control)}
          value={state.texts[question.id] ?? ""}
          onChange={(event) =>
            state.setTexts((texts) => ({
              ...texts,
              [question.id]: event.target.value,
            }))
          }
          aria-label={question.prompt}
          aria-describedby={state.describedBy}
        />
      );
    case "confirm":
      return [true, false].map((value, index) => (
        <label key={String(value)}>
          <input
            ref={
              index === 0
                ? (control) => state.registerControl(question.id, control)
                : undefined
            }
            type="radio"
            name={name}
            checked={state.confirmations[question.id] === value}
            onChange={() =>
              state.setConfirmations((answers) => ({
                ...answers,
                [question.id]: value,
              }))
            }
            aria-describedby={state.describedBy}
          />
          {value ? "Yes" : "No"}
        </label>
      ));
  }
}

function customTextInput(questionId: string, state: RenderState) {
  return (
    <label>
      Other answer
      <textarea
        ref={(control) => state.registerControl(questionId, control)}
        value={state.customTexts[questionId] ?? ""}
        onChange={(event) =>
          state.setCustomTexts((texts) => ({
            ...texts,
            [questionId]: event.target.value,
          }))
        }
        aria-label="Other answer"
        aria-describedby={state.describedBy}
      />
    </label>
  );
}
