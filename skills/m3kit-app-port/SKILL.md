---
name: m3kit-app-port
description: Use when porting one Angular/Nx application page into m3kit with safe analyzer-first packets, side-by-side feature/data-access/ui scaffolds, RED-first tests, and manual wiring boundaries.
version: 1.0.0
author: m3kit
license: Apache-2.0
metadata:
  hermes:
    tags: [m3kit, angular, nx, app-porting, tdd]
    related_skills: []
---

# m3kit App Port

## Overview

Use this skill to port one page, route, or feature from an existing Angular/Nx app into an m3kit-shaped implementation without destructive rewrites. The workflow is analysis packet first, then side-by-side generated feature/data-access/ui scaffolds, then RED first tests and manual wiring.

The default posture is safe and reviewable: Do not delete, move, or rewrite the original page, route table, data services, or source fixtures. Generated files live beside the existing app under new library/packet paths so a human or AI agent can compare behavior before replacement.

## When to Use

Use when:

- A user gives a single Angular component path, route, or page folder to migrate toward m3kit.
- You need to identify m3kit libs, UI seams, data-access seams, test gaps, and wiring steps before writing code.
- You need Nx best-practice feature/data-access/ui scaffolds that can be dropped in manually.

Do not use for:

- Automatic route replacement or broad app rewrites.
- Backend/database migrations.
- Copying real customer data into fixtures or generated docs.
- Deleting old implementation files.

## Workflow

1. Inspect the target app first: read the page/component, adjacent route config, services/facades/stores, tests, and project metadata.
2. Run analyzer and review the packet:

```sh
npx nx g @m3kit/plugin:port-analyze \
  --target=apps/acme/src/app/orders/orders-page.component.ts \
  --domain=orders \
  --page=orders-list \
  --outputDir=m3kit-porting/orders/orders-list
```

3. Confirm the analysis packet first: `analysis.json`, `porting-plan.md`, `component-inventory.md`, `data-access-map.md`, and `test-plan.md`.
4. For an external app probe, copy only the target component/page and any tiny synthetic route fixture into `apps/demo-reporting/src/app/legacy-probe`, record a hash before/after analysis to prove the copied target stayed unchanged, and remove probe-only copied source before commit unless it is an intentionally authored synthetic fixture.
5. Generate side-by-side scaffolds only after the packet is reviewed:

```sh
npx nx g @m3kit/plugin:port-page \
  --analysis=m3kit-porting/orders/orders-list/analysis.json \
  --domain=orders \
  --page=orders-list \
  --destinationRoot=libs/orders \
  --apply=false \
  --force=false
```

6. Follow RED first TDD: keep the generated pending/manual-review specs failing for real business behavior before filling data-access or UI logic.
7. Follow the generated runbook for manual wiring. Add route snippets side-by-side; do not replace the original route until tests, comparison, and human review pass.
8. Verify generated libs and the app route comparison. Preserve rollback instructions.

## Generator Contract

`port-analyze` options used by this skill:

- `--target`: workspace-relative target component/page/route path.
- `--project`: optional Nx project name when ambiguous.
- `--domain`: optional domain name for the packet.
- `--page`: optional page/feature name.
- `--outputDir`: packet directory; defaults to `m3kit-porting/<domain>/<page>`.
- `--scope`: import/lift recommendation scope.
- `--write`: default true; false logs analysis only.

`port-page` options used by this skill:

- `--analysis`: path to `analysis.json`.
- `--target`: alternate inline target when no analysis exists.
- `--domain`: domain name for generated libraries.
- `--page`: page/feature name.
- `--mode`: `scaffold`, `analysis-only`, or `runbook-only`.
- `--destinationRoot`: destination root; defaults to `libs/<domain>`.
- `--scope`: alias prefix for lifted m3kit libs.
- `--libs`: optional m3kit lib override.
- `--apply`: default false; v1 never rewrites routes automatically.
- `--force`: default false; refuses existing destination files.

## Safety Rules

- analysis packet first: never start with a broad rewrite.
- RED first: write or preserve failing/pending behavior specs before implementing business logic.
- Do not delete source page, route, services, or tests.
- Do not copy real customer data or secrets into generated fixtures.
- Do not overwrite generated destinations unless `--force=true` is explicit and the conflict report has been reviewed.
- manual wiring only: route snippets in `runbook.md` are instructions, not automatic edits.
- external app paths are not direct generator targets yet; use the workspace-local legacy probe pattern above instead of broad filesystem mutation.

## Verification Checklist

- [ ] `port-analyze` produced the analysis files and original source files are byte-for-byte unchanged.
- [ ] `port-page` generated feature/data-access/ui libraries and Spec Kit packet files.
- [ ] Every generated service/facade/component has a colocated spec, Storybook/Cypress scaffold where appropriate, or explicit pending behavior.
- [ ] The generated `runbook.md` includes lift command, manual wiring snippet, test commands, comparison, and rollback.
- [ ] Tests/lint/build relevant to the plugin or generated workspace have been run and recorded.
