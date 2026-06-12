import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { REPORT_TELEMETRY_REPORTER } from '@m3kit/state';

import { appRoutes } from './app.routes';
import { ConsoleTelemetryReporter } from './reports/console-telemetry';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    // Date adapter for the datepickers rendered by @m3kit/forms.
    provideNativeDateAdapter(),
    {
      provide: REPORT_TELEMETRY_REPORTER,
      useExisting: ConsoleTelemetryReporter,
    },
  ],
};
