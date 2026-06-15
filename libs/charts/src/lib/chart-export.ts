/** Dependency-free SVG export helpers.
 *
 * These helpers intentionally stop at SVG markup and data URIs. Browser download
 * triggers, PNG rasterization, PDF/XLSX export, and server jobs are adapter/app
 * responsibilities that require a new ADR if they enter the baseline.
 */

export interface SvgExportOptions {
  readonly title?: string;
  readonly description?: string;
}

export function svgMarkupForExport(svg: string, options: SvgExportOptions = {}): string {
  const trimmed = svg.trim();
  if (!trimmed.startsWith('<svg')) {
    throw new Error('Expected SVG markup starting with <svg.');
  }
  const metadata = [
    options.title ? `<title>${escapeXml(options.title)}</title>` : '',
    options.description ? `<desc>${escapeXml(options.description)}</desc>` : '',
  ].join('');
  const withNamespace = trimmed.includes('xmlns=')
    ? trimmed
    : trimmed.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return metadata ? withNamespace.replace(/<svg([^>]*)>/, `<svg$1>${metadata}`) : withNamespace;
}

export function svgMarkupToDataUri(svg: string, options: SvgExportOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkupForExport(svg, options))}`;
}

export function chartExportFilename(name: string, extension = 'svg'): string {
  const safe = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'chart';
  return `${safe}.${extension.replace(/^\./, '')}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
