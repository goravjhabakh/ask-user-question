import { z } from "zod";

const MAX_QUESTIONS = 20;
const MAX_QUESTION_ID_LENGTH = 100;
const MAX_PROMPT_LENGTH = 1_000;
const MAX_DESCRIPTION_LENGTH = 4_000;
const MAX_OPTIONS = 50;
const MAX_OPTION_VALUE_LENGTH = 200;
const MAX_OPTION_LABEL_LENGTH = 500;
const MAX_TEXT_LENGTH = 8_000;

const nonBlankString = (maxLength: number, fieldName: string) =>
  z
    .string()
    .max(maxLength, `${fieldName} must be at most ${maxLength} characters.`)
    .refine(
      (value) => value.trim().length > 0,
      `${fieldName} must not be blank.`,
    );

const optionalDescriptionSchema = z
  .string()
  .max(
    MAX_DESCRIPTION_LENGTH,
    `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
  )
  .optional();

const questionIdSchema = nonBlankString(MAX_QUESTION_ID_LENGTH, "Question ID");
const optionValueSchema = nonBlankString(
  MAX_OPTION_VALUE_LENGTH,
  "Option value",
);
const answerTextSchema = nonBlankString(MAX_TEXT_LENGTH, "Answer text");

export const OptionSchema = z
  .object({
    value: optionValueSchema,
    label: nonBlankString(MAX_OPTION_LABEL_LENGTH, "Option label"),
    description: optionalDescriptionSchema,
  })
  .strict();

const BaseQuestionSchema = z
  .object({
    id: questionIdSchema,
    prompt: nonBlankString(MAX_PROMPT_LENGTH, "Prompt"),
    description: optionalDescriptionSchema,
    required: z.boolean(),
  })
  .strict();

const selectableQuestionFields = {
  options: z.array(OptionSchema).min(1).max(MAX_OPTIONS),
  allowCustom: z.boolean(),
};

export const SingleSelectQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("single_select"),
  ...selectableQuestionFields,
}).superRefine((question, context) => {
  addDuplicateOptionValueIssue(question.options, context);
});

export const MultiSelectQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("multi_select"),
  ...selectableQuestionFields,
}).superRefine((question, context) => {
  addDuplicateOptionValueIssue(question.options, context);
});

export const TextQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("text"),
});

export const ConfirmQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("confirm"),
});

export const QuestionSchema = z.discriminatedUnion("type", [
  SingleSelectQuestionSchema,
  MultiSelectQuestionSchema,
  TextQuestionSchema,
  ConfirmQuestionSchema,
]);

export const QuestionRequestSchema = z
  .object({
    questions: z.array(QuestionSchema).min(1).max(MAX_QUESTIONS),
  })
  .strict()
  .superRefine((request, context) => {
    const seenQuestionIds = new Set<string>();

    for (const [index, question] of request.questions.entries()) {
      if (seenQuestionIds.has(question.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Question ID "${question.id}" is duplicated.`,
          path: ["questions", index, "id"],
        });
      }
      seenQuestionIds.add(question.id);
    }
  });

export const SingleSelectAnswerSchema = z
  .object({
    questionId: questionIdSchema,
    type: z.literal("single_select"),
    value: optionValueSchema.optional(),
    customText: answerTextSchema.optional(),
  })
  .strict()
  .refine(
    (answer) =>
      (answer.value === undefined) !== (answer.customText === undefined),
    "A single-select answer must contain exactly one of value or customText.",
  );

export const MultiSelectAnswerSchema = z
  .object({
    questionId: questionIdSchema,
    type: z.literal("multi_select"),
    value: z.array(optionValueSchema).max(MAX_OPTIONS),
    customText: answerTextSchema.optional(),
  })
  .strict()
  .refine(
    (answer) => new Set(answer.value).size === answer.value.length,
    "A multi-select answer must not contain duplicate values.",
  );

export const TextAnswerSchema = z
  .object({
    questionId: questionIdSchema,
    type: z.literal("text"),
    value: answerTextSchema,
  })
  .strict();

export const ConfirmAnswerSchema = z
  .object({
    questionId: questionIdSchema,
    type: z.literal("confirm"),
    value: z.boolean(),
  })
  .strict();

export const AnswerSchema = z.discriminatedUnion("type", [
  SingleSelectAnswerSchema,
  MultiSelectAnswerSchema,
  TextAnswerSchema,
  ConfirmAnswerSchema,
]);

export const QuestionResultSchema = z
  .object({
    answers: z.array(AnswerSchema).max(MAX_QUESTIONS),
  })
  .strict();

export type Option = z.infer<typeof OptionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionRequest = z.infer<typeof QuestionRequestSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type QuestionResult = z.infer<typeof QuestionResultSchema>;

/** Validates a result against its already-validated question request. */
export function createQuestionResultSchema(request: QuestionRequest) {
  return QuestionResultSchema.superRefine((result, context) => {
    const questionsById = new Map(
      request.questions.map((question) => [question.id, question]),
    );
    const answeredIds = new Set<string>();
    let previousQuestionIndex = -1;

    for (const [answerIndex, answer] of result.answers.entries()) {
      const question = questionsById.get(answer.questionId);
      if (!question) {
        addResultIssue(
          context,
          answerIndex,
          "questionId",
          "Answer references an unknown question ID.",
        );
        continue;
      }

      if (answeredIds.has(answer.questionId)) {
        addResultIssue(
          context,
          answerIndex,
          "questionId",
          "A question may have only one answer.",
        );
      }
      answeredIds.add(answer.questionId);

      const questionIndex = request.questions.findIndex(
        ({ id }) => id === answer.questionId,
      );
      if (questionIndex < previousQuestionIndex) {
        addResultIssue(
          context,
          answerIndex,
          undefined,
          "Answers must follow request question order.",
        );
      }
      previousQuestionIndex = questionIndex;

      if (answer.type !== question.type) {
        addResultIssue(
          context,
          answerIndex,
          "type",
          "Answer type does not match question type.",
        );
        continue;
      }

      if (isSelectQuestion(question) && isSelectAnswer(answer)) {
        validateSelectAnswer(question, answer, context, answerIndex);
      }
    }

    for (const question of request.questions) {
      if (question.required && !answeredIds.has(question.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A required question is unanswered.",
          path: ["answers"],
        });
      }
    }
  });
}

function addDuplicateOptionValueIssue(
  options: Option[],
  context: z.RefinementCtx,
): void {
  const seenValues = new Set<string>();
  for (const [index, option] of options.entries()) {
    if (seenValues.has(option.value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Option value "${option.value}" is duplicated.`,
        path: ["options", index, "value"],
      });
    }
    seenValues.add(option.value);
  }
}

type SelectQuestion = Extract<
  Question,
  { type: "single_select" | "multi_select" }
>;
type SelectAnswer = Extract<Answer, { type: "single_select" | "multi_select" }>;

function isSelectQuestion(question: Question): question is SelectQuestion {
  return question.type === "single_select" || question.type === "multi_select";
}

function isSelectAnswer(answer: Answer): answer is SelectAnswer {
  return answer.type === "single_select" || answer.type === "multi_select";
}

function validateSelectAnswer(
  question: SelectQuestion,
  answer: SelectAnswer,
  context: z.RefinementCtx,
  answerIndex: number,
): void {
  if (answer.customText !== undefined && !question.allowCustom) {
    addResultIssue(
      context,
      answerIndex,
      "customText",
      "This question does not allow custom answers.",
    );
  }

  const selectedValues =
    answer.type === "single_select" ? [answer.value] : answer.value;
  const allowedValues = new Set(question.options.map((option) => option.value));
  for (const value of selectedValues) {
    if (value !== undefined && !allowedValues.has(value)) {
      addResultIssue(
        context,
        answerIndex,
        "value",
        `Unknown option value "${value}".`,
      );
    }
  }

  if (
    answer.type === "multi_select" &&
    answer.value.length === 0 &&
    !answer.customText
  ) {
    addResultIssue(
      context,
      answerIndex,
      "value",
      "A multi-select answer must select an option or provide custom text.",
    );
  }
}

function addResultIssue(
  context: z.RefinementCtx,
  answerIndex: number,
  field: string | undefined,
  message: string,
): void {
  context.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path:
      field === undefined
        ? ["answers", answerIndex]
        : ["answers", answerIndex, field],
  });
}
