# Safe m3kit App Porting

m3kit app porting is an analyzer-first workflow for moving one Angular/Nx page toward m3kit without destructive rewrites. The output is a reviewable packet plus side-by-side Nx-style feature/data-access/ui scaffolds.

## Principles

- analysis packet first: inspect and document the target before code generation.
- RED first: generated scaffolds include tests/pending behavior seams before business logic is filled in.
- Do not delete, move, or rewrite original page, route, service, fixture, or test files by default.
- manual wiring only: generated route snippets go in `runbook.md`; the generator does not mutate the consumer route table.
- Synthetic fixtures only; no real customer data or secrets.

## Analyze one page

```sh
npx nx g @m3kit/plugin:port-analyze \
  --target=apps/acme/src/app/orders/orders-page.component.ts \
  --domain=orders \
  --page=orders-list \
  --outputDir=m3kit-porting/orders/orders-list
```

Review the analysis packet first:

- `analysis.json`
- `porting-plan.md`
- `component-inventory.md`
- `data-access-map.md`
- `test-plan.md`

The analyzer records inferred m3kit libraries, UI components, route snippets, source files, and `manual-review` data-access seams. It must leave source files unchanged.

## External app probes

`port-analyze` currently expects `--target` to be a workspace-relative file inside the m3kit Nx tree. For an external app probe, do not point the generator at arbitrary filesystem paths and do not let the probe mutate the source checkout.

Sanctioned pattern for a one-page legacy probe:

1. Copy only the small target component/page and any tiny synthetic route fixture needed for analysis into `apps/demo-reporting/src/app/legacy-probe`.
2. Record a hash before/after analysis for the copied target so the probe proves the analyzer is non-destructive.
3. Run `port-analyze` against the copied workspace-relative file and review the packet.
4. Remove the probe-only copied source and generated scratch libs before commit unless the test intentionally uses a synthetic fixture authored in this repo.

## Generate side-by-side scaffolds

```sh
npx nx g @m3kit/plugin:port-page \
  --analysis=m3kit-porting/orders/orders-list/analysis.json \
  --domain=orders \
  --page=orders-list \
  --destinationRoot=libs/orders \
  --apply=false \
  --force=false
```

The scaffold creates:

- `libs/<domain>/feature-<page>`: page/container shell.
- `libs/<domain>/data-access`: facade and manual-review behavior specs.
- `libs/<domain>/ui`: presentational summary/component shell with spec/story/cy coverage.
- `m3kit-porting/<domain>/<page>`: Spec Kit packet, runbook, contracts, checklist, and safe AI prompt.

## Wiring

Use generated `runbook.md` for manual wiring. Add the new route side-by-side, run tests, compare old/new behavior, and only then decide whether to replace the old page. Rollback should be as simple as removing the new route snippet because the original files remain untouched.

## Verification

Run at least:

```sh
npx nx run m3kit-plugin:test
npx nx run m3kit-plugin:lint
npx nx run m3kit-plugin:build
git diff --check
```

For spec/docs safety scans when available:

```sh
gitleaks detect --no-git --source specs --redact=20 --verbose
gitleaks detect --no-git --source docs --redact=20 --verbose
```
