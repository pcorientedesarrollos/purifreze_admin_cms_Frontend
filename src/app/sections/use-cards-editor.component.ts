import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { tempId } from '../core/models/temp-id';
import { UseCard, UseCardType, useCardIcons, useCardTypes } from '../core/models/use-card';
import { MediaService } from '../core/services/media.service';
import { MediaUrlService } from '../core/services/media-url.service';

@Component({
  selector: 'app-use-cards-editor',
  imports: [FormsModule],
  template: `
    <section>
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow">Aplicaciones</p>
          <h2 class="mt-1 font-display text-2xl font-bold tracking-tight text-blue-950">Tarjetas de usos</h2>
          <p class="mt-1 text-sm text-blue-950/55">Crea tarjetas de texto, imagen o video. El grid público mantiene un tamaño uniforme.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="secondary-button" (click)="add('text')"><i class="fa-solid fa-plus mr-2 text-xs"></i>Texto</button>
          <button type="button" class="secondary-button" (click)="add('image')"><i class="fa-solid fa-plus mr-2 text-xs"></i>Imagen</button>
          <button type="button" class="secondary-button" (click)="add('video')"><i class="fa-solid fa-plus mr-2 text-xs"></i>Video</button>
        </div>
      </div>

      @if (error()) { <p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error() }}</p> }

      <div class="grid gap-3">
        @for (card of cards(); track card.id; let index = $index) {
          <button
            type="button"
            draggable="true"
            (dragstart)="dragged.set(index)"
            (dragover)="$event.preventDefault()"
            (drop)="drop(index)"
            (click)="selected.set(index)"
            class="grid w-full gap-3 rounded-2xl border border-blue-100 bg-[#fbfdff] p-4 text-left transition md:grid-cols-[44px_1fr_auto] md:items-center"
            [class.ring-2]="selected() === index"
            [class.ring-blue-200]="selected() === index"
            [class.opacity-50]="!card.isVisible"
          >
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-500"><i class="fa-solid fa-grip-vertical"></i></span>
            <span class="min-w-0">
              <span class="block text-xs font-extrabold uppercase tracking-[.14em] text-blue-600">{{ labelFor(card.type) }}</span>
              <span class="mt-1 block truncate font-display text-xl font-bold text-blue-950">{{ card.title }}</span>
              <span class="mt-1 block truncate text-sm text-blue-950/55">{{ card.description || card.mediaUrl || 'Sin contenido secundario' }}</span>
            </span>
            <span class="rounded-full px-3 py-1 text-xs font-extrabold" [class.bg-green-100]="card.isVisible" [class.text-green-700]="card.isVisible" [class.bg-slate-100]="!card.isVisible" [class.text-slate-600]="!card.isVisible">{{ card.isVisible ? 'Visible' : 'Oculta' }}</span>
          </button>
        } @empty {
          <div class="rounded-2xl border border-dashed border-blue-200 bg-blue-50/55 px-5 py-8 text-center">
            <i class="fa-regular fa-window-maximize text-3xl text-blue-400"></i>
            <p class="mt-3 font-display text-xl font-bold text-blue-950">Todavía no hay tarjetas</p>
            <p class="mt-1 text-sm text-blue-950/55">Agrega textos, imágenes o videos para construir la sección.</p>
          </div>
        }
      </div>

      @if (active(); as card) {
        <div class="mt-5 border-t border-blue-100 pt-5">
          <div class="flex items-center justify-between gap-3">
            <p class="eyebrow">Editar tarjeta {{ selected() + 1 }}</p>
            <button type="button" class="text-xs font-extrabold text-red-600 transition hover:text-red-800" (click)="remove()">
              <i class="fa-regular fa-trash-can mr-1"></i>Eliminar tarjeta
            </button>
          </div>

          <div class="mt-3 grid gap-4 md:grid-cols-2">
            <label class="field">
              <span>Tipo</span>
              <select [ngModel]="card.type" (ngModelChange)="update({ type: $event })">
                @for (type of types; track type.value) { <option [value]="type.value">{{ type.label }}</option> }
              </select>
            </label>
            <label class="field"><span>Título</span><input [ngModel]="card.title" (ngModelChange)="update({ title: $event })" /></label>
            <label class="field md:col-span-2"><span>Descripción</span><textarea rows="3" [ngModel]="card.description" (ngModelChange)="update({ description: $event })"></textarea></label>
            <label class="field">
              <span>Icono</span>
              <select [ngModel]="card.icon || 'fa-droplet'" (ngModelChange)="update({ icon: $event })">
                @for (icon of icons; track icon.value) { <option [value]="icon.value">{{ icon.label }}</option> }
              </select>
            </label>
            <label class="field"><span>Texto alternativo</span><input [ngModel]="card.altText" (ngModelChange)="update({ altText: $event })" /></label>
            <label class="field md:col-span-2"><span>Ruta de media</span><input [ngModel]="card.mediaUrl" (ngModelChange)="update({ mediaUrl: $event })" placeholder="/uploads/..." /></label>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <label class="secondary-button cursor-pointer" [class.pointer-events-none]="uploading()" [class.opacity-60]="uploading()">
              {{ uploading() ? 'Subiendo...' : 'Subir imagen' }}
              <input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" [disabled]="uploading()" (change)="uploadImage($event)" />
            </label>
            <label class="secondary-button cursor-pointer" [class.pointer-events-none]="uploading()" [class.opacity-60]="uploading()">
              {{ uploading() ? 'Subiendo...' : 'Subir video' }}
              <input class="sr-only" type="file" accept="video/mp4" [disabled]="uploading()" (change)="uploadVideo($event)" />
            </label>
            <label class="flex items-center gap-3 text-sm font-bold text-blue-950">
              <input type="checkbox" class="accent-blue-600" [ngModel]="card.isVisible" (ngModelChange)="update({ isVisible: $event })" />
              Visible en la landing
            </label>
          </div>

          @if (card.mediaUrl) {
            <div class="mt-5 overflow-hidden rounded-2xl border border-blue-100 bg-blue-950">
              @if (card.type === 'video') {
                <video class="aspect-video w-full object-contain" controls preload="metadata" [src]="url.resolve(card.mediaUrl)"></video>
              } @else {
                <img class="aspect-video w-full object-contain" [src]="url.resolve(card.mediaUrl)" [alt]="card.altText || card.title" />
              }
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class UseCardsEditorComponent {
  readonly cards = input.required<UseCard[]>();
  readonly cardsChange = output<UseCard[]>();
  readonly selected = signal(0);
  readonly dragged = signal<number | null>(null);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly types = useCardTypes;
  readonly icons = useCardIcons;
  readonly media = inject(MediaService);
  readonly url = inject(MediaUrlService);

  active(): UseCard | undefined {
    return this.cards()[this.selected()];
  }

  labelFor(type: UseCardType): string {
    return this.types.find((item) => item.value === type)?.label ?? type;
  }

  add(type: UseCardType): void {
    const next = [
      ...this.cards(),
      {
        id: tempId(),
        type,
        title: type === 'text' ? 'Nuevo uso' : type === 'image' ? 'Nueva imagen' : 'Nuevo video',
        description: type === 'text' ? 'Describe este uso de Purifreze.' : null,
        icon: type === 'text' ? 'fa-droplet' : null,
        mediaUrl: null,
        altText: null,
        isVisible: true,
        sortOrder: this.cards().length,
      },
    ];
    this.selected.set(next.length - 1);
    this.cardsChange.emit(next);
  }

  update(change: Partial<UseCard>): void {
    const index = this.selected();
    this.cardsChange.emit(this.cards().map((card, current) => (current === index ? { ...card, ...change } : card)));
  }

  remove(): void {
    const next = this.cards().filter((_, index) => index !== this.selected());
    this.selected.set(Math.max(0, Math.min(this.selected(), next.length - 1)));
    this.cardsChange.emit(next);
  }

  drop(index: number): void {
    const dragged = this.dragged();
    if (dragged === null || dragged === index) return;
    const next = [...this.cards()];
    const [item] = next.splice(dragged, 1);
    if (!item) return;
    next.splice(index, 0, item);
    this.selected.set(index);
    this.dragged.set(null);
    this.cardsChange.emit(next);
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set('');
    this.uploading.set(true);
    this.media.uploadImage(file).pipe(finalize(() => {
      this.uploading.set(false);
      input.value = '';
    })).subscribe({
      next: (image) => this.update({ type: 'image', mediaUrl: image.url, altText: this.active()?.altText || this.active()?.title || file.name }),
      error: () => this.error.set('No se pudo subir la imagen.'),
    });
  }

  uploadVideo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set('');
    this.uploading.set(true);
    this.media.upload(file).pipe(finalize(() => {
      this.uploading.set(false);
      input.value = '';
    })).subscribe({
      next: (video) => this.update({ type: 'video', mediaUrl: video.url, title: this.active()?.title || file.name.replace(/\.mp4$/i, '') }),
      error: () => this.error.set('No se pudo subir el video. Verifica que sea MP4 y no supere 25 MB.'),
    });
  }
}
