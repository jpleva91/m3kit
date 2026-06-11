import type { Meta, StoryObj } from '@storybook/angular';
import { ReportsComponent } from './reports.component';
import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta: Meta<ReportsComponent> = {
  component: ReportsComponent,
  title: 'ReportsComponent',
};
export default meta;
type Story = StoryObj<ReportsComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/reports works!/gi)).toBeTruthy();
  },
};
