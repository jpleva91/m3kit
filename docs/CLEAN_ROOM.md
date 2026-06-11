# Clean-Room Policy

This repository is a public, independently authored, clean-room reference
implementation of an Angular/Nx reporting architecture. This document is the
authoritative statement of the clean-room methodology under which every line of
code, documentation, and fixture data in this repository was produced. It is
kept current: if the policy changes, this file changes in the same commit.

Companion document: [`BOUNDARY_LOG.md`](./BOUNDARY_LOG.md) — the append-only
audit trail of every external source consulted while building this repository.

---

## 1. Authorship and independence statement

All content in this repository was written fresh, for this repository, by its
author(s) as independent open-source work. Nothing here was copied,
transcribed, paraphrased, or reconstructed from memory of any private or
proprietary codebase, document, ticket, design asset, or dataset. The
architecture and every non-trivial design pattern derive solely from the
public sources listed in §2 and from generic, industry-common reporting
concepts (tables, filters, sorting, pagination, export) that are public
knowledge.

This repository is independent open-source work authored by Jared Pleva under
his own personal-venture identity (readybench.io), unaffiliated with and not
on behalf of any employer.

Project planning *coordination* for this repository happens outside the
repository, while feature specifications are public in-repo Spec Kit
artifacts. No internal task identifiers, planning-tool references, tracker
IDs, or tool-workspace paths appear in repository files, commit messages, or
branch names; any planning text reused in repository docs is scrubbed of such
identifiers before inclusion.

**Spec Kit carve-out.** The official GitHub Spec Kit workflow files tracked in
this repository (`.specify/`, `.claude/skills/speckit-*`, the root `CLAUDE.md`,
and the contents of `specs/`) are deliberate public repository content. They
are generic, tool-standard artifacts, and they are themselves subject to every
rule in this policy: no external tracker IDs, no private-tool workspace paths,
and no organization-private references may appear inside them.

## 2. Permitted sources

The ONLY permissible inputs for design and implementation patterns are:

1. **Angular documentation** — https://angular.dev (and the versioned
   https://v19.angular.dev for the pinned major)
2. **Angular Material / CDK documentation** — https://material.angular.dev /
   https://material.angular.io (and the versioned
   https://v19.material.angular.io)
3. **NgRx documentation** (Signals / SignalStore) — https://ngrx.io
4. **Nx documentation** — https://nx.dev

Plus, for licensing and tooling mechanics:

5. **Apache License texts** — https://www.apache.org/licenses
6. **The public npm registry** — package metadata and version resolution
7. **Node.js release documentation** — https://nodejs.org (release schedule,
   LTS status)

Plus:

8. **Any other explicitly public, citable source**, provided it is logged in
   `docs/BOUNDARY_LOG.md` at the time of consultation — never retroactively.

Every non-obvious pattern in this repository must be traceable to one of these
sources via a BOUNDARY_LOG entry, a `docs/DECISIONS.md` entry, or a code
comment citation.

## 3. Prohibited inputs

The following may never be consulted, referenced, paraphrased, or reproduced —
directly or from memory of specifics — while working on this repository:

- Private or employer-proprietary source code of any kind, in any amount
  (including utility one-liners, regexes, validators, or test setup blocks)
- Proprietary API shapes: endpoint paths, request/response envelope field
  names, pagination token formats, error code catalogs
- Internal wikis, tickets, design documents, chat content, or runbooks
- Internal business workflows: approval chains, SLA rules, billing logic,
  report layouts matching any internal report
- Proprietary report/column definitions — the specific set, naming, ordering,
  formatting, or aggregation logic of any non-public report, even re-typed
  against a synthetic domain
- Real customer, vendor, employee, or transaction data — including
  "anonymized" derivatives
- Internal design assets: themes, palettes, logos, spacing systems, or
  recognizable design-system overrides
- Confidential architecture details: internal topology, gateway patterns,
  auth flows, caching strategies specific to any private system
- Screenshots or recordings of internal tools or dashboards, including
  cropped or redacted versions
- Credentials or secrets of any kind, including expired ones

**Doubt resolves to exclusion.** If there is any uncertainty whether something
is generic public knowledge versus privately derived, it is excluded until
cleared at a review gate.

## 4. Synthetic domains only

All demo, example, fixture, and documentation data uses exactly these
synthetic domains: **customers, orders, invoices, support tickets, products**.
No other domain vocabulary may appear in code, docs, tests, or fixtures. All
data is fabricated within this repository (factories/fixtures in
`libs/reporting/testing` or static JSON authored here) and is obviously fake —
no production-like datasets, no scraped data, no PII-shaped real values.

## 5. Third-party documentation snippets: licensing and attribution

Consulting documentation to be *informed by* a pattern is logged in
BOUNDARY_LOG. Where code or text is *adapted* from a documentation example
(rather than merely informed by it), the licensing of that source material is
respected explicitly:

- **Angular documentation content** is licensed **CC-BY-4.0**. Adapted prose
  or examples get a BOUNDARY_LOG entry plus an attribution note at the point
  of use (and in NOTICE-style attribution if substantial).
- **Angular Material example code** is licensed **MIT**. Adapted example code
  gets a BOUNDARY_LOG entry plus an attribution note; MIT terms are satisfied
  by preserving attribution.
- The **Apache-2.0 license text** itself is reproduced verbatim in `LICENSE`,
  as the license requires.

Each such case is recorded in the BOUNDARY_LOG with its license noted, even
when attribution is not strictly required ("attribution not required but
logged" is the default posture).

License policy for this repository: **Apache-2.0**, declared in `LICENSE` and
`package.json`. The decided header policy is **no per-file copyright
headers**; the repository-level `LICENSE` file plus a NOTICE-style statement
in the README carry the copyright and license declaration (recorded in
`docs/DECISIONS.md`).

## 6. Author pre-commit checklist

Walk this checklist before every commit/PR. Record outcomes and any judgment
calls in `docs/BOUNDARY_LOG.md`.

**Provenance & authorship**

- [ ] All code in this change was written fresh for this repository — never
      copied, transcribed, paraphrased-from-memory-of-a-specific-file, or
      "cleaned up" from any private codebase.
- [ ] No private repo, internal wiki, ticket system, design doc, or chat
      content was open or consulted while authoring.
- [ ] Every non-obvious pattern has a public-doc citation (§2 source, or a
      public source added to BOUNDARY_LOG.md).
- [ ] Apache-2.0 `LICENSE` intact at repo root; no per-file headers added
      (per the documented policy); `package.json` license field correct.
- [ ] Commit history is clean: no private-organization names, tracker IDs,
      internal URLs, or planning-tool references in commit messages, branch
      names, or PR descriptions.

**Identifiers & naming**

- [ ] No private-organization, product, internal service/system, team names,
      or internal acronyms anywhere (code, comments, docs, config, test
      names, fixture data, git history).
- [ ] Domain vocabulary is strictly from the synthetic set: customers,
      orders, invoices, support tickets, products.
- [ ] Identifier names (classes, interfaces, files, Nx project names, tags,
      CSS classes) follow generic Angular/Material/Nx community conventions
      and do not mirror any internal naming convention or recognizable
      internal type name.

**API shapes & architecture**

- [ ] Interfaces/contracts in `libs/reporting/core` derive from public
      primitives (e.g., CDK `DataSource`, publicly documented REST
      pagination/sort/filter idioms) and generic reporting needs — not from
      any proprietary API's field names, envelope shape, error model, or
      endpoint structure.
- [ ] Architecture choices (lib split, tags, phasing) are justified entirely
      by cited public Nx/Angular guidance.
- [ ] No confidential architecture knowledge embodied: no internal scaling
      tricks, performance workarounds, or integration patterns.

**Data & assets**

- [ ] All fixture data is synthetic and obviously fake (faker-style names,
      example.com emails, round numbers); zero real records.
- [ ] No screenshots, mockups, icons, fonts, palettes, or design tokens from
      non-public tools or brand assets — stock Material theming only.
- [ ] No internal business workflows described or encoded.

**Docs & process**

- [ ] `docs/BOUNDARY_LOG.md` has an entry for every source consulted while
      making this change, added at consultation time.
- [ ] `docs/DECISIONS.md` updated for any consequential decision.
- [ ] Defaults and magic numbers (page sizes, debounce times, retry counts)
      come from public docs or are obviously round values, with origin cited
      where non-obvious.
- [ ] Comments and doc text were written fresh against this repository's
      actual behavior.
- [ ] In-tree planning artifacts are limited to the sanitized Spec Kit set
      (`.specify/`, `.claude/skills/speckit-*`, the root `CLAUDE.md`,
      `specs/`) per the §1 carve-out, and none of them contain external
      tracker IDs, private-tool workspace paths, or organization-private
      references.
