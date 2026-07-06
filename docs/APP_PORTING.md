# App Porting with m3kit

m3kit's app-porting workflow is designed for **safe source-internalization and side-by-side migration**, not destructive rewrites.

A user picks one page/route/component. The plugin analyzes it, recommends the m3kit libraries needed, and generates a migration packet with Nx best-practice layers:

- `feature-*` for route/container orchestration,
- `data-access` for API/store/facade seams,
- `ui` for presentational m3kit-compatible components,
- Spec Kit artifacts and tests for every generated unit,
- a runbook showing how to wire the new route manually.

## Safety model

Default behavior:

- original page files are unchanged,
- generated code is side-by-side,
- route replacement is a runbook snippet, not an automatic mutation,
- existing destination files are not overwritten without `--force`,
- business data in docs/fixtures must be synthetic or redacted.

## Intended commands

```sh
npx nx g @m3kit/plugin:port-analyze \
  --target=apps/acme/src/app/orders/orders-page.component.ts \
  --domain=orders \
  --page=orders-list

npx nx g @m3kit/plugin:port-page \
  --analysis=m3kit-porting/orders/orders-list/analysis.json \
  --domain=orders \
  --page=orders-list \
  --apply=false
```

## Relationship to `lift`

`lift` remains the primitive for pulling m3kit libraries into a consumer workspace. App porting uses the analyzer output to recommend or run the appropriate lift closure, then builds feature/data-access/ui scaffolds around the user's page.

## Relationship to AI agents

The repo ships `skills/m3kit-app-port/SKILL.md` so a human or agent can follow the workflow. The skill explicitly requires TDD, Spec Kit artifacts, non-destructive generation, and human approval before route replacement.
