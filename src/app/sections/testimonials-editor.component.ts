import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CmsTestimonial } from '../core/models/testimonial';
import { MediaService } from '../core/services/media.service';
import { MediaUrlService } from '../core/services/media-url.service';

@Component({
  selector: 'app-testimonials-editor',
  imports: [FormsModule],
  template: `
    <section>
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow">Prueba social</p>
          <h2 class="mt-1 font-display text-2xl font-bold tracking-tight text-blue-950">Testimonios en video</h2>
          <p class="mt-1 text-sm text-blue-950/55">Sube MP4 de hasta 25 MB y elige un testimonio destacado.</p>
        </div>
        <label class="secondary-button cursor-pointer" [class.pointer-events-none]="uploading()" [class.opacity-60]="uploading()">
          <i class="fa-solid mr-2 text-xs" [class.fa-circle-notch]="uploading()" [class.animate-spin]="uploading()" [class.fa-upload]="!uploading()"></i>
          {{ uploading() ? 'Subiendo...' : 'Subir testimonio' }}
          <input type="file" class="sr-only" accept="video/mp4" [disabled]="uploading()" (change)="upload($event)" />
        </label>
      </div>

      @if (error()) { <p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error() }}</p> }
      <div class="grid gap-4 xl:grid-cols-2">
        @for (testimonial of testimonials(); track testimonial.id; let index = $index) {
          <article class="overflow-hidden rounded-2xl border border-blue-100 bg-[#fbfdff]" [class.opacity-55]="!testimonial.isVisible">
            <div class="flex justify-center bg-blue-950">
              <video class="aspect-[9/16] h-[32rem] max-h-[70vh] max-w-full bg-blue-950 object-contain" controls preload="metadata" [src]="url.resolve(testimonial.url)"></video>
            </div>
            <div class="grid gap-3 p-4">
              <label class="field"><span>Nombre</span><input [ngModel]="testimonial.name" (ngModelChange)="update(index, { name: $event })" /></label>
              <label class="field"><span>Cargo o referencia</span><input [ngModel]="testimonial.label" (ngModelChange)="update(index, { label: $event })" /></label>
              <label class="field"><span>Ruta del video</span><input [ngModel]="testimonial.url" (ngModelChange)="update(index, { url: $event })" /></label>
              <div class="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-blue-950">
                <div class="flex gap-4">
                  <label class="flex items-center gap-2"><input type="checkbox" class="accent-blue-600" [ngModel]="testimonial.isVisible" (ngModelChange)="update(index, { isVisible: $event })" /> Visible</label>
                  <label class="flex items-center gap-2"><input type="checkbox" class="accent-blue-600" [ngModel]="testimonial.featured" (ngModelChange)="feature(index, $event)" /> Destacado</label>
                </div>
                <button type="button" class="text-red-600 transition hover:text-red-800" (click)="remove(index)"><i class="fa-regular fa-trash-can mr-1"></i>Eliminar</button>
              </div>
            </div>
          </article>
        } @empty {
          <div class="border border-dashed border-blue-200 bg-blue-50/55 px-5 py-8 text-center xl:col-span-2">
            <i class="fa-solid fa-quote-left text-3xl text-blue-400"></i>
            <p class="mt-3 font-display text-xl font-bold text-blue-950">Todavía no hay testimonios</p>
            <p class="mt-1 text-sm text-blue-950/55">Sube el primer MP4 para mostrar historias de clientes.</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class TestimonialsEditorComponent {
  readonly testimonials = input.required<CmsTestimonial[]>();
  readonly testimonialsChange = output<CmsTestimonial[]>();
  readonly queuedDelete = output<string>();
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly media = inject(MediaService);
  readonly url = inject(MediaUrlService);

  update(index: number, change: Partial<CmsTestimonial>): void {
    this.testimonialsChange.emit(this.testimonials().map((item, current) => current === index ? { ...item, ...change } : item));
  }

  feature(index: number, featured: boolean): void {
    this.testimonialsChange.emit(this.testimonials().map((item, current) => ({ ...item, featured: current === index ? featured : featured ? false : item.featured })));
  }

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set('');
    this.uploading.set(true);
    this.media.upload(file).pipe(finalize(() => { this.uploading.set(false); input.value = ''; })).subscribe({
      next: (uploaded) => this.testimonialsChange.emit([...this.testimonials(), { id: crypto.randomUUID(), name: file.name.replace(/\.mp4$/i, ''), label: 'Cliente Purifreze', url: uploaded.url, featured: false, isVisible: true }]),
      error: () => this.error.set('No se pudo subir el testimonio. Verifica que sea MP4 y no supere 25 MB.'),
    });
  }

  remove(index: number): void {
    const item = this.testimonials()[index];
    if (!item) return;
    const filename = this.url.uploadedFilename(item.url);
    if (filename) this.queuedDelete.emit(filename);
    this.testimonialsChange.emit(this.testimonials().filter((_, current) => current !== index));
  }
}
