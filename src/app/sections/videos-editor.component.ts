import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CmsVideo } from '../core/models/video';
import { MediaService } from '../core/services/media.service';
import { MediaUrlService } from '../core/services/media-url.service';

@Component({
  selector: 'app-videos-editor',
  imports: [FormsModule],
  template: `
    <section>
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow">Galería audiovisual</p>
          <h2 class="mt-1 font-display text-2xl font-bold tracking-tight text-blue-950">Videos de la landing</h2>
          <p class="mt-1 text-sm text-blue-950/55">Sube MP4 de hasta 25 MB. El reproductor público conserva controles nativos.</p>
        </div>
        <label class="secondary-button cursor-pointer" [class.pointer-events-none]="uploading()" [class.opacity-60]="uploading()">
          <i class="fa-solid mr-2 text-xs" [class.fa-circle-notch]="uploading()" [class.animate-spin]="uploading()" [class.fa-upload]="!uploading()"></i>
          {{ uploading() ? 'Subiendo...' : 'Subir video' }}
          <input type="file" class="sr-only" accept="video/mp4" [disabled]="uploading()" (change)="upload($event)" />
        </label>
      </div>

      @if (error()) { <p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error() }}</p> }
      <div class="grid gap-4 xl:grid-cols-2">
        @for (video of videos(); track video.id; let index = $index) {
          <article class="overflow-hidden rounded-2xl border border-blue-100 bg-[#fbfdff]" [class.opacity-55]="!video.isVisible">
            <video class="aspect-video w-full bg-blue-950 object-cover" controls preload="metadata" [src]="url.resolve(video.url)"></video>
            <div class="grid gap-3 p-4">
              <label class="field"><span>Título</span><input [ngModel]="video.title" (ngModelChange)="update(index, { title: $event })" /></label>
              <label class="field"><span>Ruta del video</span><input [ngModel]="video.url" (ngModelChange)="update(index, { url: $event })" /></label>
              <div class="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-blue-950">
                <div class="flex gap-4">
                  <label class="flex items-center gap-2"><input type="checkbox" class="accent-blue-600" [ngModel]="video.isVisible" (ngModelChange)="update(index, { isVisible: $event })" /> Visible</label>
                  <label class="flex items-center gap-2"><input type="checkbox" class="accent-blue-600" [ngModel]="video.vertical" (ngModelChange)="update(index, { vertical: $event })" /> Vertical</label>
                </div>
                <button type="button" class="text-red-600 transition hover:text-red-800" (click)="remove(index)">
                  <i class="fa-regular fa-trash-can mr-1"></i>Eliminar
                </button>
              </div>
            </div>
          </article>
        } @empty {
          <div class="border border-dashed border-blue-200 bg-blue-50/55 px-5 py-8 text-center xl:col-span-2">
            <i class="fa-regular fa-circle-play text-3xl text-blue-400"></i>
            <p class="mt-3 font-display text-xl font-bold text-blue-950">Todavía no hay videos</p>
            <p class="mt-1 text-sm text-blue-950/55">Sube el primer MP4 para abrir la galería.</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class VideosEditorComponent {
  readonly videos = input.required<CmsVideo[]>();
  readonly videosChange = output<CmsVideo[]>();
  readonly queuedDelete = output<string>();
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly media = inject(MediaService);
  readonly url = inject(MediaUrlService);

  update(index: number, change: Partial<CmsVideo>): void {
    this.videosChange.emit(this.videos().map((video, current) => (current === index ? { ...video, ...change } : video)));
  }

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set('');
    this.uploading.set(true);
    this.media.upload(file).pipe(finalize(() => {
      this.uploading.set(false);
      input.value = '';
    })).subscribe({
      next: (uploaded) => this.videosChange.emit([
        ...this.videos(),
        { id: crypto.randomUUID(), title: file.name.replace(/\.mp4$/i, ''), url: uploaded.url, vertical: false, isVisible: true },
      ]),
      error: () => this.error.set('No se pudo subir el video. Verifica que sea MP4 y no supere 25 MB.'),
    });
  }

  remove(index: number): void {
    const video = this.videos()[index];
    if (!video) return;
    const filename = this.url.uploadedFilename(video.url);
    if (filename) this.queuedDelete.emit(filename);
    this.videosChange.emit(this.videos().filter((_, current) => current !== index));
  }
}
