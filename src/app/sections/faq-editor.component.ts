import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaqItem } from '../core/models/faq';

@Component({
  selector: 'app-faq-editor',
  imports: [FormsModule],
  template: `
    <section>
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow">Preguntas frecuentes</p>
          <h2 class="mt-1 font-display text-2xl font-bold tracking-tight text-blue-950">Preguntas editables de la landing</h2>
          <p class="mt-1 text-sm text-blue-950/55">Arrastra una pregunta para ordenar. Seleccionala para editar su respuesta.</p>
        </div>
        <button type="button" class="secondary-button" (click)="add()">
          <i class="fa-solid fa-plus mr-2 text-xs"></i>Agregar pregunta
        </button>
      </div>

      <div class="overflow-hidden rounded-2xl border border-blue-100 bg-[#fbfdff]">
        @for (faq of faqs(); track faq.id; let index = $index) {
          <button
            type="button"
            draggable="true"
            (dragstart)="dragged.set(index)"
            (dragover)="$event.preventDefault()"
            (drop)="drop(index)"
            (click)="selected.set(index)"
            class="flex w-full items-center gap-3 border-b border-blue-100 px-5 py-4 text-left transition last:border-b-0"
            [class.bg-blue-50]="selected() === index"
            [class.opacity-45]="!faq.isVisible"
          >
            <i class="fa-solid fa-grip-vertical text-blue-200"></i>
            <span class="flex-1 text-sm font-bold text-blue-950">{{ faq.question }}</span>
            <span class="text-xs text-blue-300"><i class="fa-solid fa-chevron-right"></i></span>
          </button>
        } @empty {
          <div class="border border-dashed border-blue-200 bg-blue-50/55 px-5 py-8 text-center">
            <i class="fa-regular fa-circle-question text-3xl text-blue-400"></i>
            <p class="mt-3 font-display text-xl font-bold text-blue-950">Todavia no hay preguntas</p>
            <p class="mt-1 text-sm text-blue-950/55">Agrega la primera pregunta frecuente para publicarla.</p>
          </div>
        }
      </div>

      @if (active(); as faq) {
        <div class="mt-5 border-t border-blue-100 pt-5">
          <div class="flex items-center justify-between gap-3">
            <p class="eyebrow">Editar pregunta {{ selected() + 1 }}</p>
            <button type="button" class="text-xs font-extrabold text-red-600 transition hover:text-red-800" (click)="remove()">
              <i class="fa-regular fa-trash-can mr-1"></i>Eliminar pregunta
            </button>
          </div>
          <div class="mt-3 grid gap-4">
            <label class="field"><span>Pregunta</span><input [ngModel]="faq.question" (ngModelChange)="update({ question: $event })" /></label>
            <label class="field"><span>Respuesta</span><textarea rows="4" [ngModel]="faq.answer" (ngModelChange)="update({ answer: $event })"></textarea></label>
          </div>
          <label class="mt-4 flex items-center gap-3 text-sm font-bold text-blue-950">
            <input type="checkbox" class="accent-blue-600" [ngModel]="faq.isVisible" (ngModelChange)="update({ isVisible: $event })" />
            Visible en la landing
          </label>
        </div>
      }
    </section>
  `,
})
export class FaqEditorComponent {
  readonly faqs = input.required<FaqItem[]>();
  readonly faqsChange = output<FaqItem[]>();
  readonly selected = signal(0);
  readonly dragged = signal<number | null>(null);

  active(): FaqItem | undefined {
    return this.faqs()[this.selected()];
  }

  add(): void {
    const next = [
      ...this.faqs(),
      { id: crypto.randomUUID(), question: 'Nueva pregunta', answer: 'Escribe aqui la respuesta.', isVisible: true },
    ];
    this.selected.set(next.length - 1);
    this.faqsChange.emit(next);
  }

  update(change: Partial<FaqItem>): void {
    const index = this.selected();
    this.faqsChange.emit(this.faqs().map((faq, current) => (current === index ? { ...faq, ...change } : faq)));
  }

  remove(): void {
    const next = this.faqs().filter((_, index) => index !== this.selected());
    this.selected.set(Math.max(0, Math.min(this.selected(), next.length - 1)));
    this.faqsChange.emit(next);
  }

  drop(index: number): void {
    const dragged = this.dragged();
    if (dragged === null || dragged === index) return;
    const next = [...this.faqs()];
    const [item] = next.splice(dragged, 1);
    if (!item) return;
    next.splice(index, 0, item);
    this.selected.set(index);
    this.dragged.set(null);
    this.faqsChange.emit(next);
  }
}
