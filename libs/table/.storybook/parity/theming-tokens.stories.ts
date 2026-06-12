import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';

interface TokenSwatch {
  readonly token: string;
  readonly varRef: string;
  value: string;
}

interface StatusSwatch {
  readonly kind: string;
  readonly bgRef: string;
  readonly fgRef: string;
  bg: string;
  fg: string;
}

const MAT_SYS_COLOR_TOKENS = [
  'primary',
  'on-primary',
  'primary-container',
  'on-primary-container',
  'secondary',
  'on-secondary',
  'secondary-container',
  'on-secondary-container',
  'tertiary',
  'on-tertiary',
  'tertiary-container',
  'on-tertiary-container',
  'error',
  'on-error',
  'error-container',
  'on-error-container',
  'surface',
  'on-surface',
  'surface-variant',
  'on-surface-variant',
  'surface-container-lowest',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
  'inverse-surface',
  'inverse-on-surface',
  'inverse-primary',
  'outline',
  'outline-variant',
] as const;

const STATUS_KINDS = ['draft', 'sent', 'paid', 'overdue', 'void'] as const;
const CHART_INDICES = [1, 2, 3, 4, 5, 6] as const;
const RADIUS_TOKENS = ['card', 'control', 'badge'] as const;

/**
 * Live overview of the theming contract: every `--mat-sys-*` color role and
 * the closed `--app-*` contract (status pairs, chart palette, radii, data
 * font), with values read from the document's computed styles. Switch the
 * Brand / Mode toolbars and hit "Re-read computed values" to watch the
 * palette re-emit.
 */
@Component({
  selector: 'parity-theming-tokens',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div class="tokens-page">
      <header class="tokens-header">
        <h2>Theming tokens</h2>
        <button mat-stroked-button (click)="read()">Re-read computed values</button>
      </header>

      <h3>--mat-sys color roles</h3>
      <div class="swatch-grid">
        @for (swatch of sysSwatches; track swatch.token) {
          <figure class="swatch">
            <div class="swatch-chip" [style.background]="swatch.varRef"></div>
            <figcaption>
              <code>{{ swatch.token }}</code>
              <span class="swatch-value">{{ swatch.value }}</span>
            </figcaption>
          </figure>
        }
      </div>

      <h3>--app-status-* pairs</h3>
      <div class="swatch-grid">
        @for (status of statusSwatches; track status.kind) {
          <figure class="swatch">
            <div
              class="swatch-chip status-chip"
              [style.background]="status.bgRef"
              [style.color]="status.fgRef"
            >
              {{ status.kind }}
            </div>
            <figcaption>
              <code>--app-status-{{ status.kind }}-bg/fg</code>
              <span class="swatch-value">{{ status.bg }} / {{ status.fg }}</span>
            </figcaption>
          </figure>
        }
      </div>

      <h3>--app-chart-1..6</h3>
      <div class="swatch-grid">
        @for (chart of chartSwatches; track chart.token) {
          <figure class="swatch">
            <div class="swatch-chip" [style.background]="chart.varRef"></div>
            <figcaption>
              <code>{{ chart.token }}</code>
              <span class="swatch-value">{{ chart.value }}</span>
            </figcaption>
          </figure>
        }
      </div>

      <h3>--app-radius-* and --app-font-data</h3>
      <div class="swatch-grid">
        @for (radius of radiusSwatches; track radius.token) {
          <figure class="swatch">
            <div class="swatch-chip radius-chip" [style.border-radius]="radius.varRef"></div>
            <figcaption>
              <code>{{ radius.token }}</code>
              <span class="swatch-value">{{ radius.value }}</span>
            </figcaption>
          </figure>
        }
        <figure class="swatch">
          <div class="swatch-chip font-chip">0123456789.42</div>
          <figcaption>
            <code>--app-font-data</code>
            <span class="swatch-value">{{ fontData }}</span>
          </figcaption>
        </figure>
      </div>
    </div>
  `,
  styles: [
    `
      .tokens-page {
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--mat-sys-on-surface);
      }
      .tokens-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .tokens-header h2 {
        margin: 0;
        font: var(--mat-sys-headline-small);
      }
      .tokens-page h3 {
        margin: 16px 0 4px;
        font: var(--mat-sys-title-small);
        color: var(--mat-sys-on-surface-variant);
      }
      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
      }
      .swatch {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .swatch-chip {
        height: 48px;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--app-radius-control);
      }
      .status-chip {
        display: flex;
        align-items: center;
        justify-content: center;
        font: var(--mat-sys-label-large);
        border-radius: var(--app-radius-badge);
      }
      .radius-chip {
        background: var(--mat-sys-surface-container-high);
      }
      .font-chip {
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--app-font-data);
        font-size: 18px;
        background: var(--mat-sys-surface-container);
      }
      .swatch figcaption {
        display: flex;
        flex-direction: column;
      }
      .swatch code {
        font: var(--mat-sys-body-small);
        font-family: var(--app-font-data);
      }
      .swatch-value {
        font: var(--mat-sys-body-small);
        color: var(--mat-sys-on-surface-variant);
        overflow-wrap: anywhere;
      }
    `,
  ],
})
class ParityThemingTokensComponent {
  sysSwatches: TokenSwatch[] = MAT_SYS_COLOR_TOKENS.map((name) => ({
    token: `--mat-sys-${name}`,
    varRef: `var(--mat-sys-${name})`,
    value: '',
  }));

  statusSwatches: StatusSwatch[] = STATUS_KINDS.map((kind) => ({
    kind,
    bgRef: `var(--app-status-${kind}-bg)`,
    fgRef: `var(--app-status-${kind}-fg)`,
    bg: '',
    fg: '',
  }));

  chartSwatches: TokenSwatch[] = CHART_INDICES.map((i) => ({
    token: `--app-chart-${i}`,
    varRef: `var(--app-chart-${i})`,
    value: '',
  }));

  radiusSwatches: TokenSwatch[] = RADIUS_TOKENS.map((name) => ({
    token: `--app-radius-${name}`,
    varRef: `var(--app-radius-${name})`,
    value: '',
  }));

  fontData = '';

  constructor() {
    this.read();
  }

  read(): void {
    const styles = getComputedStyle(document.documentElement);
    const value = (token: string): string =>
      styles.getPropertyValue(token).trim() || '(unset)';

    for (const swatch of [...this.sysSwatches, ...this.chartSwatches, ...this.radiusSwatches]) {
      swatch.value = value(swatch.token);
    }
    for (const status of this.statusSwatches) {
      status.bg = value(`--app-status-${status.kind}-bg`);
      status.fg = value(`--app-status-${status.kind}-fg`);
    }
    this.fontData = value('--app-font-data');
  }
}

const meta: Meta<ParityThemingTokensComponent> = {
  component: ParityThemingTokensComponent,
  title: 'Theming/Tokens',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityThemingTokensComponent>;

export const Overview: Story = {};
