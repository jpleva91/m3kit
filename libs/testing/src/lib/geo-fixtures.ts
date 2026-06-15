import type { MapLayerDefinition, MapViewport } from '@m3kit/core';

export interface SyntheticBranchLocation {
  readonly branchId: string;
  readonly city: string;
  readonly state: string;
  readonly riskScore: number;
  readonly openIncidents: number;
}

export const syntheticBranchMapLayer: MapLayerDefinition<SyntheticBranchLocation> = {
  id: 'synthetic-branch-risk',
  label: 'Synthetic branch risk',
  kind: 'marker',
  description: 'No real customer or operational locations; demo-only Midwest sample points.',
  features: [
    {
      id: 'ann-arbor',
      label: 'Ann Arbor sample branch',
      point: { lat: 42.2808, lng: -83.743 },
      value: 72,
      status: 'watch',
      payload: { branchId: 'BR-001', city: 'Ann Arbor', state: 'MI', riskScore: 72, openIncidents: 4 },
    },
    {
      id: 'detroit',
      label: 'Detroit sample branch',
      point: { lat: 42.3314, lng: -83.0458 },
      value: 44,
      status: 'stable',
      payload: { branchId: 'BR-002', city: 'Detroit', state: 'MI', riskScore: 44, openIncidents: 2 },
    },
    {
      id: 'grand-rapids',
      label: 'Grand Rapids sample branch',
      point: { lat: 42.9634, lng: -85.6681 },
      value: 88,
      status: 'critical',
      payload: { branchId: 'BR-003', city: 'Grand Rapids', state: 'MI', riskScore: 88, openIncidents: 7 },
    },
  ],
};

export const syntheticMichiganViewport: MapViewport = {
  center: { lat: 42.65, lng: -84.35 },
  zoom: 6,
  bounds: { north: 43.3, east: -82.8, south: 42.0, west: -86.0 },
};
