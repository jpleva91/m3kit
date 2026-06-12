import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { expect, within } from '@storybook/test';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AppShellComponent } from './app-shell.component';
import { ShellNavItem } from './shell-model';
import {
  ShellRailFooterDirective,
  ShellToolbarActionsDirective,
} from './shell-slots';

/** Local synthetic nav; lib stories must not depend on app code. */
const NAV: readonly ShellNavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/reports', label: 'Invoices', icon: 'table_chart', exact: true },
  { path: '/reports/customers', label: 'Customers', icon: 'group' },
];

const PLACEHOLDER_CONTENT = `
  <section
    style="min-height: 240px; display: grid; place-items: center;
           border: 1px dashed var(--mat-sys-outline-variant);
           border-radius: var(--app-radius-card);
           color: var(--mat-sys-on-surface-variant);
           font: var(--mat-sys-body-medium);"
  >
    Routed page content (consumer-projected router-outlet)
  </section>
`;

const TOOLBAR_ACTIONS = `
  <ng-template m3kShellToolbarActions>
    <button mat-icon-button type="button" aria-label="Choose brand theme">
      <mat-icon>palette</mat-icon>
    </button>
    <button mat-icon-button type="button" aria-label="Switch to dark mode">
      <mat-icon>dark_mode</mat-icon>
    </button>
  </ng-template>
`;

const meta: Meta<AppShellComponent> = {
  component: AppShellComponent,
  title: 'Templates/AppShell',
  decorators: [
    applicationConfig({
      providers: [
        // Empty route table + disabled initial navigation: the shell never
        // owns routing, so stories mount without a real router setup.
        provideRouter([], withDisabledInitialNavigation()),
        provideNoopAnimations(),
      ],
    }),
    moduleMetadata({
      imports: [
        ShellToolbarActionsDirective,
        ShellRailFooterDirective,
        MatButtonModule,
        MatIconModule,
      ],
    }),
  ],
  args: {
    nav: NAV,
    title: 'demo-reporting',
  },
  render: (args) => ({
    props: args,
    template: `
      <m3k-app-shell [preset]="preset" [nav]="nav" [title]="title">
        ${TOOLBAR_ACTIONS}
        ${PLACEHOLDER_CONTENT}
      </m3k-app-shell>
    `,
  }),
};
export default meta;
type Story = StoryObj<AppShellComponent>;

export const Sidenav: Story = {
  args: { preset: 'sidenav' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ['Dashboard', 'Invoices', 'Customers']) {
      await expect(canvas.getByText(label)).toBeTruthy();
    }
  },
};

export const CommandBar: Story = {
  args: { preset: 'command-bar' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ['Dashboard', 'Invoices', 'Customers']) {
      await expect(canvas.getByText(label)).toBeTruthy();
    }
    await expect(canvas.getByText(/sync ok/i)).toBeTruthy();
  },
};

export const ContentsRail: Story = {
  args: { preset: 'contents-rail' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ['Dashboard', 'Invoices', 'Customers']) {
      await expect(canvas.getByText(label)).toBeTruthy();
    }
  },
};

export const PillTabs: Story = {
  args: { preset: 'pill-tabs' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ['Dashboard', 'Invoices', 'Customers']) {
      await expect(canvas.getByText(label)).toBeTruthy();
    }
  },
};

/** The contents-rail foot can be overridden independently of the controls. */
export const RailFooterSlot: Story = {
  args: { preset: 'contents-rail' },
  render: (args) => ({
    props: args,
    template: `
      <m3k-app-shell [preset]="preset" [nav]="nav" [title]="title">
        ${TOOLBAR_ACTIONS}
        <ng-template m3kShellRailFooter>
          <span
            style="font: var(--mat-sys-label-small);
                   color: var(--mat-sys-on-surface-variant);"
          >
            Ledger edition · second printing
          </span>
        </ng-template>
        ${PLACEHOLDER_CONTENT}
      </m3k-app-shell>
    `,
  }),
};

/** Empty nav model: the chrome renders with an empty nav region. */
export const EdgeEmptyNav: Story = {
  args: { preset: 'sidenav', nav: [] },
};
