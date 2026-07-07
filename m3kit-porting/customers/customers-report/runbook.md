# Runbook: customers/customers-report

## analysis packet first
Review `analysis.json`, `data-access-map.md`, and this runbook before editing app routes.

## Lift m3kit libs

```sh
npx nx g @m3kit/plugin:lift --libs=shell,forms,table,feedback,state --scope=m3kit
```

## manual wiring
Add a side-by-side route only after generated tests pass:

```ts
{ path: 'customers-report', loadComponent: () => import('@m3kit/customers/feature-customers-report').then((m) => m.CustomersReportPageComponent) }
```

Do not delete the old route/page. Compare behavior first.

## Rollback
Remove only the new side-by-side route snippet and keep original files untouched.
