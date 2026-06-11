import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject, of, timer } from 'rxjs';
import { debounce, distinctUntilChanged, map } from 'rxjs/operators';
import { ReportDefinition } from '@m3kit/core';

/** Payload emitted by `rpt-report-filter-bar` when the search text changes. */
export interface ReportFilterBarChange {
  readonly text: string;
}

/** Milliseconds the filter bar waits after the last keystroke before emitting. */
export const REPORT_FILTER_DEBOUNCE_MS = 200;

/**
 * Free-text search bar for a report. Emits `filterChange` debounced by
 * {@link REPORT_FILTER_DEBOUNCE_MS} and deduplicated, with a clear
 * button when text is present. Clearing bypasses the debounce and
 * emits immediately, cancelling any pending keystroke emission.
 *
 * Composable but independent of `rpt-report-table`: consumers wire
 * `filterChange` to the table's `textFilter` input (or call its
 * `applyTextFilter` method).
 */
@Component({
  selector: 'rpt-report-filter-bar',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './report-filter-bar.component.html',
  styleUrl: './report-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFilterBarComponent<T> {
  /** Report the bar filters; used for the search label. */
  readonly definition = input.required<ReportDefinition<T>>();

  /** Emits the debounced, trimmed search text. */
  readonly filterChange = output<ReportFilterBarChange>();

  /** Current raw input value, driving the clear button. */
  protected readonly text = signal('');

  private readonly textChanges = new Subject<{
    readonly text: string;
    readonly immediate: boolean;
  }>();

  constructor() {
    this.textChanges
      .pipe(
        // Immediate changes (clear) flush synchronously and cancel any
        // pending debounced keystroke; typing keeps the usual debounce.
        debounce(({ immediate }) =>
          immediate ? of(0) : timer(REPORT_FILTER_DEBOUNCE_MS),
        ),
        map(({ text }) => text),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((text) => this.filterChange.emit({ text }));
  }

  protected onInput(value: string): void {
    this.text.set(value);
    this.textChanges.next({ text: value.trim(), immediate: false });
  }

  protected clear(): void {
    this.text.set('');
    this.textChanges.next({ text: '', immediate: true });
  }
}
