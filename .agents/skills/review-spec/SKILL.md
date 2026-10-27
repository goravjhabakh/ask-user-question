---
name: review-spec
description: Review an implementation against its docs/specs contract, prioritizing correctness, scope compliance, validation, type safety, accessibility, and focused test coverage without modifying code unless asked.
---

# Review Spec

Use this skill after implementation or when reviewing a proposed change.

## Workflow

1. Read `AGENTS.md`, relevant architecture/decisions, and the target spec.
2. Inspect the implementation and tests.
3. Compare behavior to each important requirement and acceptance criterion.
4. Check for:
   - incorrect or missing behavior;
   - contract/schema mismatch;
   - unnecessary scope or complexity;
   - weak validation or unsafe input handling;
   - type-safety issues;
   - accessibility regressions;
   - important missing tests.
5. Use current docs, `gh_grep`, Playwright, or MCP Inspector only when they materially improve verification.
6. Return findings ordered by severity.

## Output

For each finding include:

- severity;
- affected file/area;
- what is wrong;
- why it matters;
- concise recommended fix.

If no meaningful issues are found, say so and note any remaining verification gaps.

## Rules

- Review before editing.
- Do not manufacture findings.
- Focus on correctness over style preferences.
- Do not demand abstractions or tests that provide little value.
