# @m3kit/state

Headless NgRx SignalStore building blocks for m3kit reports. No templates,
no styles — composable `signalStoreFeature`s plus a theme-store factory,
depending only on `@m3kit/core` and `@ngrx/signals`.

- `withDataQuery<T>(options?)` — owns the query lifecycle (debounced text
  filter, field filters, sort, page) for any `TableDataSource<T>` and the
  fetched page (`rows`/`totalCount`/`loading`/`error`) via a `switchMap`ped
  `rxMethod`.
- `withSelection<T>(idOf)` — identity-keyed row selection (`toggle`,
  `select`, `deselect`, `clear`, `isSelected` computed predicate).
- `createThemeStore(config)` — root-provided brand + mode store,
  API-compatible with the demo `ThemeService`; persists to `localStorage`
  and applies `theme-<brand>` / `dark` classes to `<html>` reactively.

Docs pages live beside the sources (`*.docs.mdx`, rendered under `State/`
in the Storybook host). Run `nx test m3kit-state` / `nx lint m3kit-state`.
