# Project

## Overview

Ask User Question is a reusable MCP tool that lets an AI agent request structured user input through an interactive UI and continue using the submitted answers.

## Problem

Agents often need clarification, but plain conversational questions are inefficient when the user can choose from a small set of clear options.

Claude exposes this pattern through `AskUserQuestion`. This project aims to provide a similar reusable primitive for ChatGPT and other compatible MCP hosts where practical.

## Goal

Provide a simple, reliable human-in-the-loop interaction for:

- choosing one option;
- choosing multiple options;
- entering short or long text;
- confirming an action or decision.

## V1 Scope

Question types:

- `single_select`
- `multi_select`
- `text`
- `confirm`

V1 should also support:

- required and optional questions;
- option labels and descriptions;
- an optional custom/other answer where applicable;
- structured tool results;
- basic validation;
- accessible interaction.

## Core Flow

```text
AI agent
  -> ask_user_question tool
  -> interactive question UI
  -> user submits answers
  -> structured result
  -> agent continues
```

## Non-goals for V1

- authentication;
- databases or answer persistence;
- analytics;
- survey management;
- complex conditional forms;
- arbitrary HTML or custom scripts;
- large form-building features.

## Users

Primary users are AI agents and developers who want a reusable structured clarification primitive.

## Success Criteria

V1 is successful when:

- an MCP host can invoke the tool with a valid question contract;
- the UI renders the supported question types correctly;
- invalid input is rejected safely;
- submitted answers return in a predictable structured format;
- the flow works end-to-end in a supported host;
- core behavior is covered by focused tests.
