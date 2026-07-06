# Feature Specification: Application Porting Skill + Safe Nx Generators

**Feature Branch**: `007-app-porting-skill-generators`

**Created**: 2026-07-06

**Status**: Draft / implementation-ready

**Input**: User description: "Add a feature so this repo can have a skill and necessary generators that let a user run the skill to port their application into this framework. It should pull all UI components needed, port data access layers, feature layers, UI layers, etc. in Nx best-practice form. Ideally the skill can be run for a given page. Ensure TDD, tests, and specs for every single thing using Spec Kit. It should not delete their changes, but create feature components in a way that they can be easily dropped in, with a runbook for how to wire them up so the user can do it themselves or with AI support."

## Product Goal

Turn m3kit from a component/reference library into a **safe app-porting accelerator**: a consumer can point the m3kit skill/generators at one page or feature in an existing Angular/Nx app and receive a non-destructive migration packet containing:

- lifted m3kit libraries required for that page,
- generated Nx best-practice feature/data-access/ui library structure,
- m3kit-compatible component/page shells,
- TDD specs and Spec Kit artifacts,
- a wiring runbook and manual checklist,
- no destructive edits to the existing app unless explicitly requested.

The default mode is **draft / side-by-side generation**. The generator creates new files and runbooks; it does not rewrite or delete user code.

## Core Concepts

- **Porting skill**: repo-shipped agent-readable workflow, e.g. `skills/m3kit-app-port/SKILL.md`, teaching an AI/user how to inspect a page, choose generators, preserve source behavior, and produce a safe migration packet.
- **Analyzer**: a generator mode that inspects a target page/route/project and produces a porting plan without modifying source files except optional report output.
- **Porting packet**: generated folder with Spec Kit docs, mapping table, test plan, wiring runbook, and scaffolded side-by-side Nx libs/components.
- **Feature target**: a page, route, Angular component, or feature folder selected by the user.
- **Non-destructive generation**: generated code goes under new names/paths or a migration sandbox; original files are never removed or overwritten by default.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Analyze one existing page and produce a safe porting plan (Priority: P1)

As an application owner, I can run an m3kit porting generator against a single page/route/component and receive a clear analysis packet showing which m3kit libraries, feature layers, data-access seams, UI components, tests, and manual wiring steps are needed, so I understand the migration before any code is created.

**Independent Test**: Generator unit tests run against a fixture Nx workspace with a sample Angular page containing UI imports, service/data calls, route config, forms, and table-like markup. The generator produces only report files in dry-run/analyze mode and does not modify source files.

**Acceptance Scenarios**:

1. **Given** a target component path, route path, or project+page name, **When** `@m3kit/plugin:port-analyze` runs, **Then** it identifies the source files, route/module/project context, obvious UI needs (`shell`, `forms`, `table`, `dashboard`, `charts`, `feedback`, `state`, `ai` if relevant), and data-access seams.
2. **Given** an unsupported or ambiguous target, **When** analysis runs, **Then** it fails with an actionable error and no generated files.
3. **Given** a target page with no m3kit-compatible data/table/form needs, **When** analysis runs, **Then** it still emits a minimal plan and states that only `core/theme/shell` may be needed.
4. **Given** the user passes `--outputDir`, **When** analysis succeeds, **Then** the generator writes `porting-plan.md`, `component-inventory.md`, `data-access-map.md`, and `test-plan.md` under that output directory.
5. **Given** any source file, **When** analysis runs, **Then** the original app files are byte-for-byte unchanged.

---

### User Story 2 - Generate side-by-side Nx feature/data-access/ui layers (Priority: P1)

As an Nx app owner, I can generate a migration scaffold for a selected page that follows Nx best practices: feature library, data-access library, UI/components library, testing helpers, and route shell, all side-by-side and wired through clear contracts rather than invasive edits.

**Independent Test**: Generator unit tests assert generated file paths, project names/tags, imports, route snippets, tests, Storybook/Cypress artifacts where relevant, and no overwrite of existing files. Smoke tests run generated specs in a fixture workspace.

**Acceptance Scenarios**:

1. **Given** a source page target and desired domain name (e.g. `orders`), **When** `@m3kit/plugin:port-page --target=... --domain=orders --mode=scaffold` runs, **Then** it creates Nx-style libraries such as `libs/orders/feature-<page>`, `libs/orders/data-access`, and `libs/orders/ui` or repo-configured equivalents.
2. **Given** the generated feature shell, **When** inspected, **Then** container/data orchestration lives in feature/data-access, presentational m3kit wrappers live in UI, and imports respect Nx boundaries.
3. **Given** the selected m3kit libraries, **When** scaffolding runs, **Then** the generator either invokes/extends `lift` or prints the exact `lift` command to pull the needed libs and closure (`core`, `theme`, etc.).
4. **Given** files already exist at the destination, **When** scaffolding runs without `--force`, **Then** it refuses to overwrite and writes a conflict report/runbook instead.
5. **Given** `--apply=false` or default safe mode, **When** scaffolding completes, **Then** it does not modify the app route table or delete/move source page files; it emits route and import snippets in the runbook.

---

### User Story 3 - Enforce Spec Kit and TDD for every generated migration unit (Priority: P1)

As a maintainer, I can trust that every generated migration packet includes a Spec Kit artifact set and tests before implementation guidance, so AI-assisted or human-assisted migration remains evidence-driven rather than a blind rewrite.

**Independent Test**: Generator tests verify every generated migration packet contains `spec.md`, `plan.md`, `tasks.md`, `quickstart.md`, `contracts/*`, and `checklists/requirements.md`, plus RED-first TDD instructions and initial failing/pending specs for generated components/services.

**Acceptance Scenarios**:

1. **Given** a generated porting packet, **When** opened, **Then** it includes Spec Kit files scoped to the page migration and a `governance.yaml` with `non_destructive_default: true` and required verification gates.
2. **Given** generated data-access and feature code, **When** inspected, **Then** each service/facade/component has a colocated `.spec.ts` or explicit pending test scaffold with behavior names derived from the analysis.
3. **Given** generated UI wrappers, **When** inspected, **Then** they include Storybook and Cypress/component-test scaffolds where the target project supports them, following m3kit coverage rules.
4. **Given** a generated runbook, **When** followed manually, **Then** the user can wire the new route side-by-side, run tests, compare behavior, and only then choose to replace the old page.
5. **Given** AI support is used, **When** the skill is run, **Then** it instructs the agent to write failing tests before filling behavior and to preserve old files until explicit human approval.

---

### User Story 4 - Provide a reusable agent skill for application porting (Priority: P2)

As a user with an AI coding agent, I can load an m3kit-provided skill that explains the migration workflow, prompts for the target page, runs the analyzer/generators, and produces a reviewable porting packet with evidence and runbook.

**Independent Test**: The skill file is validated as a plain Markdown instruction set and its referenced commands match actual generator schemas. A fixture dry run follows the skill command sequence and produces the expected artifacts.

**Acceptance Scenarios**:

1. **Given** the repo checkout, **When** a user opens `skills/m3kit-app-port/SKILL.md`, **Then** it gives a step-by-step workflow: inspect target, run analyzer, generate side-by-side scaffold, write tests, wire manually, verify, and only then replace.
2. **Given** a page path, **When** an AI follows the skill, **Then** it never asks for broad app rewrite permission before first producing the analysis packet.
3. **Given** unknown app architecture, **When** the skill cannot infer layers, **Then** it asks for/records explicit assumptions and keeps generated code isolated.
4. **Given** a user wants AI-supported wiring, **When** the runbook is produced, **Then** it includes a safe prompt packet the user can paste into their agent with side-effect boundaries.

## Edge Cases

- Target app is Angular but not Nx: analyzer still emits a migration plan and recommends creating an Nx-compatible destination; code scaffolding is limited unless Nx project graph exists.
- Target page uses NgModules instead of standalone components: generated scaffold uses current m3kit standalone/Nx best practice and includes manual adapter notes.
- Target data access is hidden behind global stores/effects: analyzer marks data seams as `manual-review` rather than pretending to port them.
- Target files contain secrets or real customer data: analyzer must not copy raw data into docs; generated fixtures use placeholders/synthetic examples.
- Destination conflicts with existing generated files: generator refuses overwrite unless `--force` is explicit and records each overwritten path.
- Consumer wants automatic route replacement: out of scope for v1; runbook provides snippets only.

## Non-Goals

- No automatic destructive rewrite of user app files.
- No deleting, moving, or renaming the original page.
- No backend migration or database schema generation.
- No framework migration outside Angular/Nx in v1.
- No broad visual redesign beyond m3kit-compatible scaffolding.
- No npm publishing decision; plugin remains usable from local/file install unless separately approved.

## Success Metrics

- A fixture app page can be analyzed and scaffolded with zero source-file overwrites.
- Generated packet contains Spec Kit + runbook + tests for every generated layer.
- Plugin tests cover analysis, conflicts, inferred libs, generated file tree, and safe-mode behavior.
- The runbook is clear enough for a human to wire the generated feature manually.
