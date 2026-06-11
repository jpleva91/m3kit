import {
  DestroyRef,
  ElementRef,
  Signal,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

/** ViewBox width assumed until the host is measured (SSR, jsdom). */
export const DEFAULT_CHART_WIDTH = 600;

/**
 * Signal of the host element's rendered width in CSS px, kept current
 * by a `ResizeObserver`. Charts use it as their viewBox width so one
 * SVG user unit equals one CSS px and `<text>` never stretches.
 *
 * Starts at (and, where `ResizeObserver` is unavailable — SSR, jsdom —
 * stays at) {@link DEFAULT_CHART_WIDTH}; zero-width measurements are
 * ignored so detached or hidden hosts keep the deterministic default.
 * Must be called in an injection context; observation starts after the
 * first render and is disconnected on destroy.
 */
export function injectHostWidth(): Signal<number> {
  const width = signal(DEFAULT_CHART_WIDTH);
  const host = inject(ElementRef).nativeElement as HTMLElement;
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const measured = entries[entries.length - 1]?.contentRect.width ?? 0;
      if (measured > 0) {
        width.set(Math.round(measured));
      }
    });
    // ResizeObserver reports the initial size on observe, so this also
    // performs the first measurement.
    observer.observe(host);
    destroyRef.onDestroy(() => observer.disconnect());
  });

  return width.asReadonly();
}
