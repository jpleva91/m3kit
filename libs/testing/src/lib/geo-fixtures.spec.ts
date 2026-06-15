import { syntheticBranchMapLayer, syntheticMichiganViewport } from './geo-fixtures';

describe('geo fixtures', () => {
  it('uses synthetic provider-neutral features only', () => {
    expect(syntheticBranchMapLayer.features).toHaveLength(3);
    expect(syntheticBranchMapLayer.description).toContain('No real customer');
    const points = syntheticBranchMapLayer.features.map((feature) => feature.point);
    expect({
      north: Math.max(...points.map((point) => point.lat)),
      east: Math.max(...points.map((point) => point.lng)),
      south: Math.min(...points.map((point) => point.lat)),
      west: Math.min(...points.map((point) => point.lng)),
    }).toEqual({
      north: 42.9634,
      east: -83.0458,
      south: 42.2808,
      west: -85.6681,
    });
  });

  it('exports a serializable no-key viewport', () => {
    expect(syntheticMichiganViewport.zoom).toBe(6);
    expect(JSON.parse(JSON.stringify(syntheticMichiganViewport))).toEqual(syntheticMichiganViewport);
  });
});
