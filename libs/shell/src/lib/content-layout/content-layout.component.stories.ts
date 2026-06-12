import { type Meta, type StoryObj } from '@storybook/angular';

import { ContentLayoutComponent } from './content-layout.component';

const PRIMARY = `
  <section
    style="min-height: 180px; display: grid; place-items: center;
           border: 1px dashed var(--mat-sys-outline-variant);
           border-radius: var(--app-radius-card);
           color: var(--mat-sys-on-surface-variant);
           font: var(--mat-sys-body-medium);"
  >
    Invoice table region
  </section>
`;

const ASIDE = `
  <aside
    m3kContentAside
    style="min-height: 180px; display: grid; place-items: center;
           border: 1px dashed var(--mat-sys-outline-variant);
           border-radius: var(--app-radius-card);
           color: var(--mat-sys-on-surface-variant);
           font: var(--mat-sys-body-medium);"
  >
    Filters aside
  </aside>
`;

const meta: Meta<ContentLayoutComponent> = {
  component: ContentLayoutComponent,
  title: 'Shell/ContentLayout',
  render: (args) => ({
    props: args,
    template: `
      <m3k-content-layout [mode]="mode">
        ${PRIMARY}
        ${ASIDE}
      </m3k-content-layout>
    `,
  }),
};
export default meta;
type Story = StoryObj<ContentLayoutComponent>;

export const Full: Story = {
  args: { mode: 'full' },
};

export const Centered: Story = {
  args: { mode: 'centered' },
};

export const Split: Story = {
  args: { mode: 'split' },
};
