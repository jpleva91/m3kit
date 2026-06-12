import { Tree, formatFiles, joinPathFragments, logger, names } from '@nx/devkit';

import type { BrandGeneratorSchema } from './schema';

/** Path of the demo app's brand aggregator when running inside m3kit. */
const M3KIT_AGGREGATOR = 'apps/demo-reporting/src/styles/_theme.scss';

/** Default brand's palette file — the template source for new palettes. */
const INSTRUMENTS_COLORS = 'libs/theme/src/m3kit-theme/themes/instruments/_colors.scss';

/**
 * Scaffolds a brand as a pure token re-emission against the m3kit-theme
 * contract: a `_<name>-colors.scss` palette file plus a `_<name>.scss`
 * module exposing `brand-light()` / `brand-dark()` (templated from the
 * shipped brands). Registration is applied automatically when run inside
 * m3kit itself; otherwise the steps are printed.
 */
export async function brandGenerator(tree: Tree, options: BrandGeneratorSchema): Promise<void> {
  const { fileName, className } = names(options.name);
  const insideM3kit = tree.exists(M3KIT_AGGREGATOR);
  const directory =
    options.directory ?? (insideM3kit ? 'apps/demo-reporting/src/styles/themes' : 'styles/themes');

  tree.write(
    joinPathFragments(directory, `_${fileName}-colors.scss`),
    colorsScss(tree, fileName, options),
  );
  tree.write(joinPathFragments(directory, `_${fileName}.scss`), brandScss(fileName, className, options));

  if (insideM3kit) {
    registerInAggregator(tree, fileName);
  }
  printInstructions(fileName, className, options, insideM3kit);

  await formatFiles(tree);
}

/**
 * Palette file: copies the Instruments palettes as compile-clean
 * placeholders (template from an existing brand) with the real seeds
 * documented, to be regenerated via the Material schematic.
 */
function colorsScss(tree: Tree, fileName: string, options: BrandGeneratorSchema): string {
  const header = `// "${fileName}" palettes — PLACEHOLDER (copied from the Instruments brand so
// the workspace compiles). Regenerate from the real seeds with:
//
//   npx nx g @angular/material:theme-color \\
//     --primary-color='${options.primary}' \\
//     --tertiary-color='${options.tertiary}' \\
//     --neutral-color='${options.neutral}'
//
// then replace the palette maps below with the generated output.
`;
  const instruments = tree.exists(INSTRUMENTS_COLORS)
    ? (tree.read(INSTRUMENTS_COLORS, 'utf-8') ?? '')
    : null;
  if (instruments) {
    return `${header}\n${instruments}`;
  }
  return `${header}
// The Instruments template palettes were not found in this workspace
// (lift the \`theme\` lib first, or paste the schematic output here).
@error '${fileName}-colors: regenerate this file with \`npx nx g @angular/material:theme-color\` (seeds above).';
`;
}

/** Brand module implementing the two-mixin contract from `m3kit-theme`. */
function brandScss(fileName: string, className: string, options: BrandGeneratorSchema): string {
  return `@use '@angular/material' as mat;
@use 'm3kit-theme' as contract;
@use './${fileName}-colors' as palettes;

/// "${className}" — scaffolded brand. A pure token re-emission against the
/// m3kit-theme contract (see libs/theme/src/m3kit-theme/_contract.scss):
/// no component CSS, no per-brand selectors. Seeds — primary
/// \`${options.primary}\`, tertiary \`${options.tertiary}\`, neutral \`${options.neutral}\`.
///
/// TODO(brand): replace the placeholder typography, status pairs, and
/// chart palettes below with this brand's real values (see DESIGN.md
/// for the binding rules; docs/THEMING.md for the full walkthrough).

$_typography: (
  plain-family: 'Instrument Sans',
  brand-family: 'Instrument Sans',
  bold-weight: 600,
);

/// Status badge tokens (container / on-container pairs); every kind in
/// contract.$status-kinds must be present.
$_status-light: (
  draft: (
    bg: #e2e1ec,
    fg: #303039,
  ),
  sent: (
    bg: #dce1ff,
    fg: #001550,
  ),
  paid: (
    bg: #a5f2bb,
    fg: #00210d,
  ),
  overdue: (
    bg: #ffdad6,
    fg: #410002,
  ),
  void: (
    bg: #efdbff,
    fg: #300a52,
  ),
);

$_status-dark: (
  draft: (
    bg: #45464f,
    fg: #e2e1ec,
  ),
  sent: (
    bg: #003ab3,
    fg: #dce1ff,
  ),
  paid: (
    bg: #00522a,
    fg: #a5f2bb,
  ),
  overdue: (
    bg: #93000a,
    fg: #ffdad6,
  ),
  void: (
    bg: #543579,
    fg: #efdbff,
  ),
);

/// Chart series palette (--app-chart-1..6): seeded with the brand's
/// primary and tertiary; replace the remaining four per DESIGN.md.
$_chart-light: ${options.primary}, ${options.tertiary}, #0e7490, #6b46c1, #1a6b3a, #9d174d;
$_chart-dark: ${options.primary}, ${options.tertiary}, #5ec8e0, #b79cff, #6fcf8f, #f286b2;

/// Emits the full light theme: color, typography, density, status,
/// radius, and chart-series tokens.
@mixin brand-light() {
  @include mat.theme(
    (
      color: (
        theme-type: light,
        primary: palettes.$primary-palette,
        tertiary: palettes.$tertiary-palette,
      ),
      typography: $_typography,
      density: 0,
    )
  );
  @include contract.status-tokens($_status-light);
  @include contract.radius-tokens();
  @include contract.chart-tokens($_chart-light...);
  color-scheme: light;
}

/// Re-emits only what changes in dark mode; typography, density, and
/// radius cascade from the light emission.
@mixin brand-dark() {
  @include mat.theme(
    (
      color: (
        theme-type: dark,
        primary: palettes.$primary-palette,
        tertiary: palettes.$tertiary-palette,
      ),
    )
  );
  @include contract.status-tokens($_status-dark);
  @include contract.chart-tokens($_chart-dark...);
  color-scheme: dark;
}
`;
}

/** Inside m3kit: adds the `@use` and the two selector blocks (idempotent). */
function registerInAggregator(tree: Tree, fileName: string): void {
  const content = tree.read(M3KIT_AGGREGATOR, 'utf-8') ?? '';
  if (content.includes(`theme-${fileName}`)) {
    return;
  }
  const useLine = `@use './themes/${fileName}';`;
  const lastUse = content.lastIndexOf("@use './themes/");
  const lineEnd = content.indexOf('\n', lastUse);
  const withUse =
    lastUse >= 0
      ? `${content.slice(0, lineEnd + 1)}${useLine}\n${content.slice(lineEnd + 1)}`
      : `${useLine}\n${content}`;

  const block = `
  html.theme-${fileName} {
    @include ${fileName}.brand-light();
  }

  html.theme-${fileName}.dark {
    @include ${fileName}.brand-dark();
  }
`;
  const closing = withUse.lastIndexOf('}');
  const registered =
    closing >= 0 ? `${withUse.slice(0, closing)}${block}${withUse.slice(closing)}` : withUse;
  tree.write(M3KIT_AGGREGATOR, registered);
  logger.info(`brand: registered '${fileName}' in ${M3KIT_AGGREGATOR}`);
}

/** Prints the remaining registration steps (see docs/THEMING.md). */
function printInstructions(
  fileName: string,
  className: string,
  options: BrandGeneratorSchema,
  insideM3kit: boolean,
): void {
  logger.info(`
brand: '${fileName}' scaffolded ───────────────────────────────────────

1. Regenerate the palettes from the real seeds (placeholders shipped):
     npx nx g @angular/material:theme-color \\
       --primary-color='${options.primary}' --tertiary-color='${options.tertiary}' --neutral-color='${options.neutral}'
2. ${
    insideM3kit
      ? `Aggregator registration applied to ${M3KIT_AGGREGATOR}.`
      : `Register the brand in your theme aggregator:
     @use './themes/${fileName}';
     html.theme-${fileName} { @include ${fileName}.brand-light(); }
     html.theme-${fileName}.dark { @include ${fileName}.brand-dark(); }`
  }
3. Add '${fileName}' to the ThemeBrand union / THEME_BRANDS list (and the
   layout-preset map) in your theme service, load the brand fonts, and add
   the brand to the Storybook toolbar — full walkthrough: docs/THEMING.md,
   worked exemplar: specs/002-exemplar-add-brand/.
4. Verify the brand x mode matrix in the Material Parity gallery
   (all stories presentable in ${className} light + dark).
`);
}

export default brandGenerator;
