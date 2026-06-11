# Internalization Guide

The ownership-transfer playbook: how to go from "we cloned the reference" to "this is
our code now." Read [ADOPTION_GUIDE.md](./ADOPTION_GUIDE.md) first — it covers what to
copy, the tag mapping, the import-path rename, and dependency reconciliation. This
guide covers the transfer itself.

The end state is unambiguous: the copied code lives in your workspace under your name,
your versioning, your CI, and your review process, with the upstream repository demoted
to a read-only reference. There is no shared-fork relationship and no sync-back.

## Step 1 — Copy the source in

1. Clone this repo somewhere temporary (or download a source archive):
   ```bash
   git clone <this-repo> /tmp/m3kit
   ```
2. Verify it is green before copying, so you know your baseline:
   ```bash
   cd /tmp/m3kit
   pnpm install --frozen-lockfile
   npx nx run-many -t lint test build
   ```
3. Copy the library sources — **source files only, not git history**:
   ```bash
   cp -r /tmp/m3kit/libs/reporting <your-workspace>/libs/
   ```
   Adjust the destination to your layout (e.g. `libs/shared/reporting`). Do **not**
   copy `apps/demo-reporting` (demo-only), `node_modules`, `dist`, the lockfile, or
   the root workspace config files — your workspace already has its own.
4. Copy in via a plain file copy, not `git subtree`/`git submodule`/fork-clone. The
   point of internalization is a clean break: your repo's history starts at your
   import commit, with no upstream objects in it.
5. Bring the license artifacts along — see "License obligations" below.
6. Perform the renames from the adoption guide: tsconfig path aliases
   (`@m3kit/*` → your scope), project names/tags in each `project.json`, and the
   workspace-wide import-specifier replace.
7. Commit the import as a single, clearly labeled commit, e.g.:
   ```
   feat(reporting): internalize m3kit libs (Apache-2.0, source import)
   ```
   Note the upstream repo URL and the commit/tag you copied from in the commit body.
   That one line is your entire provenance record — keep it accurate.

## Step 2 — Remove any upstream remote

If you experimented by cloning/forking rather than copying files, make sure no upstream
remote survives into your internal repo:

```bash
git remote -v                      # inspect
git remote remove upstream         # remove anything pointing at the reference repo
```

In your *internal* workspace (where you copied the files to), this is usually a non-step
because you copied files, not a repo. The check still matters if anyone bootstrapped by
cloning: an internal repository must have **no remote** pointing at the public reference.
Also verify no leftover `.git` directory was copied inside the lib folders:

```bash
find libs -name ".git" -maxdepth 4
```

## Step 3 — Take over versioning

- The imported code now versions with **your** workspace. There is no upstream version
  to track; this reference does not publish releases or maintain a compatibility
  matrix.
- If your monorepo versions per-lib, give the reporting libs your standard initial
  version. If it versions the repo as a whole, the libs simply ride along.
- Delete any mental model of "we're on reference version X." After import there is
  only "our reporting code." Record the import-source commit in the import commit
  message (Step 1) and move on.
- Future Angular/Material/CDK/NgRx upgrades happen through your normal upgrade
  process (`ng update`/`nx migrate`), applied to this code like any other first-party
  code. Do not wait for, or expect, upstream upgrade support.

## Step 4 — Take over CI

This reference deliberately ships no CI provider config; the verification contract is a
single command. Wire it into your existing CI:

```bash
npx nx run-many -t lint test build   # or scope it: nx run-many -t lint test build -p <your-reporting-projects>
```

Minimum bar to call the internalization CI-complete:

- [ ] Lint, unit tests, and build for the imported libs run in your pipeline on every PR.
- [ ] The module-boundary lint rules (Step 5) run as part of lint — boundaries that
      aren't CI-enforced will rot.
- [ ] The libs are covered by whatever affected-graph/caching strategy your workspace
      already uses (the libs use stock targets only, so nothing special is required).

## Step 5 — Re-run the boundary-violation proof

The reference proved its boundaries during scaffolding by introducing a deliberate
violation, watching lint fail, and reverting. **Repeat that proof in your workspace**
after the import, because your tag names and ESLint config are now different and the
proof does not transfer — only the method does.

1. Confirm your `@nx/enforce-module-boundaries` `depConstraints` express the
   rules (in your tag vocabulary):
   - core/contracts lib → depends on no internal project
   - material/ui lib → may depend only on core
   - testing lib → may depend only on core
   - dashboard lib → may depend only on core
   - forms lib → may depend only on core
   - consuming apps → may depend on all of the libs

   (The theme lib is SCSS-only and has no TypeScript entry point, so it sits
   outside the TS module-boundary graph — its coupling is via SCSS `@use` and
   the builder's `stylePreprocessorOptions.includePaths`.)
2. Introduce a deliberate violation: in the core lib, add a temporary import from the
   material lib, e.g.
   ```ts
   // TEMPORARY — boundary proof, do not commit
   import { /* anything exported */ } from '<your-scope>/reporting-material';
   ```
3. Run lint on the core lib and **confirm it fails** with an
   `@nx/enforce-module-boundaries` error. If lint passes, your constraints are not
   actually wired — stop and fix before proceeding.
4. Revert the violation and confirm lint is green again.
5. Record the proof (date, command, observed failure) wherever your team keeps
   engineering decisions/ADRs.

## License obligations (Apache-2.0)

This code is licensed under the Apache License, Version 2.0. Internalizing it into a
private workspace is exactly the use the license anticipates — including modifying it
and never publishing your changes. Your obligations when copying it in:

- **Retain the license text.** Keep a copy of the Apache-2.0 `LICENSE` available for
  the imported code. If your repo is already Apache-2.0, the root LICENSE covers it.
  If your repo uses a different (or proprietary) license, keep the Apache-2.0 text
  with the imported code (e.g. `libs/reporting/LICENSE` or a third-party-licenses
  manifest entry).
- **Retain attribution.** This repo's policy is **no per-file license headers**;
  attribution lives in the root `LICENSE` plus a NOTICE-style statement in the
  `README.md`. Carry that attribution into your workspace: add an entry to your NOTICE
  file or third-party attributions document naming this project, its license
  (Apache-2.0), and the source URL. Because there are no per-file headers, this
  manifest-level attribution is the thing you must preserve — do not skip it just
  because the source files look unmarked.
- **Mark significant modifications** if you redistribute. Within a private internal
  repo this is moot, but if the modified code ever leaves your organization, Apache-2.0
  §4 requires that modified files carry prominent notices stating that you changed
  them, alongside the retained license and attribution.
- **No trademark/endorsement claims.** Nothing in the license grants use of any
  contributor's name to promote your derivative.

This section is a practical summary, not legal advice; for anything beyond internal
use, read the license text itself and consult your own counsel/OSS policy.

## Point of no return — final checklist

Work through this once. When every box is checked, the internalization is complete and
**upstream becomes reference-only**: you may read it for ideas, but there is no
sync-back, no upstream issue support, no expectation that upstream changes will be
merged into your copy, and no expectation that your improvements flow back.

- [ ] `libs/reporting/*` source copied into the consumer workspace; `apps/demo-reporting`
      and the reference's root config/docs **not** copied.
- [ ] Import paths renamed (`@m3kit/*` → your scope); zero remaining references to
      `@m3kit/core|material|testing|dashboard|forms` in the workspace, and no
      remaining SCSS `@use 'm3kit-theme'` references under the old name if you
      renamed the theme entry point.
- [ ] Project names and tags renamed into your workspace's taxonomy.
- [ ] Dependencies reconciled: Angular / Material / CDK / `@ngrx/signals` majors match
      the consumer workspace; CDK version equals Material version; no attempt to hold
      the reference's pins.
- [ ] No git remote anywhere in the internal repo points at the upstream reference; no
      stray `.git` directories inside the copied lib folders.
- [ ] Import commit landed, naming the upstream URL and source commit/tag.
- [ ] Versioning owned internally; no internal process refers to upstream versions.
- [ ] CI runs lint + test + build for the imported libs on every PR.
- [ ] Boundary-violation proof re-run in the consumer workspace: deliberate violation
      failed lint, was reverted, and the proof was recorded.
- [ ] Apache-2.0 LICENSE retained and NOTICE-style attribution added to your
      third-party attributions.
- [ ] Team informed: this code is now first-party. Bugs are fixed here, upgrades happen
      here, and the upstream repository is a historical reference, nothing more.
