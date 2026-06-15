import {
  applyMapViewportPatch,
  boundsForGeoPoints,
  isGeoPoint,
  normalizeGeoBounds,
  pointInGeoBounds,
} from './geo';

describe('geo contracts', () => {
  it('validates WGS84 points without vendor SDK types', () => {
    expect(isGeoPoint({ lat: 42.28, lng: -83.74 })).toBe(true);
    expect(isGeoPoint({ lat: 120, lng: -83.74 })).toBe(false);
    expect(isGeoPoint({ lat: 42.28, lng: Number.NaN })).toBe(false);
  });

  it('normalizes unordered bounds and clamps invalid extremes', () => {
    expect(normalizeGeoBounds({ north: -10, south: 50, east: -200, west: 200 })).toEqual({
      north: 50,
      east: 180,
      south: -10,
      west: -180,
    });
  });

  it('checks inclusive point membership in bounds', () => {
    const bounds = { north: 43, east: -83, south: 42, west: -84 };
    expect(pointInGeoBounds({ lat: 42.5, lng: -83.5 }, bounds)).toBe(true);
    expect(pointInGeoBounds({ lat: 41.9, lng: -83.5 }, bounds)).toBe(false);
  });

  it('builds bounds from valid points and ignores invalid rows', () => {
    expect(
      boundsForGeoPoints([
        { lat: 42.2, lng: -83.9 },
        { lat: 42.5, lng: -83.2 },
        { lat: 100, lng: -83.2 },
      ]),
    ).toEqual({ north: 42.5, east: -83.2, south: 42.2, west: -83.9 });
    expect(boundsForGeoPoints([])).toBeNull();
  });

  it('applies viewport patches immutably', () => {
    const initial = { center: { lat: 42, lng: -84 }, zoom: 7 };
    expect(applyMapViewportPatch(initial, { zoom: 9 })).toEqual({
      center: { lat: 42, lng: -84 },
      zoom: 9,
    });
    expect(initial.zoom).toBe(7);
  });
});
