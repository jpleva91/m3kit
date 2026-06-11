import type { Meta, StoryObj } from '@storybook/angular';
import { ReportingMaterialComponent } from './reporting-material.component';
import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta: Meta<ReportingMaterialComponent> = {
  component: ReportingMaterialComponent,
  title: 'ReportingMaterialComponent',
};
export default meta;
type Story = StoryObj<ReportingMaterialComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/reporting-material works!/gi)).toBeTruthy();
  },
};
