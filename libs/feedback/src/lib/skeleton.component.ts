import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Shape of a `m3k-skeleton` placeholder. */
export type SkeletonVariant = 'text' | 'rect' | 'circle';

/**
 * Loading placeholder: a surface-toned block with a calm 1.6s opacity
 * pulse (no shimmer sweep — DESIGN.md bans skeleton-shimmer theater).
 * The animation is disabled under `prefers-reduced-motion: reduce`.
 *
 * Compose several to sketch the shape of the loading content:
 *
 * ```html
 * <m3k-skeleton variant="circle" />
 * <m3k-skeleton variant="text" width="60%" />
 * <m3k-skeleton variant="rect" height="8rem" />
 * ```
 */
@Component({
  selector: 'm3k-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  /** Placeholder shape: text line, rectangle, or circle. */
  readonly variant = input<SkeletonVariant>('text');

  /** Optional CSS width (e.g. `'60%'`, `'12rem'`); variants carry defaults. */
  readonly width = input<string | null>(null);

  /** Optional CSS height (e.g. `'8rem'`); variants carry defaults. */
  readonly height = input<string | null>(null);
}
