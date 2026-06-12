import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from '@storybook/test';
import { applicationConfig } from '@storybook/angular';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ReportsComponent } from './reports.component';

const meta: Meta<ReportsComponent> = {
  component: ReportsComponent,
  title: 'Pages/ReportsComponent',
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations(), provideNativeDateAdapter()] }),
  ],
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
    expect(canvas.getAllByText(/Invoices/i).length).toBeGreaterThan(0);
    expect(canvas.getAllByText(/INV-2026-/i).length).toBeGreaterThan(0);
  },
};
