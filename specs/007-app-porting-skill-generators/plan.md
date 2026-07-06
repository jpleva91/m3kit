# Implementation Plan: Application Porting Skill + Safe Nx Generators

## Technical Approach

Build on the existing `@m3kit/plugin` generator architecture rather than creating a separate CLI. Add a two-stage workflow:

1. `port-analyze`: reads a target page/route/component and emits a migration analysis packet.
2. `port-page`: uses the analysis (or inline target options) to generate side-by-side Nx feature/data-access/ui scaffolds plus Spec Kit/runbook/test artifacts.

Add a repo-shipped skill at `skills/m3kit-app-port/SKILL.md` that teaches humans/agents to run the workflow safely.

## Proposed Generator Surface

### `@m3kit/plugin:port-analyze`

Options:

- `target`: component path, route path, or project-local path.
- `project`: optional Nx project name when target is ambiguous.
- `domain`: optional domain name; inferred from path if omitted.
- `page`: optional page/feature name; inferred from target if omitted.
- `outputDir`: default `m3kit-porting/<domain>/<page>`.
- `scope`: default `ui`, used for m3kit import prefix recommendations.
- `write`: default `true`; if false, prints JSON/Markdown only.

Outputs:

- `porting-plan.md`
- `component-inventory.md`
- `data-access-map.md`
- `test-plan.md`
- `analysis.json`

### `@m3kit/plugin:port-page`

Options:

- `target`: same as analyzer.
- `domain`: required unless analysis file supplies it.
- `page`: optional.
- `analysis`: optional path to `analysis.json`.
- `mode`: `scaffold` (default), `analysis-only`, `runbook-only`.
- `destinationRoot`: default `libs/<domain>`.
- `scope`: default detected from `tsconfig.base.json` or `ui`.
- `libs`: optional override m3kit libs; otherwise inferred.
- `apply`: default `false`; v1 only emits snippets and does not route-rewrite.
- `force`: default `false`; refuses overwrite.

Outputs:

- `libs/<domain>/feature-<page>/...`
- `libs/<domain>/data-access/...`
- `libs/<domain>/ui/...`
- `m3kit-porting/<domain>/<page>/spec.md`
- `m3kit-porting/<domain>/<page>/plan.md`
- `m3kit-porting/<domain>/<page>/tasks.md`
- `m3kit-porting/<domain>/<page>/quickstart.md`
- `m3kit-porting/<domain>/<page>/contracts/*.md`
- `m3kit-porting/<domain>/<page>/checklists/requirements.md`
- `m3kit-porting/<domain>/<page>/runbook.md`
- `m3kit-porting/<domain>/<page>/ai-wiring-prompt.md`

## Architecture Notes

- Analyzer should use Nx project graph (`getProjects`) and filesystem AST/lightweight text scanning.
- Do not attempt full semantic TypeScript migration in v1. Record uncertain seams as `manual-review`.
- Generated code should compile as a skeleton and include failing/pending behavior specs for actual business logic.
- Existing `lift` generator remains the m3kit-lib internalization primitive; `port-page` can call shared helper logic or print the exact lift command.
- Add shared utilities under `tools/plugin/src/generators/porting-utils/` only if reused by both new generators.

## TDD Plan

Follow strict RED-GREEN-REFACTOR:

1. Add `port-analyze` schema + failing generator tests against a fixture workspace.
2. Implement minimal analyzer to pass one target path case.
3. Add failing tests for inferred m3kit libs, data-access seams, output files, and no source mutation.
4. Implement analyzer expansion.
5. Add `port-page` failing tests for side-by-side library generation and conflict refusal.
6. Implement minimal scaffold generation.
7. Add failing tests for Spec Kit packet completeness and runbook snippets.
8. Implement artifact generation.
9. Add skill validation tests (file exists, commands match schema, safety language present).
10. Run `npx nx run m3kit-plugin:test`, `lint`, `build`, and broader repo gates as feasible.

## File/Code Touch Points

- `tools/plugin/src/generators/port-analyze/`
- `tools/plugin/src/generators/port-page/`
- `tools/plugin/src/generators/porting-utils/`
- `tools/plugin/src/generators.json` or plugin registration equivalent.
- `tools/plugin/README.md`
- `skills/m3kit-app-port/SKILL.md`
- `docs/ADOPTION_GUIDE.md` or new `docs/APP_PORTING.md`
- `specs/007-app-porting-skill-generators/`

## Verification Gates

Required before PR:

```sh
npx nx run m3kit-plugin:test
npx nx run m3kit-plugin:lint
npx nx run m3kit-plugin:build
gitleaks detect --no-git --source specs --redact=20 --verbose
gitleaks detect --no-git --source docs --redact=20 --verbose
git diff --check
```

Stretch / if runtime budget allows:

```sh
npx nx run-many -t lint,test,build --all --skip-nx-cache
```

## Risks

- Analyzer overpromises automatic understanding of app-specific state/data layers. Mitigation: explicit `manual-review` statuses and runbook-first workflow.
- Generated code could feel too generic. Mitigation: derive names/states/contracts from the analyzed page, but keep business logic TODOs behind tests.
- Users may expect automatic route replacement. Mitigation: default `apply=false`; v1 emits snippets only.
- Skill may be confused with Hermes global skill installation. Mitigation: repo path and README clarify it is a portable instruction artifact users can copy/load into their agent.
