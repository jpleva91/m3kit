import { existsSync, readFileSync } from 'node:fs';

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkeletonComponent, SkeletonVariant } from './skeleton.component';

@Component({
  imports: [SkeletonComponent],
  template: `<m3k-skeleton [variant]="variant" [width]="width" [height]="height" />`,
})
class HostComponent {
  variant: SkeletonVariant = 'text';
  width: string | null = null;
  height: string | null = null;
}

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const skeleton = (): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector('.m3k-skeleton');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to the text variant and hides itself from assistive tech', () => {
    expect(skeleton()?.classList).toContain('m3k-skeleton--text');
    expect(skeleton()?.getAttribute('aria-hidden')).toBe('true');
  });

  it.each(['text', 'rect', 'circle'] as const)('applies the %s variant class', (variant) => {
    host.variant = variant;
    fixture.detectChanges();
    expect(skeleton()?.classList).toContain(`m3k-skeleton--${variant}`);
  });

  it('applies width and height overrides as inline styles', () => {
    host.width = '60%';
    host.height = '8rem';
    fixture.detectChanges();

    expect(skeleton()?.style.width).toBe('60%');
    expect(skeleton()?.style.height).toBe('8rem');
  });

  it('leaves dimensions to the variant defaults when width/height are null', () => {
    expect(skeleton()?.style.width).toBe('');
    expect(skeleton()?.style.height).toBe('');
  });

  it('declares a pulse animation guarded by prefers-reduced-motion', () => {
    // jsdom does not evaluate media queries (and the vitest Angular
    // plugin strips component styles in test mode), so assert the motion
    // contract statically against the stylesheet source: the pulse
    // keyframes exist and a `prefers-reduced-motion: reduce` block
    // disables the animation. Computed-style behavior is covered by the
    // Cypress component test.
    const stylesheet = ['src/lib', 'libs/feedback/src/lib']
      .map((dir) => `${dir}/skeleton.component.scss`)
      .find((path) => existsSync(path));
    const styles = stylesheet ? readFileSync(stylesheet, 'utf-8') : '';

    expect(styles).toContain('m3k-skeleton-pulse');
    expect(styles).toContain('1.6s');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(styles).toMatch(/animation:\s*none/);
  });
});
