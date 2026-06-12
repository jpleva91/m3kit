import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from '@storybook/test';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';

const meta: Meta<AppComponent> = {
  component: AppComponent,
  title: 'Pages/AppComponent',
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        // Disabled initial navigation keeps the router from resolving the
        // lazy default route inside the story canvas (avoids NG04002).
        provideRouter(appRoutes, withDisabledInitialNavigation()),
        provideNoopAnimations(),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<AppComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/demo-reporting/gi)).toBeTruthy();
  },
};
