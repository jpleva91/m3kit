---
name: m3kit-app-port
description: Safely port one Angular/Nx page or feature into m3kit side-by-side using analyzer/generators, Spec Kit, TDD, and a human wiring runbook.
---

# m3kit App Port Skill

Use this skill when a user wants to port an existing Angular/Nx page, route, or feature into the m3kit framework without losing their current app code.

## Prime directive

**Do not delete, move, rename, or overwrite the user's existing app files.** The default workflow is analysis plus side-by-side generation. Existing pages remain the source of truth until the user explicitly approves replacement.

## Workflow

1. **Identify the target.** Get one target page/route/component path and the destination domain/page names.
2. **Run analysis first.**

   ```sh
   npx nx g @m3kit/plugin:port-analyze \
     --target=<path-or-route> \
     --domain=<domain> \
     --page=<page> \
     --outputDir=m3kit-porting/<domain>/<page>
   ```

3. **Read the analysis packet.** Review:
   - `porting-plan.md`
   - `component-inventory.md`
   - `data-access-map.md`
   - `test-plan.md`
   - `analysis.json`

4. **Generate side-by-side scaffold.**

   ```sh
   npx nx g @m3kit/plugin:port-page \
     --analysis=m3kit-porting/<domain>/<page>/analysis.json \
     --domain=<domain> \
     --page=<page> \
     --apply=false
   ```

5. **Use TDD.** For each generated service, facade, feature shell, or UI component:
   - write/inspect the failing behavior spec first,
   - run the focused test and confirm RED,
   - implement the smallest behavior to pass,
   - rerun focused tests and then affected suite.

6. **Wire manually from the runbook.** The generated `runbook.md` provides route/import snippets and a rollback path. Do not auto-apply route replacement in v1.

7. **Compare old vs new.** Use the checklist to verify behavior, loading/empty/error states, keyboard/focus, responsive behavior, and no source data copied into fixtures.

8. **Only replace after approval.** The user can choose to keep both pages, replace the route, or hand the runbook to an AI agent with the generated `ai-wiring-prompt.md`.

## Side-effect boundaries

Allowed by default:

- reading repo files,
- creating `m3kit-porting/<domain>/<page>/...`,
- creating new side-by-side libs/components/tests,
- running local tests/lint/build.

Requires explicit user approval:

- modifying existing route files,
- overwriting existing destination files,
- deleting or moving source files,
- pushing branches / opening PRs,
- publishing npm packages.

## Output contract

A successful run produces:

- Spec Kit packet (`spec.md`, `plan.md`, `tasks.md`, `quickstart.md`, `contracts/*`, `checklists/requirements.md`),
- generated side-by-side Nx layers,
- tests/specs for every generated unit,
- runbook and rollback checklist,
- AI wiring prompt with non-destructive boundaries.
