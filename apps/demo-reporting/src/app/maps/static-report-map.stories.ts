import { Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { MapLayerDefinition, pointInGeoBounds } from '@m3kit/core';
import { syntheticBranchMapLayer, syntheticMichiganViewport } from '@m3kit/testing';

@Component({
  selector: 'app-static-report-map',
  standalone: true,
  template: `
    <section class="demo-map" aria-labelledby="demo-map-title">
      <div class="demo-map__header">
        <div>
          <p class="demo-map__eyebrow">Provider-neutral map shell</p>
          <h2 id="demo-map-title">Synthetic branch risk</h2>
          <p>
            Static SVG geography proves the baseline contract without API keys, network tiles,
            Google Maps types, or real customer locations.
          </p>
        </div>
        <dl class="demo-map__viewport" aria-label="Map viewport contract">
          <div><dt>Center</dt><dd>{{ viewport.center.lat }}, {{ viewport.center.lng }}</dd></div>
          <div><dt>Zoom</dt><dd>{{ viewport.zoom }}</dd></div>
          <div><dt>Visible features</dt><dd>{{ visibleFeatures.length }}</dd></div>
        </dl>
      </div>

      <div class="demo-map__content">
        <svg class="demo-map__svg" viewBox="0 0 640 360" role="img" aria-labelledby="map-svg-title map-svg-desc">
          <title id="map-svg-title">Static synthetic Michigan branch map</title>
          <desc id="map-svg-desc">
            Decorative no-key SVG map showing provider-neutral markers. The adjacent list is the
            keyboard and screen-reader equivalent.
          </desc>
          <rect x="30" y="32" width="580" height="296" rx="28" />
          <path d="M170 88 C260 34 398 58 476 122 C544 176 520 270 430 302 C318 342 176 300 126 218 C96 170 118 118 170 88Z" />
          @for (feature of visibleFeatures; track feature.id) {
            <g class="demo-map__marker" [attr.transform]="markerTransform(feature.point.lng, feature.point.lat)">
              <circle r="18" />
              <text text-anchor="middle" dy="5">{{ feature.value }}</text>
            </g>
          }
        </svg>

        <div class="demo-map__list" role="list" aria-label="Map marker table equivalent">
          @for (feature of visibleFeatures; track feature.id) {
            <button type="button" class="demo-map__item" role="listitem">
              <span>
                <strong>{{ feature.label }}</strong>
                <small>{{ feature.payload?.city }}, {{ feature.payload?.state }}</small>
              </span>
              <span class="demo-map__score">{{ feature.value }}</span>
            </button>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .demo-map {
        display: grid;
        gap: 1rem;
        padding: 1.5rem;
        color: var(--app-on-surface);
        background: var(--app-surface);
      }
      .demo-map__header,
      .demo-map__content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(16rem, 24rem);
        gap: 1rem;
        align-items: start;
      }
      .demo-map__eyebrow {
        margin: 0 0 0.25rem;
        color: var(--app-primary);
        font: var(--app-label-medium);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h2 { margin: 0 0 0.5rem; font: var(--app-headline-small); }
      p { margin: 0; max-width: 60ch; color: var(--app-on-surface-variant); }
      .demo-map__viewport {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
        margin: 0;
      }
      .demo-map__viewport div,
      .demo-map__item {
        border: 1px solid var(--app-outline-variant);
        border-radius: var(--app-radius-md);
        background: var(--app-surface-container-low);
      }
      .demo-map__viewport div { padding: 0.75rem; }
      dt { color: var(--app-on-surface-variant); font: var(--app-label-small); }
      dd { margin: 0.2rem 0 0; font: var(--app-title-small); }
      .demo-map__svg {
        width: 100%;
        min-height: 22rem;
        border: 1px solid var(--app-outline-variant);
        border-radius: var(--app-radius-lg);
        background: var(--app-surface-container-lowest);
      }
      .demo-map__svg rect { fill: var(--app-surface-container); stroke: var(--app-outline-variant); }
      .demo-map__svg path { fill: color-mix(in srgb, var(--app-primary) 10%, transparent); stroke: var(--app-primary); stroke-width: 2; }
      .demo-map__marker circle { fill: var(--app-tertiary); stroke: var(--app-surface); stroke-width: 4; }
      .demo-map__marker text { fill: var(--app-on-tertiary); font: 700 0.8rem var(--app-font-mono); }
      .demo-map__list { display: grid; gap: 0.5rem; }
      .demo-map__item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        width: 100%;
        padding: 0.85rem;
        color: inherit;
        text-align: left;
      }
      .demo-map__item:focus-visible { outline: 3px solid var(--app-primary); outline-offset: 2px; }
      .demo-map__item small { display: block; color: var(--app-on-surface-variant); }
      .demo-map__score { font: var(--app-title-medium); color: var(--app-primary); }
      @media (max-width: 760px) {
        .demo-map__header,
        .demo-map__content,
        .demo-map__viewport { grid-template-columns: 1fr; }
      }
    `,
  ],
})
class StaticReportMapStoryComponent {
  readonly layer: MapLayerDefinition = syntheticBranchMapLayer;
  readonly viewport = syntheticMichiganViewport;
  readonly visibleFeatures = this.layer.features.filter((feature) =>
    this.viewport.bounds ? pointInGeoBounds(feature.point, this.viewport.bounds) : true,
  );

  markerTransform(lng: number, lat: number): string {
    const bounds = this.viewport.bounds ?? { north: 43.3, east: -82.8, south: 42, west: -86 };
    const x = 30 + ((lng - bounds.west) / (bounds.east - bounds.west)) * 580;
    const y = 328 - ((lat - bounds.south) / (bounds.north - bounds.south)) * 296;
    return `translate(${x} ${y})`;
  }
}

const meta: Meta<StaticReportMapStoryComponent> = {
  component: StaticReportMapStoryComponent,
  title: 'Pages/Reporting/Static Map Adapter Seam',
  parameters: {
    docs: {
      description: {
        component:
          'No-key map demo using @m3kit/core GeoPoint/GeoBounds/MapLayerDefinition contracts. Google Maps, MapLibre, OpenLayers, and deck.gl remain optional adapter escape hatches only.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<StaticReportMapStoryComponent>;

export const NoKeyStaticMap: Story = {};
