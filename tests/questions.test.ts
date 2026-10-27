import { describe, expect, it } from "vitest";

import {
  createQuestionResultSchema,
  type QuestionRequest,
  QuestionRequestSchema,
} from "../src/shared/questions.js";

const validRequest = {
  questions: [
    {
      id: "color",
      type: "single_select",
      prompt: "Choose a color",
      required: true,
      allowCustom: true,
      options: [
        { value: "red", label: "Red" },
        { value: "blue", label: "Blue", description: "A cool color" },
      ],
    },
    {
      id: "features",
      type: "multi_select",
      prompt: "Choose features",
      required: true,
      allowCustom: true,
      options: [{ value: "search", label: "Search" }],
    },
    { id: "notes", type: "text", prompt: "Additional notes", required: false },
    { id: "continue", type: "confirm", prompt: "Continue?", required: true },
  ],
} satisfies QuestionRequest;

describe("QuestionRequestSchema", () => {
  it("parses a valid batch covering every question type", () => {
    expect(QuestionRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it.each([
    { questions: [] },
    { questions: [{ ...validRequest.questions[0], id: "   " }] },
    {
      questions: [
        validRequest.questions[0],
        { ...validRequest.questions[2], id: "color" },
      ],
    },
    { questions: [{ ...validRequest.questions[0], options: [] }] },
    {
      questions: [
        {
          ...validRequest.questions[0],
          options: [
            { value: "red", label: "Red" },
            { value: "red", label: "Also red" },
          ],
        },
      ],
    },
  ])("rejects invalid question contracts", (request) => {
    expect(QuestionRequestSchema.safeParse(request).success).toBe(false);
  });
});

describe("createQuestionResultSchema", () => {
  const request = QuestionRequestSchema.parse(validRequest);
  const resultSchema = createQuestionResultSchema(request);

  it("accepts ordered valid answers and omits optional unanswered questions", () => {
    const result = resultSchema.parse({
      answers: [
        { questionId: "color", type: "single_select", value: "blue" },
        {
          questionId: "features",
          type: "multi_select",
          value: ["search"],
          customText: "Export",
        },
        { questionId: "continue", type: "confirm", value: false },
      ],
    });

    expect(result.answers.map((answer) => answer.questionId)).toEqual([
      "color",
      "features",
      "continue",
    ]);
  });

  it.each([
    {
      answers: [
        { questionId: "color", type: "single_select", value: "green" },
        { questionId: "features", type: "multi_select", value: ["search"] },
        { questionId: "continue", type: "confirm", value: true },
      ],
    },
    {
      answers: [
        {
          questionId: "color",
          type: "single_select",
          value: "red",
          customText: "Other",
        },
        { questionId: "features", type: "multi_select", value: ["search"] },
        { questionId: "continue", type: "confirm", value: true },
      ],
    },
    {
      answers: [
        { questionId: "features", type: "multi_select", value: [] },
        { questionId: "color", type: "single_select", value: "red" },
        { questionId: "continue", type: "confirm", value: true },
      ],
    },
    {
      answers: [
        { questionId: "color", type: "single_select", value: "red" },
        { questionId: "features", type: "multi_select", value: ["search"] },
      ],
    },
  ])("rejects invalid answer results", (result) => {
    expect(resultSchema.safeParse(result).success).toBe(false);
  });

  it("allows a custom-only required multi-select answer", () => {
    expect(
      resultSchema.safeParse({
        answers: [
          { questionId: "color", type: "single_select", customText: "Purple" },
          {
            questionId: "features",
            type: "multi_select",
            value: [],
            customText: "Export",
          },
          { questionId: "continue", type: "confirm", value: true },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects custom text when the question disables custom answers", () => {
    const nonCustomRequest = QuestionRequestSchema.parse({
      questions: [
        {
          ...validRequest.questions[0],
          allowCustom: false,
        },
      ],
    });

    expect(
      createQuestionResultSchema(nonCustomRequest).safeParse({
        answers: [
          {
            questionId: "color",
            type: "single_select",
            customText: "Purple",
          },
        ],
      }).success,
    ).toBe(false);
  });
});
