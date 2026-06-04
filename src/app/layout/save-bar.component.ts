import { Component, computed, input, output } from '@angular/core';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-save-bar',
  template: `
    <div class="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-100 bg-[#fbfdff]/96 px-5 py-3 shadow-[0_-12px_34px_rgba(11,45,89,.08)] backdrop-blur sm:px-8 lg:left-[272px]">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-sm font-semibold" [class]="tone()">
          @if (status() === 'saving') {
            <i class="fa-solid fa-circle-notch animate-spin"></i>
          } @else if (status() === 'saved') {
            <i class="fa-solid fa-circle-check"></i>
          } @else if (status() === 'error') {
            <i class="fa-solid fa-circle-exclamation"></i>
          } @else {
            <i class="fa-regular fa-pen-to-square"></i>
          }
          <span>{{ message() }}</span>
        </div>
        <button
          type="button"
          class="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
          [disabled]="status() === 'saving' || status() === 'idle' || status() === 'saved'"
          (click)="save.emit()"
        >
          {{ status() === 'saving' ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  `,
})
export class SaveBarComponent {
  readonly status = input.required<SaveStatus>();
  readonly errorMessage = input('');
  readonly save = output<void>();

  readonly message = computed(() => {
    if (this.status() === 'saving') return 'Guardando cambios...';
    if (this.status() === 'saved') return 'Cambios guardados correctamente.';
    if (this.status() === 'error') return this.errorMessage() || 'No se pudieron guardar los cambios.';
    if (this.status() === 'dirty') return 'Hay cambios pendientes.';
    return 'Todo está al día.';
  });

  readonly tone = computed(() => {
    if (this.status() === 'saved') return 'text-blue-700';
    if (this.status() === 'error') return 'text-red-600';
    return 'text-blue-950/65';
  });
}
