import { App } from "@modelcontextprotocol/ext-apps";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { COMPLETE_QUESTION_APP_TOOL } from "../shared/mcp-app.js";
import {
  type Answer,
  type QuestionRequest,
  QuestionRequestSchema,
} from "../shared/questions.js";
import { QuestionForm } from "./question-form.js";

const app = new App({ name: "Ask User Question", version: "0.1.0" });

function QuestionMcpApp() {
  const [request, setRequest] = useState<QuestionRequest>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    app.ontoolinput = ({ arguments: arguments_ }) => {
      const parsed = QuestionRequestSchema.safeParse(arguments_);
      if (!parsed.success) {
        setError("The question request is invalid.");
        return;
      }
      setRequest(parsed.data);
    };

    app.ontoolcancelled = () => {
      setError("The question interaction was cancelled by the host.");
    };

    void app.connect().catch(() => {
      setError("The question UI could not connect to the host.");
    });
  }, []);

  async function complete(
    completion:
      | { status: "completed"; answers: Answer[] }
      | { status: "cancelled" },
  ): Promise<void> {
    const invocationId = app.getHostContext()?.toolInfo?.id;
    if (invocationId === undefined) {
      setError("The question UI is missing its interaction identifier.");
      return;
    }

    try {
      const result = await app.callServerTool({
        name: COMPLETE_QUESTION_APP_TOOL,
        arguments: { invocationId: String(invocationId), completion },
      });
      if (result.isError) {
        setError("The question response could not be submitted.");
      }
    } catch {
      setError("The question response could not be submitted.");
    }
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }
  if (!request) {
    return <p>Loading questions…</p>;
  }

  return (
    <QuestionForm
      request={request}
      onComplete={(result) => void complete(result)}
      onCancel={(result) => void complete(result)}
    />
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("The Ask User Question app requires a root element.");
}

createRoot(root).render(<QuestionMcpApp />);
