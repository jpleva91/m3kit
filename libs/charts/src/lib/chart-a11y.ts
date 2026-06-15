/** Text equivalents for dependency-free SVG charts.
 *
 * The helpers are pure so stories/tests can assert exactly what screen-reader
 * descriptions, prose fallbacks, and table equivalents will say. Components use
 * the descriptions in SVG `<title>/<desc>` while docs/stories can surface the
 * `rows` as an adjacent table when the chart carries analytical meaning.
 */

export interface ChartAccessibilitySummary {
  readonly description: string;
  readonly rows: readonly (readonly string[])[];
}

export interface ChartSeriesLike {
  readonly name: string;
  readonly values: readonly number[];
}

export interface LineChartSeriesLike {
  readonly name: string;
  readonly points: readonly { readonly x: number | string | Date; readonly y: number }[];
}

export interface DonutSliceLike {
  readonly label: string;
  readonly value: number;
}

export function lineChartAccessibilitySummary(
  series: readonly LineChartSeriesLike[],
): ChartAccessibilitySummary {
  const plotted = series.filter((item) => item.points.length > 0);
  if (plotted.length === 0) {
    return { description: 'No line chart data available.', rows: [['Series', 'Point count', 'Minimum', 'Maximum']] };
  }
  const rows = plotted.map((item) => {
    const values = item.points.map((point) => point.y);
    return [item.name, String(values.length), formatNumber(Math.min(...values)), formatNumber(Math.max(...values))];
  });
  const description = rows
    .map(([name, count, min, max]) => `${name}: ${count} points, range ${min} to ${max}`)
    .join('; ');
  return { description, rows: [['Series', 'Point count', 'Minimum', 'Maximum'], ...rows] };
}

export function barChartAccessibilitySummary(
  categories: readonly string[],
  series: readonly ChartSeriesLike[],
  mode: 'grouped' | 'stacked' = 'grouped',
): ChartAccessibilitySummary {
  if (categories.length === 0 || series.length === 0) {
    return { description: 'No bar chart data available.', rows: [['Category', 'Series', 'Value']] };
  }
  const rows = categories.flatMap((category, categoryIndex) =>
    series.map((item) => [category, item.name, formatNumber(item.values[categoryIndex] ?? 0)]),
  );
  const totals = categories.map((category, categoryIndex) => ({
    category,
    total: series.reduce((sum, item) => sum + (item.values[categoryIndex] ?? 0), 0),
  }));
  const peak = totals.reduce((best, current) => (current.total > best.total ? current : best));
  return {
    description: `${mode === 'stacked' ? 'Stacked' : 'Grouped'} bar chart with ${categories.length} categories and ${series.length} series; highest category is ${peak.category} at ${formatNumber(peak.total)}.`,
    rows: [['Category', 'Series', 'Value'], ...rows],
  };
}

export function donutChartAccessibilitySummary(
  slices: readonly DonutSliceLike[],
): ChartAccessibilitySummary {
  const visible = slices.filter((slice) => slice.value > 0);
  const total = visible.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) {
    return { description: 'No donut chart data available.', rows: [['Slice', 'Value', 'Share']] };
  }
  const rows = visible.map((slice) => [
    slice.label,
    formatNumber(slice.value),
    `${formatNumber((slice.value / total) * 100)}%`,
  ]);
  const largest = visible.reduce((best, current) => (current.value > best.value ? current : best));
  return {
    description: `Donut chart with ${visible.length} slices totaling ${formatNumber(total)}; largest slice is ${largest.label} at ${formatNumber(largest.value)}.`,
    rows: [['Slice', 'Value', 'Share'], ...rows],
  };
}

export function chartRowsToText(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.join(' | ')).join('\n');
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, '');
}
