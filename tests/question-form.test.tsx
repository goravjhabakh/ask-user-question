// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuestionRequestSchema } from "../src/shared/questions.js";
import { QuestionForm } from "../src/ui/question-form.js";

const request = QuestionRequestSchema.parse({
  questions: [
    {
      id: "color",
      type: "single_select",
      prompt: "Choose a color",
      description: "Select one color.",
      required: true,
      allowCustom: true,
      options: [{ value: "blue", label: "Blue", description: "A cool color" }],
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
});

afterEach(cleanup);

describe("QuestionForm", () => {
  it("renders all question types and submits validated request-ordered answers", () => {
    const onComplete = vi.fn();
    render(
      <QuestionForm
        request={request}
        onComplete={onComplete}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Select one color.")).toBeTruthy();
    expect(screen.getByText(/A cool color/)).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Additional notes" }),
    ).toBeTruthy();
    expect(
      (screen.getByRole("radio", { name: "Yes" }) as HTMLInputElement).checked,
    ).toBe(false);
    expect(
      (screen.getByRole("radio", { name: "No" }) as HTMLInputElement).checked,
    ).toBe(false);

    fireEvent.click(screen.getAllByLabelText("Other")[0]);
    fireEvent.change(screen.getByLabelText("Other answer"), {
      target: { value: "Purple" },
    });
    fireEvent.click(screen.getByLabelText("Search"));
    fireEvent.click(screen.getAllByLabelText("Other")[1]);
    fireEvent.change(screen.getAllByLabelText("Other answer")[1], {
      target: { value: "Export" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Additional notes" }),
      {
        target: { value: "   " },
      },
    );
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(onComplete).toHaveBeenCalledWith({
      status: "completed",
      answers: [
        { questionId: "color", type: "single_select", customText: "Purple" },
        {
          questionId: "features",
          type: "multi_select",
          value: ["search"],
          customText: "Export",
        },
        { questionId: "continue", type: "confirm", value: false },
      ],
    });
  });

  it("shows accessible required errors and focuses the first invalid control", () => {
    const onComplete = vi.fn();
    render(
      <QuestionForm
        request={request}
        onComplete={onComplete}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(document.activeElement).toBe(screen.getByLabelText(/^Blue/));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("clears custom text when Other is deselected and cancels without completing", () => {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    render(
      <QuestionForm
        request={request}
        onComplete={onComplete}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getAllByLabelText("Other")[0]);
    fireEvent.change(screen.getByLabelText("Other answer"), {
      target: { value: "Purple" },
    });
    fireEvent.click(screen.getByLabelText(/^Blue/));
    expect(screen.queryByLabelText("Other answer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledWith({ status: "cancelled" });
    expect(onComplete).not.toHaveBeenCalled();
  });
});
