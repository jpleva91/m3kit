import {
  barChartAccessibilitySummary,
  chartRowsToText,
  donutChartAccessibilitySummary,
  lineChartAccessibilitySummary,
} from './chart-a11y';

describe('chart accessibility summaries', () => {
  it('summarizes line series ranges', () => {
    expect(
      lineChartAccessibilitySummary([{ name: 'Revenue', points: [{ x: 'Jan', y: 10 }, { x: 'Feb', y: 42 }] }]),
    ).toEqual({
      description: 'Revenue: 2 points, range 10 to 42',
      rows: [['Series', 'Point count', 'Minimum', 'Maximum'], ['Revenue', '2', '10', '42']],
    });
  });

  it('summarizes grouped and stacked bars with a table fallback', () => {
    const summary = barChartAccessibilitySummary(
      ['Q1', 'Q2'],
      [{ name: 'New', values: [2, 5] }, { name: 'Expansion', values: [3, 4] }],
      'stacked',
    );
    expect(summary.description).toContain('Stacked bar chart with 2 categories and 2 series');
    expect(summary.rows.at(-1)).toEqual(['Q2', 'Expansion', '4']);
  });

  it('summarizes donut slices by total and largest slice', () => {
    expect(donutChartAccessibilitySummary([{ label: 'Paid', value: 9 }, { label: 'Open', value: 3 }])).toEqual({
      description: 'Donut chart with 2 slices totaling 12; largest slice is Paid at 9.',
      rows: [['Slice', 'Value', 'Share'], ['Paid', '9', '75%'], ['Open', '3', '25%']],
    });
  });

  it('formats chart rows as a plain-text table equivalent', () => {
    expect(chartRowsToText([['A', 'B'], ['1', '2']])).toBe('A | B\n1 | 2');
  });
});
