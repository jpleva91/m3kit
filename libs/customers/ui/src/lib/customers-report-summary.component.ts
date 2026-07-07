import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-customers-report-summary',
  templateUrl: './customers-report-summary.component.html',
  styleUrl: './customers-report-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersReportSummaryComponent {
  readonly state = input.required<{ readonly status: string; readonly sourceFiles: readonly string[]; readonly manualReviewItems: readonly string[] }>();
}
