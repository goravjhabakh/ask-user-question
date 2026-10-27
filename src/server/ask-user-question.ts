import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  type Answer,
  AnswerSchema,
  createQuestionResultSchema,
  type QuestionRequest,
  QuestionRequestSchema,
} from "../shared/questions.js";

export const AskUserQuestionResultSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("completed"),
      answers: z.array(AnswerSchema).max(20),
    })
    .strict(),
  z.object({ status: z.literal("cancelled") }).strict(),
]);

// MCP tool output schemas must be object schemas. The handler additionally
// enforces the stricter discriminated union above before returning a result.
const AskUserQuestionOutputSchema = z
  .object({
    status: z.enum(["completed", "cancelled"]),
    answers: z.array(AnswerSchema).max(20).optional(),
  })
  .strict();

export type AskUserQuestionResult =
  | { status: "completed"; answers: Answer[] }
  | { status: "cancelled" };

export type QuestionInteraction =
  | { status: "completed"; answers: unknown }
  | { status: "cancelled" };

export type QuestionPresenter = (
  request: QuestionRequest,
) => Promise<QuestionInteraction>;

export class QuestionUiUnavailableError extends Error {
  constructor() {
    super("An interactive question UI is unavailable for this MCP host.");
    this.name = "QuestionUiUnavailableError";
  }
}

const unavailableQuestionPresenter: QuestionPresenter = async () => {
  throw new QuestionUiUnavailableError();
};

export function createAskUserQuestionServer(
  presentQuestions: QuestionPresenter = unavailableQuestionPresenter,
): McpServer {
  const server = new McpServer({
    name: "ask-user-question",
    version: "0.1.0",
  });

  server.registerTool(
    "ask_user_question",
    {
      description:
        "Collect structured answers through an interactive question UI.",
      inputSchema: QuestionRequestSchema,
      outputSchema: AskUserQuestionOutputSchema,
    },
    async (request) => {
      const validatedRequest = QuestionRequestSchema.parse(request);

      let interaction: QuestionInteraction;
      try {
        interaction = await presentQuestions(validatedRequest);
      } catch (error) {
        return toolError(
          error instanceof QuestionUiUnavailableError
            ? error.message
            : "The interactive question UI could not be presented.",
        );
      }

      if (interaction.status === "cancelled") {
        return completedResult({ status: "cancelled" });
      }

      const answerResult = createQuestionResultSchema(
        validatedRequest,
      ).safeParse({
        answers: interaction.answers,
      });
      if (!answerResult.success) {
        return toolError(
          "The interactive question UI returned invalid answers.",
        );
      }

      return completedResult({
        status: "completed",
        answers: answerResult.data.answers,
      });
    },
  );

  return server;
}

function completedResult(result: AskUserQuestionResult) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          result.status === "completed"
            ? "Questions answered."
            : "Question collection was cancelled.",
      },
    ],
    structuredContent: result,
  };
}

function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}
