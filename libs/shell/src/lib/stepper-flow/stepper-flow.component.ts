import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';

import { StepDefinition } from './stepper-flow-model';

/**
 * Marks an `ng-template` projected into `m3k-stepper-flow` as the content
 * panel of one step, keyed by the step's `id` (the same TemplateRef slot
 * discipline as the shell's `m3kShellToolbarActions`). The step definition
 * is exposed as the template's implicit context.
 *
 * ```html
 * <ng-template m3kStepPanel="customer" let-step>…</ng-template>
 * ```
 */
@Directive({
  selector: 'ng-template[m3kStepPanel]',
})
export class StepperFlowPanelDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);

  /** Id of the `StepDefinition` this panel renders for. */
  readonly stepId = input.required<string>({ alias: 'm3kStepPanel' });
}

/**
 * Optional footer-extras slot: stamped into every step's footer between the
 * Back button and the advance button (e.g. an autosave note or a cancel
 * link). Template slot rather than `ng-content` because the footer renders
 * once per step.
 */
@Directive({
  selector: 'ng-template[m3kStepperFooterExtras]',
})
export class StepperFlowFooterExtrasDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Wizard/flow template wrapping the Material stepper: typed steps
 * (`StepDefinition[]`), panel content projected per step id, and a
 * consistent Back / Next / Finish footer on every step.
 *
 * Progress is consumer-owned: the flow never marks a step `completed`
 * itself. In linear mode (the default) the footer's advance button is
 * disabled — and header navigation blocked — until the active step is
 * `completed` (or `optional`). `activeStepIndex` is a two-way binding;
 * programmatic jumps obey the same linear gating, so a rejected jump leaves
 * the stepper where it was. Finishing the last step emits `completed`.
 *
 * ```html
 * <m3k-stepper-flow [steps]="steps" [(activeStepIndex)]="index" (completed)="submit()">
 *   <ng-template m3kStepPanel="customer">…</ng-template>
 *   <ng-template m3kStepPanel="items">…</ng-template>
 *   <ng-template m3kStepPanel="review">…</ng-template>
 * </m3k-stepper-flow>
 * ```
 *
 * There is no separate `stepChange` output: `activeStepIndexChange` (from
 * the two-way binding) already fires for every selection change — footer
 * buttons and header clicks alike — so a second event would be redundant.
 */
@Component({
  selector: 'm3k-stepper-flow',
  imports: [NgTemplateOutlet, MatStepperModule, MatButtonModule],
  templateUrl: './stepper-flow.component.html',
  styleUrl: './stepper-flow.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperFlowComponent {
  /** Ordered step definitions; ids key the projected `m3kStepPanel` templates. */
  readonly steps = input.required<readonly StepDefinition[]>();

  /** Stepper layout direction. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  /** Linear flows gate advancement on each step's `completed`/`optional`. */
  readonly linear = input<boolean>(true);

  /** Two-way index of the active step. */
  readonly activeStepIndex = model<number>(0);

  /** Fired by the Finish button on the last step. */
  readonly completed = output<void>();

  /** Projected step panels, matched to steps by id. */
  private readonly panels = contentChildren(StepperFlowPanelDirective);

  /** Optional footer-extras slot stamped into every step's footer. */
  private readonly footerExtras = contentChild(StepperFlowFooterExtrasDirective);

  private readonly stepper = viewChild.required(MatStepper);

  private readonly panelsById = computed(
    () =>
      new Map(
        this.panels().map((panel) => [panel.stepId(), panel.templateRef]),
      ),
  );

  /** Footer-extras template, if provided. */
  protected readonly footerExtrasTemplate = computed<TemplateRef<unknown> | null>(
    () => this.footerExtras()?.templateRef ?? null,
  );

  /** Panel template for a step id, or `null` when none was projected. */
  protected panelTemplate(id: string): TemplateRef<unknown> | null {
    return this.panelsById().get(id) ?? null;
  }

  /** Linear flows block advancing past an incomplete, non-optional step. */
  protected advanceBlocked(step: StepDefinition): boolean {
    return this.linear() && !(step.completed ?? false) && !(step.optional ?? false);
  }

  protected onSelectionChange(event: StepperSelectionEvent): void {
    this.activeStepIndex.set(event.selectedIndex);
  }

  protected back(): void {
    this.stepper().previous();
  }

  protected next(): void {
    this.stepper().next();
  }

  protected finish(): void {
    this.completed.emit();
  }
}
