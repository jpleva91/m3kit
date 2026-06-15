import { chartExportFilename, svgMarkupForExport, svgMarkupToDataUri } from './chart-export';

describe('chart SVG export helpers', () => {
  it('adds namespace and metadata without browser APIs', () => {
    expect(svgMarkupForExport('<svg viewBox="0 0 10 10"></svg>', { title: 'A & B' })).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>A &amp; B</title></svg>',
    );
  });

  it('creates data URIs and safe filenames', () => {
    expect(svgMarkupToDataUri('<svg></svg>')).toContain('data:image/svg+xml;charset=utf-8,');
    expect(chartExportFilename('Revenue by Region!')).toBe('revenue-by-region.svg');
  });

  it('rejects non-svg markup', () => {
    expect(() => svgMarkupForExport('<div></div>')).toThrow('Expected SVG markup');
  });
});
