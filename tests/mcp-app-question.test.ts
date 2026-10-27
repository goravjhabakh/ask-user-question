import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";

import {
  COMPLETE_QUESTION_APP_TOOL,
  createMcpAppAskUserQuestionServer,
  QUESTION_APP_RESOURCE_URI,
  QuestionAppBridge,
} from "../src/server/mcp-app-question.js";
import { QuestionRequestSchema } from "../src/shared/questions.js";

const request = QuestionRequestSchema.parse({
  questions: [
    {
      id: "continue",
      type: "confirm",
      prompt: "Continue?",
      required: true,
    },
  ],
});

const connections: Array<{ client: Client; closeServer: () => Promise<void> }> =
  [];

afterEach(async () => {
  await Promise.all(
    connections
      .splice(0)
      .flatMap(({ client, closeServer }) => [client.close(), closeServer()]),
  );
});

describe("MCP App question integration", () => {
  it("publishes the form resource and associates it with the question tool", async () => {
    const server = createMcpAppAskUserQuestionServer({
      readUiHtml: async () => "<main>Question form</main>",
    });
    const client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    connections.push({ client, closeServer: () => server.close() });

    const { tools } = await client.listTools();
    const questionTool = tools.find(({ name }) => name === "ask_user_question");
    const completionTool = tools.find(
      ({ name }) => name === COMPLETE_QUESTION_APP_TOOL,
    );
    const resource = await client.readResource({
      uri: QUESTION_APP_RESOURCE_URI,
    });

    expect(questionTool?._meta).toMatchObject({
      "ui/resourceUri": QUESTION_APP_RESOURCE_URI,
      ui: { resourceUri: QUESTION_APP_RESOURCE_URI },
    });
    expect(completionTool?._meta).toMatchObject({
      ui: { visibility: ["app"] },
    });
    expect(resource.contents).toEqual([
      expect.objectContaining({
        uri: QUESTION_APP_RESOURCE_URI,
        mimeType: "text/html;profile=mcp-app",
        text: "<main>Question form</main>",
      }),
    ]);
  });

  it("accepts one matching completion and rejects late or mismatched completions", async () => {
    const bridge = new QuestionAppBridge();
    const controller = new AbortController();
    const interaction = bridge.present(request, {
      invocationId: "active-call",
      signal: controller.signal,
    });

    expect(bridge.complete("other-call", { status: "cancelled" })).toBe(false);
    expect(
      bridge.complete("active-call", {
        status: "completed",
        answers: [{ questionId: "continue", type: "confirm", value: true }],
      }),
    ).toBe(true);
    await expect(interaction).resolves.toEqual({
      status: "completed",
      answers: [{ questionId: "continue", type: "confirm", value: true }],
    });
    expect(bridge.complete("active-call", { status: "cancelled" })).toBe(false);
  });

  it("rejects an interaction that the host cancels before completion", async () => {
    const bridge = new QuestionAppBridge();
    const controller = new AbortController();
    const interaction = bridge.present(request, {
      invocationId: "active-call",
      signal: controller.signal,
    });

    controller.abort();

    await expect(interaction).rejects.toThrow(
      "The interactive question UI closed before completion.",
    );
  });
});
