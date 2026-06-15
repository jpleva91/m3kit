/** Provider-neutral geospatial contracts for reporting surfaces.
 *
 * Core owns only plain data shapes and pure helpers. Vendor SDK types such as
 * `google.maps.LatLngLiteral`, MapLibre sources, OpenLayers features, or deck.gl
 * layers belong in optional adapters that translate to/from these contracts.
 */

/** Latitude/longitude point in WGS84 decimal degrees. */
export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

/** North/east/south/west bounds in WGS84 decimal degrees. */
export interface GeoBounds {
  readonly north: number;
  readonly east: number;
  readonly south: number;
  readonly west: number;
}

/** Stable domain feature shown by a map or by its accessible list alternative. */
export interface GeoFeature<TPayload = unknown> {
  readonly id: string;
  readonly label: string;
  readonly point: GeoPoint;
  readonly value?: number;
  readonly status?: string;
  readonly payload?: TPayload;
}

/** A provider-neutral layer definition. Adapters decide how to render it. */
export interface MapLayerDefinition<TPayload = unknown> {
  readonly id: string;
  readonly label: string;
  readonly kind: 'marker' | 'region' | 'line' | 'heatmap' | 'choropleth';
  readonly visible?: boolean;
  readonly features: readonly GeoFeature<TPayload>[];
  readonly description?: string;
}

/** Serializable viewport state for URL state, saved views, exports, and telemetry. */
export interface MapViewport {
  readonly center: GeoPoint;
  readonly zoom: number;
  readonly bounds?: GeoBounds;
}

/** Patch emitted by UI/adapters when a user pans/zooms a map. */
export interface MapViewportPatch {
  readonly center?: GeoPoint;
  readonly zoom?: number;
  readonly bounds?: GeoBounds;
}

/** Selection event emitted by map shells and accessible marker lists. */
export interface MapSelection<TPayload = unknown> {
  readonly layerId: string;
  readonly feature: GeoFeature<TPayload>;
  readonly source: 'map' | 'list' | 'keyboard' | 'programmatic';
}

/** Closed interval validation for WGS84 latitude/longitude values. */
export function isGeoPoint(value: unknown): value is GeoPoint {
  const point = value as GeoPoint;
  return (
    typeof point?.lat === 'number' &&
    Number.isFinite(point.lat) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    typeof point.lng === 'number' &&
    Number.isFinite(point.lng) &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

/** Normalizes unordered bounds, clamped to valid WGS84 ranges. */
export function normalizeGeoBounds(bounds: GeoBounds): GeoBounds {
  const north = clamp(Math.max(bounds.north, bounds.south), -90, 90);
  const south = clamp(Math.min(bounds.north, bounds.south), -90, 90);
  const east = clamp(Math.max(bounds.east, bounds.west), -180, 180);
  const west = clamp(Math.min(bounds.east, bounds.west), -180, 180);
  return { north, east, south, west };
}

/** Returns true when a point sits inside inclusive normalized bounds. */
export function pointInGeoBounds(point: GeoPoint, bounds: GeoBounds): boolean {
  const normalized = normalizeGeoBounds(bounds);
  return (
    isGeoPoint(point) &&
    point.lat <= normalized.north &&
    point.lat >= normalized.south &&
    point.lng <= normalized.east &&
    point.lng >= normalized.west
  );
}

/** Computes bounds for a point collection, or `null` for an empty collection. */
export function boundsForGeoPoints(points: readonly GeoPoint[]): GeoBounds | null {
  const valid = points.filter(isGeoPoint);
  if (valid.length === 0) {
    return null;
  }
  return {
    north: Math.max(...valid.map((point) => point.lat)),
    east: Math.max(...valid.map((point) => point.lng)),
    south: Math.min(...valid.map((point) => point.lat)),
    west: Math.min(...valid.map((point) => point.lng)),
  };
}

/** Applies a serializable viewport patch without mutating the previous state. */
export function applyMapViewportPatch(
  viewport: MapViewport,
  patch: MapViewportPatch,
): MapViewport {
  return {
    center: patch.center ?? viewport.center,
    zoom: patch.zoom ?? viewport.zoom,
    bounds: patch.bounds ?? viewport.bounds,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
