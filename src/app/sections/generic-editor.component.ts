import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionDraft } from '../core/models/content-section';

@Component({
  selector: 'app-generic-editor',
  imports: [FormsModule],
  template: `
    <section class="grid gap-5">
      <div class="grid gap-4 md:grid-cols-2">
        <label class="field">
          <span>Nombre de la seccion</span>
          <input [ngModel]="section().label" (ngModelChange)="change('label', $event)" />
        </label>
        <label class="field">
          <span>Posicion en la landing</span>
          <input type="number" min="0" [ngModel]="section().sortOrder" (ngModelChange)="change('sortOrder', +$event)" />
        </label>
      </div>

      <label class="field">
        <span>Título visible</span>
        <input [ngModel]="section().title" (ngModelChange)="change('title', $event)" placeholder="Título principal de la sección" />
      </label>
      <label class="field">
        <span>Descripción</span>
        <textarea rows="3" [ngModel]="section().description" (ngModelChange)="change('description', $event)" placeholder="Texto de apoyo de la sección"></textarea>
      </label>
      <label class="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-950">
        <input type="checkbox" class="accent-blue-600" [ngModel]="section().isVisible" (ngModelChange)="change('isVisible', $event)" />
        Mostrar sección en la landing
      </label>

      @if (showJson()) {
        <details class="group border-t border-blue-100 pt-4">
          <summary class="cursor-pointer text-sm font-extrabold text-blue-700">Contenido avanzado (JSON)</summary>
          <p class="mt-2 text-xs leading-relaxed text-blue-950/55">Úsalo únicamente para secciones que todavía no tienen un editor visual dedicado.</p>
          <textarea
            class="mt-3 min-h-64 w-full rounded-xl border border-blue-100 bg-[#0b2d59] p-4 font-mono text-xs leading-relaxed text-blue-50 outline-none focus:border-blue-400"
            [ngModel]="json()"
            (ngModelChange)="jsonChange.emit($event)"
          ></textarea>
        </details>
      }
    </section>
  `,
})
export class GenericEditorComponent {
  readonly section = input.required<SectionDraft>();
  readonly showJson = input(false);
  readonly json = input('');
  readonly sectionChange = output<SectionDraft>();
  readonly jsonChange = output<string>();

  change<K extends keyof SectionDraft>(key: K, value: SectionDraft[K]): void {
    this.sectionChange.emit({ ...this.section(), [key]: value });
  }
}
