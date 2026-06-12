import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  DescriptionListColumns,
  DescriptionListComponent,
  DescriptionListItem,
} from './description-list.component';

@Component({
  imports: [DescriptionListComponent],
  template: `<m3k-description-list [items]="items" [columns]="columns" />`,
})
class HostComponent {
  items: readonly DescriptionListItem[] = [
    { term: 'Customer', description: 'Acme Manufacturing GmbH' },
    { term: 'Account ID', description: 'CUST-00482', mono: true },
  ];
  columns: DescriptionListColumns = 1;
}

describe('DescriptionListComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const texts = (selector: string): readonly (string | undefined)[] =>
    Array.from(element().querySelectorAll(selector)).map((el) => el.textContent?.trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders dt/dd pairs inside a dl in source order', () => {
    expect(element().querySelector('dl.m3k-description-list')).not.toBeNull();
    expect(texts('dt.m3k-description-list__term')).toEqual(['Customer', 'Account ID']);
    expect(texts('dd.m3k-description-list__description')).toEqual([
      'Acme Manufacturing GmbH',
      'CUST-00482',
    ]);
  });

  it('applies the mono modifier only to mono descriptions', () => {
    const descriptions = element().querySelectorAll('dd.m3k-description-list__description');
    expect(descriptions[0].classList).not.toContain('m3k-description-list__description--mono');
    expect(descriptions[1].classList).toContain('m3k-description-list__description--mono');
  });

  it('defaults to a single column', () => {
    expect(element().querySelector('.m3k-description-list--two-column')).toBeNull();
  });

  it('applies the two-column modifier when columns is 2', () => {
    host.columns = 2;
    fixture.detectChanges();

    expect(element().querySelector('.m3k-description-list--two-column')).not.toBeNull();
  });

  it('renders an empty dl for an empty item list', () => {
    host.items = [];
    fixture.detectChanges();

    expect(element().querySelector('dl.m3k-description-list')).not.toBeNull();
    expect(element().querySelectorAll('.m3k-description-list__item').length).toBe(0);
  });
});
