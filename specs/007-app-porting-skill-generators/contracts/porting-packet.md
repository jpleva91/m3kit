# Contract: Porting Packet

A generated app-porting packet must contain:

```txt
m3kit-porting/<domain>/<page>/
  analysis.json
  porting-plan.md
  component-inventory.md
  data-access-map.md
  test-plan.md
  spec.md
  plan.md
  tasks.md
  quickstart.md
  runbook.md
  ai-wiring-prompt.md
  contracts/
    source-behavior.md
    data-access.md
    ui-states.md
  checklists/
    requirements.md
```

## Required Fields in `analysis.json`

- `schemaVersion`
- `target`
- `projectName`
- `domain`
- `page`
- `sourceFiles[]`
- `inferredM3kitLibs[]`
- `dataAccessSeams[]`
- `uiComponents[]`
- `routeSnippets[]`
- `manualReviewItems[]`
- `generatedAt`

## Safety Contract

- Original source files are never deleted.
- Existing destination files are never overwritten unless `--force` is explicit.
- Generated runbook must include rollback/manual wiring steps.
- Any copied example data must be synthetic or redacted.
