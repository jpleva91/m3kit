# Quickstart: Safe m3kit App Porting

## Analyze a page first

```sh
npx nx g @m3kit/plugin:port-analyze \
  --target=apps/acme/src/app/orders/orders-page.component.ts \
  --domain=orders \
  --page=orders-list \
  --outputDir=m3kit-porting/orders/orders-list
```

Review:

- `m3kit-porting/orders/orders-list/porting-plan.md`
- `component-inventory.md`
- `data-access-map.md`
- `test-plan.md`
- `analysis.json`

## Generate side-by-side scaffold

```sh
npx nx g @m3kit/plugin:port-page \
  --analysis=m3kit-porting/orders/orders-list/analysis.json \
  --domain=orders \
  --page=orders-list \
  --apply=false
```

This creates new feature/data-access/ui libs and a runbook. It does not modify your existing route table or delete old files.

## Lift required m3kit libs

Follow the generated runbook. It will either run or recommend a command like:

```sh
npx nx g @m3kit/plugin:lift --libs=shell,table,forms,feedback,state --scope=ui --ref=main
```

## Run tests

```sh
npx nx test orders-data-access
npx nx test orders-ui
npx nx test orders-feature-orders-list
```

Then wire the generated route manually using the runbook snippet, compare old and new behavior side-by-side, and only replace the old page after human approval.
