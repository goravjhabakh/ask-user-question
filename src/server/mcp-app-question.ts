import { readFile } from "node:fs/promises";

import {
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  COMPLETE_QUESTION_APP_TOOL,
  QUESTION_APP_RESOURCE_URI,
} from "../shared/mcp-app.js";
import type { QuestionRequest } from "../shared/questions.js";
import {
  createAskUserQuestionServer,
  type QuestionInteraction,
  type QuestionPresentationContext,
  QuestionUiUnavailableError,
} from "./ask-user-question.js";

export { COMPLETE_QUESTION_APP_TOOL, QUESTION_APP_RESOURCE_URI };

export const AppQuestionCompletionSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("completed"), answers: z.unknown() }).strict(),
  z.object({ status: z.literal("cancelled") }).strict(),
]);

export type AppQuestionCompletion = z.infer<typeof AppQuestionCompletionSchema>;

const CompletionToolInputSchema = z
  .object({
    invocationId: z.string().min(1),
    completion: AppQuestionCompletionSchema,
  })
  .strict();

export type McpAppServerOptions = {
  readUiHtml?: () => Promise<string>;
};

type PendingInteraction = {
  invocationId: string;
  resolve: (completion: AppQuestionCompletion) => void;
  reject: (error: Error) => void;
  removeAbortListener: () => void;
};

export class QuestionAppBridge {
  private pending: PendingInteraction | undefined;

  present(
    _request: QuestionRequest,
    context: QuestionPresentationContext,
  ): Promise<QuestionInteraction> {
    if (this.pending) {
      throw new QuestionUiUnavailableError();
    }

    return new Promise<QuestionInteraction>((resolve, reject) => {
      const pending: PendingInteraction = {
        invocationId: context.invocationId,
        resolve: (completion) => {
          resolve(completion);
        },
        reject,
        removeAbortListener: () => {
          context.signal.removeEventListener("abort", abort);
        },
      };
      const abort = () => {
        if (this.pending !== pending) {
          return;
        }
        this.pending = undefined;
        pending.removeAbortListener();
        reject(
          new Error("The interactive question UI closed before completion."),
        );
      };

      context.signal.addEventListener("abort", abort, { once: true });
      this.pending = pending;
      if (context.signal.aborted) {
        abort();
      }
    });
  }

  complete(invocationId: string, completion: AppQuestionCompletion): boolean {
    const pending = this.pending;
    if (!pending || pending.invocationId !== invocationId) {
      return false;
    }

    this.pending = undefined;
    pending.removeAbortListener();
    pending.resolve(completion);
    return true;
  }
}

/**
 * Creates the MCP Apps-enabled question server. Build the UI before serving it
 * so the registered resource can load `dist/ui/mcp-app.html`.
 */
export function createMcpAppAskUserQuestionServer(
  options: McpAppServerOptions = {},
): McpServer {
  const bridge = new QuestionAppBridge();
  const server = createAskUserQuestionServer(bridge.present.bind(bridge), {
    appResourceUri: QUESTION_APP_RESOURCE_URI,
  });
  const readUiHtml = options.readUiHtml ?? loadQuestionAppHtml;

  registerAppResource(
    server,
    "Ask User Question form",
    QUESTION_APP_RESOURCE_URI,
    { description: "Interactive structured question form." },
    async () => ({
      contents: [
        {
          uri: QUESTION_APP_RESOURCE_URI,
          mimeType: "text/html;profile=mcp-app",
          text: await readUiHtml(),
        },
      ],
    }),
  );

  registerAppTool(
    server,
    COMPLETE_QUESTION_APP_TOOL,
    {
      description: "Submit or cancel the active Ask User Question form.",
      inputSchema: CompletionToolInputSchema,
      outputSchema: z.object({ accepted: z.literal(true) }).strict(),
      _meta: {
        ui: {
          resourceUri: QUESTION_APP_RESOURCE_URI,
          visibility: ["app"],
        },
      },
    },
    async ({ invocationId, completion }) => {
      if (!bridge.complete(invocationId, completion)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "The question interaction is no longer active.",
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          { type: "text" as const, text: "Question response accepted." },
        ],
        structuredContent: { accepted: true },
      };
    },
  );

  return server;
}

async function loadQuestionAppHtml(): Promise<string> {
  return readFile(
    new URL("../../dist/ui/mcp-app.html", import.meta.url),
    "utf8",
  );
}
