import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyStateComponent } from './empty-state.component';

@Component({
  imports: [EmptyStateComponent],
  template: `
    <m3k-empty-state [icon]="icon" [title]="title" [description]="description">
      <button m3kEmptyStateActions class="cta" type="button">New invoice</button>
    </m3k-empty-state>
  `,
})
class HostComponent {
  icon = 'inbox';
  title = 'No invoices yet';
  description: string | null = null;
}

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title as an h3', () => {
    const title = element().querySelector('h3.m3k-empty-state__title');
    expect(title?.textContent).toBe('No invoices yet');
  });

  it('renders the icon name inside the tonal circle', () => {
    const icon = element().querySelector('.m3k-empty-state__icon mat-icon');
    expect(icon?.textContent?.trim()).toBe('inbox');

    host.icon = 'receipt_long';
    fixture.detectChanges();
    expect(icon?.textContent?.trim()).toBe('receipt_long');
  });

  it('defaults the icon to inbox', () => {
    const standalone = TestBed.createComponent(EmptyStateComponent);
    standalone.componentRef.setInput('title', 'Nothing here');
    standalone.detectChanges();

    const icon = (standalone.nativeElement as HTMLElement).querySelector(
      '.m3k-empty-state__icon mat-icon',
    );
    expect(icon?.textContent?.trim()).toBe('inbox');
  });

  it('hides the description when null and shows it when set', () => {
    expect(element().querySelector('.m3k-empty-state__description')).toBeNull();

    host.description = 'Invoices you issue will appear here.';
    fixture.detectChanges();
    expect(element().querySelector('.m3k-empty-state__description')?.textContent).toBe(
      'Invoices you issue will appear here.',
    );
  });

  it('projects actions into the actions slot', () => {
    expect(element().querySelector('.m3k-empty-state__actions .cta')?.textContent).toBe(
      'New invoice',
    );
  });
});
