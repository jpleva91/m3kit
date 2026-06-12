import type { Meta, StoryObj } from '@storybook/angular';

import { SkeletonComponent } from './skeleton.component';

const meta: Meta<SkeletonComponent> = {
  component: SkeletonComponent,
  title: 'Molecules/Skeleton',
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['text', 'rect', 'circle'],
    },
  },
};
export default meta;
type Story = StoryObj<SkeletonComponent>;

export const Text: Story = {
  args: { variant: 'text' },
};

export const Rect: Story = {
  args: { variant: 'rect' },
};

export const Circle: Story = {
  args: { variant: 'circle' },
};

export const CustomSize: Story = {
  args: { variant: 'rect', width: '12rem', height: '4rem' },
};

/**
 * Composed usage: the loading sketch of a detail card — an avatar circle,
 * a title and two value lines, and a chart-sized rectangle. The only
 * motion is the calm built-in opacity pulse.
 */
export const ComposedCard: Story = {
  render: () => ({
    template: `
      <div style="max-width: 24rem; display: grid; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <m3k-skeleton variant="circle" />
          <div style="flex: 1; display: grid; gap: 0.5rem;">
            <m3k-skeleton variant="text" width="55%" />
            <m3k-skeleton variant="text" width="35%" />
          </div>
        </div>
        <m3k-skeleton variant="rect" height="8rem" />
        <m3k-skeleton variant="text" width="70%" />
        <m3k-skeleton variant="text" width="45%" />
      </div>
    `,
    moduleMetadata: { imports: [SkeletonComponent] },
  }),
};
