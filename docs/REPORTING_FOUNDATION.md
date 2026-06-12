# Reporting Foundation

How to build enterprise report pages on the `@m3kit/core` reporting
contracts — load states, typed errors, versioned query serialization, saved
views, the export baseline, temporal policy, and telemetry — and where the
kit's baseline ends and your adapters begin.

Companion to `specs/005-reporting-foundation/` (the feature that introduced
these contracts) and ADR-016 in `docs/DECISIONS.md` (the recorded
decisions). Sections below are filled as the feature lands.

## Server-side query contract

How `DataQuery` and `DataPage<T>` map to a real backend: the request your
server receives (text/field filters, sort, page index/size), the response it
returns (`rows` + `totalCount`), connect-free fetch semantics, and a worked
translation example from `DataQuery` to an HTTP request and back.

> To be filled: contract walkthrough + backend translation example.

## Load-state taxonomy → feedback components

The six `LoadState` kinds (`idle`, `loading`, `refreshing`, `success`,
`empty`, `error`) plus the `stale` flag, and the recommended
`@m3kit/feedback` composition for each — `m3k-skeleton` for first load,
table + progress for refreshing, `m3k-empty-state`, `m3k-error-state` with
retry, `m3k-banner` for stale data.

> To be filled: state → component mapping table + the demo-hosted
> composition story reference.

## Saved views + URL state

The versioned `SavedView` model, validation via `applySavedView` against a
`TableDefinition`, and the URL-shareable query pattern
(`encodeDataQueryParam`/`decodeDataQueryParam`, graceful fallback on bad
input) — including which demo files are app policy you replace (router
sync, in-memory registry).

> To be filled: pattern walkthrough + app-policy file map.

## Exports

The export contracts (`ExportRequest`/`ExportResult`, format, scope, column
projection) and the pure CSV/JSON baseline helpers — RFC-4180-style
escaping, formula-injection neutralization, deterministic filenames. The
browser download trigger is app-side code, never core.

> To be filled: export path walkthrough from live query to downloaded file.

## Temporal conventions

`ReportFormattingPolicy` (locale, IANA timezone, optional currency),
`DateRange` as UTC ISO instants with half-open `[start, end)` semantics as
the kit-wide convention, and timezone-correct relative-range resolution
(`resolveDateRange`) via `Intl` only.

> To be filled: conventions + relative-range vocabulary.

## Telemetry + redaction

The `ReportTelemetryEvent` union and `ReportTelemetryReporter` interface,
the `@m3kit/state` injection token (no-op default), and the redaction rule:
events identify queries by `dataQueryHash` only — never raw filter text,
never row data.

> To be filled: event catalog + redaction rule documentation.

## Baseline vs. adapters

What the kit ships versus what consumers own.

| Capability | Baseline (in-kit) | Adapter / consumer code |
| --- | --- | --- |
| _To be filled per ADR-016: contracts + CSV/JSON baseline vs. XLSX/PDF/server export jobs, persistence backends, telemetry sinks._ | | |
