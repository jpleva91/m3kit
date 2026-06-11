import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * Width strategy applied to a routed page body.
 *
 * - `full`      content spans the available width (data wants width)
 * - `centered`  content constrained to a readable centered column
 * - `split`     primary region + narrower aside, stacking at handset width
 */
export type ContentLayoutMode = 'full' | 'centered' | 'split';

/**
 * Page-body width helper. `full` and `centered` wrap the default slot;
 * `split` lays out the default slot beside an aside region selected by the
 * `rptContentAside` attribute, stacking to one column at ≤959px.
 *
 * ```html
 * <rpt-content-layout mode="split">
 *   <section>Invoice table…</section>
 *   <aside rptContentAside>Filters…</aside>
 * </rpt-content-layout>
 * ```
 */
@Component({
  selector: 'rpt-content-layout',
  imports: [NgTemplateOutlet],
  templateUrl: './content-layout.component.html',
  styleUrl: './content-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentLayoutComponent {
  /** Width strategy for the projected page body. */
  readonly mode = input<ContentLayoutMode>('full');
}
