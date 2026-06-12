#!/usr/bin/env node
/**
 * m3kit CLI shim — maps `m3kit add <libs...>` onto the @m3kit/plugin:lift
 * Nx generator, so consumers can run (from their Nx workspace root):
 *
 *   npx m3kit add table dashboard --scope=ui --ref=main
 *
 * Everything after the lib names is forwarded to the generator verbatim
 * (`--scope`, `--ref`, `--repo`, `--dry-run`, ...).
 */
import { spawnSync } from 'child_process';

const USAGE = `m3kit — source-internalize m3kit libs into your Nx workspace

Usage:
  m3kit add <libs...> [--scope=<alias-prefix>] [--ref=<git-ref>] [--repo=<owner/repo>] [--dry-run]

Examples:
  m3kit add table                       # lifts table + core + theme
  m3kit add dashboard charts --scope=acme
  m3kit add shell --ref=v1.0.0

Libs: core, theme, state, table, testing, dashboard, charts, forms, shell.
Requires @m3kit/plugin to be resolvable in the target workspace.
`;

function main(argv: readonly string[]): number {
  const [command, ...rest] = argv;
  if (command !== 'add' || rest.length === 0 || rest.includes('--help') || rest.includes('-h')) {
    process.stdout.write(USAGE);
    return command === 'add' || command === undefined || command === '--help' ? 0 : 1;
  }

  const libs = rest.filter((arg) => !arg.startsWith('-'));
  const flags = rest.filter((arg) => arg.startsWith('-'));
  if (libs.length === 0) {
    process.stdout.write(USAGE);
    return 1;
  }

  const result = spawnSync(
    'npx',
    ['nx', 'generate', '@m3kit/plugin:lift', `--libs=${libs.join(',')}`, ...flags],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  );
  return result.status ?? 1;
}

process.exit(main(process.argv.slice(2)));
