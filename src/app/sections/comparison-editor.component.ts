import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComparisonBadge, comparisonCategories } from '../core/models/comparison';
import { tempId } from '../core/models/temp-id';

@Component({
  selector: 'app-comparison-editor',
  imports: [FormsModule],
  template: `
    <section>
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow">Tabla comparativa</p>
          <h2 class="mt-1 font-display text-2xl font-bold tracking-tight text-blue-950">Filas editables de la landing</h2>
          <p class="mt-1 text-sm text-blue-950/55">Arrastra una fila para ordenar. Selecciónala para editar sus textos.</p>
        </div>
        <button type="button" class="secondary-button" (click)="add()">
          <i class="fa-solid fa-plus mr-2 text-xs"></i>Agregar fila
        </button>
      </div>

      <div class="overflow-hidden rounded-2xl border border-blue-100 bg-[#fbfdff]">
        <div class="hidden grid-cols-[1.3fr_1fr_1fr_44px] gap-4 border-b border-blue-100 px-5 py-4 text-xs font-extrabold uppercase tracking-[.12em] text-blue-950/60 md:grid">
          <span>Característica</span><span class="text-blue-600"><i class="fa-solid fa-droplet mr-2"></i>Purifreze</span><span>Garrafones</span><span></span>
        </div>
        @for (badge of badges(); track badge.id; let index = $index) {
          <button
            type="button"
            draggable="true"
            (dragstart)="dragged.set(index)"
            (dragover)="$event.preventDefault()"
            (drop)="drop(index)"
            (click)="selected.set(index)"
            class="grid w-full gap-3 border-b border-blue-100 px-5 py-4 text-left transition last:border-b-0 md:grid-cols-[1.3fr_1fr_1fr_44px] md:items-center"
            [class.bg-blue-50]="selected() === index"
            [class.opacity-45]="!badge.isVisible"
          >
            <span class="flex items-center gap-3 text-sm font-bold text-blue-950">
              <i class="fa-solid fa-grip-vertical text-blue-200"></i>
              <i class="fa-solid w-4 text-center text-blue-500" [class]="iconFor(badge.category)"></i>
              {{ badge.feature }}
            </span>
            <span class="text-sm font-extrabold text-blue-950"><i class="fa-solid fa-circle-check mr-2 text-blue-500"></i>{{ badge.purifrezeText }}</span>
            <span class="text-sm font-bold text-blue-950/85"><i class="fa-solid fa-circle-xmark mr-2 text-blue-300"></i>{{ badge.garrafonesText }}</span>
            <span class="text-right text-xs text-blue-300"><i class="fa-solid fa-chevron-right"></i></span>
          </button>
        }
      </div>

      @if (active(); as badge) {
        <div class="mt-5 border-t border-blue-100 pt-5">
          <div class="flex items-center justify-between gap-3">
            <p class="eyebrow">Editar fila {{ selected() + 1 }}</p>
            <button type="button" class="text-xs font-extrabold text-red-600 transition hover:text-red-800" (click)="remove()">
              <i class="fa-regular fa-trash-can mr-1"></i>Eliminar fila
            </button>
          </div>
          <div class="mt-3 grid gap-4 md:grid-cols-2">
            <label class="field"><span>Característica</span><input [ngModel]="badge.feature" (ngModelChange)="update({ feature: $event })" /></label>
            <label class="field">
              <span>Categoría</span>
              <select [ngModel]="badge.category" (ngModelChange)="update({ category: $event })">
                @for (category of categories; track category.value) { <option [value]="category.value">{{ category.value }}</option> }
              </select>
            </label>
            <label class="field"><span>Texto Purifreze</span><input [ngModel]="badge.purifrezeText" (ngModelChange)="update({ purifrezeText: $event })" /></label>
            <label class="field"><span>Texto garrafones</span><input [ngModel]="badge.garrafonesText" (ngModelChange)="update({ garrafonesText: $event })" /></label>
          </div>
          <label class="mt-4 flex items-center gap-3 text-sm font-bold text-blue-950">
            <input type="checkbox" class="accent-blue-600" [ngModel]="badge.isVisible" (ngModelChange)="update({ isVisible: $event })" />
            Visible en la tabla
          </label>
        </div>
      }
    </section>
  `,
})
export class ComparisonEditorComponent {
  readonly badges = input.required<ComparisonBadge[]>();
  readonly badgesChange = output<ComparisonBadge[]>();
  readonly selected = signal(0);
  readonly dragged = signal<number | null>(null);
  readonly categories = comparisonCategories;

  active(): ComparisonBadge | undefined {
    return this.badges()[this.selected()];
  }

  iconFor(category: string): string {
    return this.categories.find((item) => item.value === category)?.icon ?? 'fa-tag';
  }

  add(): void {
    const next = [
      ...this.badges(),
      { id: tempId(), feature: 'Nueva característica', category: 'Calidad', purifrezeText: 'Beneficio Purifreze', garrafonesText: 'Alternativa tradicional', isVisible: true, sortOrder: this.badges().length },
    ];
    this.selected.set(next.length - 1);
    this.badgesChange.emit(next);
  }

  update(change: Partial<ComparisonBadge>): void {
    const index = this.selected();
    this.badgesChange.emit(this.badges().map((badge, current) => (current === index ? { ...badge, ...change } : badge)));
  }

  remove(): void {
    const next = this.badges().filter((_, index) => index !== this.selected());
    this.selected.set(Math.max(0, Math.min(this.selected(), next.length - 1)));
    this.badgesChange.emit(next);
  }

  drop(index: number): void {
    const dragged = this.dragged();
    if (dragged === null || dragged === index) return;
    const next = [...this.badges()];
    const [item] = next.splice(dragged, 1);
    if (!item) return;
    next.splice(index, 0, item);
    this.selected.set(index);
    this.dragged.set(null);
    this.badgesChange.emit(next);
  }
}
