import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";

import {
  createAskUserQuestionServer,
  type QuestionPresenter,
} from "../src/server/ask-user-question.js";

const request = {
  questions: [
    {
      id: "color",
      type: "single_select" as const,
      prompt: "Choose a color",
      required: true,
      allowCustom: false,
      options: [{ value: "blue", label: "Blue" }],
    },
    {
      id: "continue",
      type: "confirm" as const,
      prompt: "Continue?",
      required: true,
    },
  ],
};

const connections: Array<{ client: Client; closeServer: () => Promise<void> }> =
  [];

afterEach(async () => {
  await Promise.all(
    connections
      .splice(0)
      .flatMap(({ client, closeServer }) => [client.close(), closeServer()]),
  );
});

async function connect(presenter?: QuestionPresenter): Promise<Client> {
  const server = createAskUserQuestionServer(presenter);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  connections.push({ client, closeServer: () => server.close() });
  return client;
}

describe("ask_user_question", () => {
  it("advertises the shared question request schema", async () => {
    const client = await connect();

    const { tools } = await client.listTools();
    const tool = tools.find(({ name }) => name === "ask_user_question");

    expect(tool?.inputSchema).toMatchObject({
      type: "object",
      required: ["questions"],
      additionalProperties: false,
    });
    expect(tool?.outputSchema).toBeDefined();
  });

  it("returns validated, request-ordered answers as structured content", async () => {
    const client = await connect(async () => ({
      status: "completed",
      answers: [
        { questionId: "color", type: "single_select", value: "blue" },
        { questionId: "continue", type: "confirm", value: true },
      ],
    }));

    const result = await client.callTool({
      name: "ask_user_question",
      arguments: request,
    });

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({
      status: "completed",
      answers: [
        { questionId: "color", type: "single_select", value: "blue" },
        { questionId: "continue", type: "confirm", value: true },
      ],
    });
  });

  it("returns cancellation as successful structured content", async () => {
    const client = await connect(async () => ({ status: "cancelled" }));

    const result = await client.callTool({
      name: "ask_user_question",
      arguments: request,
    });

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ status: "cancelled" });
  });

  it("returns tool errors for invalid input, unavailable UI, and invalid submitted answers", async () => {
    const invalidInputClient = await connect(async () => ({
      status: "cancelled",
    }));
    const unavailableClient = await connect();
    const invalidAnswersClient = await connect(async () => ({
      status: "completed",
      answers: [{ questionId: "color", type: "single_select", value: "red" }],
    }));

    const invalidInput = await invalidInputClient.callTool({
      name: "ask_user_question",
      arguments: { questions: [] },
    });
    const unavailable = await unavailableClient.callTool({
      name: "ask_user_question",
      arguments: request,
    });
    const invalidAnswers = await invalidAnswersClient.callTool({
      name: "ask_user_question",
      arguments: request,
    });

    expect(invalidInput).toMatchObject({ isError: true });
    expect(unavailable).toMatchObject({ isError: true });
    expect(invalidAnswers).toMatchObject({ isError: true });
  });
});
