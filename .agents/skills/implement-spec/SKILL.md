---
name: implement-spec
description: Implement an agreed docs/specs specification with the smallest coherent change, following repository architecture, validating behavior, and reporting any necessary deviation.
---

# Implement Spec

Use this skill when an agreed specification is ready to implement.

## Workflow

1. Read `AGENTS.md`, project/architecture docs, relevant decisions, and the target spec.
2. Inspect the existing implementation before editing.
3. Map the spec to the smallest reasonable set of code changes.
4. Implement only the agreed scope.
5. Add or update focused tests for important acceptance criteria.
6. Run the repository's relevant checks.
7. Re-read the spec against the final implementation.
8. Report:
   - what changed;
   - checks run and their result;
   - any deviations or unresolved issues.

## Rules

- Do not silently expand scope.
- Do not add dependencies without clear justification.
- Reuse shared schemas/types.
- Preserve established architecture unless the spec requires a change.
- Prefer current official documentation for external APIs.
- Use `gh_grep` only as supporting reference when examples are useful.
- Use Playwright for UI/browser verification when relevant.
- Use MCP Inspector for MCP behavior when relevant.
- Do not rewrite the spec to make an incorrect implementation appear compliant.
