import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageHeaderComponent } from '@m3kit/shell';
import { CustomersReportFacade } from '@m3kit/customers/data-access';
import { CustomersReportSummaryComponent } from '@m3kit/customers/ui';

@Component({
  selector: 'app-customers-report-page',
  imports: [PageHeaderComponent, CustomersReportSummaryComponent],
  templateUrl: './customers-report-page.component.html',
  styleUrl: './customers-report-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersReportPageComponent {
  protected readonly facade = inject(CustomersReportFacade);
}
