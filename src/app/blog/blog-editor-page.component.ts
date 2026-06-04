import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BlogBlock, BlogPost, SaveBlogPost } from '../core/models/blog';
import { BlogService } from '../core/services/blog.service';
import { MediaService } from '../core/services/media.service';
import { MediaUrlService } from '../core/services/media-url.service';
import { AdminShellComponent } from '../layout/admin-shell.component';

type EditorDraft = SaveBlogPost & { status: BlogPost['status'] | null; slug: string | null };

@Component({
  selector: 'app-blog-editor-page',
  imports: [FormsModule, AdminShellComponent],
  template: `
    <app-admin-shell>
      @if (draft(); as article) {
        <div class="mx-auto max-w-7xl px-5 py-7 sm:px-8">
          <header class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="eyebrow">{{ isNew() ? 'Nuevo artículo' : 'Editor de blog' }}</p>
              <h1 class="mt-1 font-display text-4xl font-bold tracking-tight text-blue-950">{{ article.title || 'Sin título' }}</h1>
              @if (article.slug) { <p class="mt-2 text-xs font-bold text-blue-950/45">/blog/{{ article.slug }}</p> }
            </div>
            <div class="flex gap-2">
              @if (!isNew()) {
                @if (article.status === 'PUBLISHED') { <button class="secondary-button" type="button" (click)="unpublish()">Retirar</button> }
                @else { <button class="secondary-button" type="button" (click)="publish()">Publicar</button> }
                <button class="secondary-button text-red-600 hover:text-red-800" type="button" [disabled]="deleting()" (click)="removePost()">{{ deleting() ? 'Eliminando...' : 'Eliminar' }}</button>
              }
              <button class="primary-button" type="button" [disabled]="saving() || !canSave()" (click)="save()">{{ saving() ? 'Guardando...' : (isNew() ? 'Crear artículo' : 'Guardar borrador') }}</button>
            </div>
          </header>
          @if (message()) { <p class="mt-4 text-sm font-bold" [class.text-red-600]="failed()" [class.text-green-700]="!failed()">{{ message() }}</p> }

          <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.82fr)]">
            <section class="editor-surface grid gap-5">
              <label class="field"><span>Título</span><input [(ngModel)]="article.title" placeholder="Título del artículo" required /></label>
              <label class="field"><span>Extracto</span><textarea rows="3" [(ngModel)]="article.excerpt" placeholder="Resumen breve para el listado." required></textarea></label>
              <label class="field"><span>Imagen de portada</span><input [(ngModel)]="article.coverImageUrl" placeholder="/uploads/images/..." /></label>
              <label class="secondary-button w-fit cursor-pointer">
                {{ uploading() ? 'Subiendo...' : 'Subir imagen' }}
                <input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" [disabled]="uploading()" (change)="upload($event)" />
              </label>

              <div class="border-t border-blue-100 pt-5">
                <div class="flex flex-wrap items-center justify-between gap-2"><div><p class="eyebrow">Contenido</p><h2 class="mt-1 font-display text-2xl font-bold text-blue-950">Bloques editoriales</h2></div><div class="flex flex-wrap gap-2"><button class="secondary-button" type="button" (click)="add('paragraph')">Párrafo</button><button class="secondary-button" type="button" (click)="add('heading')">Título</button><button class="secondary-button" type="button" (click)="add('list')">Lista</button><button class="secondary-button" type="button" (click)="add('link')">Enlace</button><button class="secondary-button" type="button" (click)="add('image')">Imagen</button></div></div>
                <div class="mt-4 grid gap-3">
                  @for (block of article.blocks; track block.id; let index = $index) {
                    <article class="rounded-xl border border-blue-100 bg-blue-50/45 p-4">
                      <div class="mb-3 flex items-center justify-between gap-2"><strong class="text-xs uppercase tracking-widest text-blue-700">{{ label(block) }}</strong><div class="flex gap-1"><button type="button" class="secondary-button !px-2 !py-1" (click)="move(index, -1)">↑</button><button type="button" class="secondary-button !px-2 !py-1" (click)="move(index, 1)">↓</button><button type="button" class="secondary-button !px-2 !py-1 text-red-600" (click)="remove(index)">×</button></div></div>
                      @if (block.type === 'paragraph') { <textarea class="w-full rounded-lg border border-blue-100 p-3" rows="4" [(ngModel)]="block.data.text"></textarea> }
                      @if (block.type === 'heading') { <div class="grid gap-2 sm:grid-cols-[100px_1fr]"><select class="rounded-lg border border-blue-100 p-3" [(ngModel)]="block.data.level"><option [ngValue]="2">H2</option><option [ngValue]="3">H3</option></select><input class="rounded-lg border border-blue-100 p-3" [(ngModel)]="block.data.text" /></div> }
                      @if (block.type === 'list') { <textarea class="w-full rounded-lg border border-blue-100 p-3" rows="4" [ngModel]="block.data.items.join('\\n')" (ngModelChange)="block.data.items = splitLines($event)"></textarea> }
                      @if (block.type === 'link') { <div class="grid gap-2"><input class="rounded-lg border border-blue-100 p-3" [(ngModel)]="block.data.text" placeholder="Texto del enlace" /><input class="rounded-lg border border-blue-100 p-3" [(ngModel)]="block.data.url" placeholder="https://..." /></div> }
                      @if (block.type === 'image') { <div class="grid gap-2"><input class="rounded-lg border border-blue-100 p-3" [(ngModel)]="block.data.url" placeholder="URL de imagen" /><input class="rounded-lg border border-blue-100 p-3" [(ngModel)]="block.data.alt" placeholder="Descripción accesible" /></div> }
                    </article>
                  }
                </div>
              </div>
            </section>

            <aside class="editor-surface self-start xl:sticky xl:top-5">
              <p class="eyebrow">Vista previa</p>
              @if (article.coverImageUrl) { <img class="mt-4 aspect-[16/9] w-full rounded-xl object-cover" [src]="mediaUrl(article.coverImageUrl)" alt="" /> }
              <h2 class="mt-5 font-display text-4xl font-bold leading-tight text-blue-950">{{ article.title || 'Sin título' }}</h2><p class="mt-3 text-sm leading-relaxed text-blue-950/60">{{ article.excerpt }}</p>
              <div class="prose-preview mt-6">
                @for (block of article.blocks; track block.id) {
                  @if (block.type === 'paragraph') { <p>{{ block.data.text }}</p> }
                  @if (block.type === 'heading' && block.data.level === 2) { <h2>{{ block.data.text }}</h2> }
                  @if (block.type === 'heading' && block.data.level === 3) { <h3>{{ block.data.text }}</h3> }
                  @if (block.type === 'list') { <ul>@for (item of block.data.items; track item) { <li>{{ item }}</li> }</ul> }
                  @if (block.type === 'link') { <p><a class="font-bold text-blue-600 underline" [href]="block.data.url">{{ block.data.text }}</a></p> }
                  @if (block.type === 'image' && block.data.url) { <img [src]="mediaUrl(block.data.url)" [alt]="block.data.alt" /> }
                }
              </div>
            </aside>
          </div>
        </div>
      }
    </app-admin-shell>
  `,
})
export class BlogEditorPageComponent {
  private readonly api = inject(BlogService);
  private readonly media = inject(MediaService);
  private readonly urls = inject(MediaUrlService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly postId = signal<number | null>(null);
  readonly draft = signal<EditorDraft | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly uploading = signal(false);
  readonly message = signal('');
  readonly failed = signal(false);
  readonly isNew = computed(() => this.postId() === null);
  readonly canSave = computed(() => {
    const d = this.draft();
    return !!d && d.title.trim().length > 0 && d.excerpt.trim().length > 0;
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.postId.set(id);
      this.api.find(id).subscribe({
        next: (post) => this.draft.set({ title: post.title, excerpt: post.excerpt, coverImageUrl: post.coverImageUrl, blocks: post.blocks, status: post.status, slug: post.slug }),
        error: () => this.notify('No se pudo cargar el artículo.', true),
      });
    } else {
      this.draft.set({ title: '', excerpt: '', coverImageUrl: null, blocks: [], status: null, slug: null });
    }
  }

  save(after?: (post: BlogPost) => void): void {
    const draft = this.draft();
    if (!draft || this.saving() || !this.canSave()) return;
    this.saving.set(true);
    const payload: SaveBlogPost = { title: draft.title.trim(), excerpt: draft.excerpt.trim(), coverImageUrl: draft.coverImageUrl?.trim() || null, blocks: draft.blocks };
    const id = this.postId();
    const request$ = id === null ? this.api.create(payload) : this.api.update(id, payload);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        const wasNew = id === null;
        this.postId.set(saved.id);
        this.draft.set({ title: saved.title, excerpt: saved.excerpt, coverImageUrl: saved.coverImageUrl, blocks: saved.blocks, status: saved.status, slug: saved.slug });
        this.notify(wasNew ? 'Artículo creado.' : 'Borrador guardado.');
        if (wasNew) void this.router.navigate(['/blog', saved.id], { replaceUrl: true });
        after?.(saved);
      },
      error: (error: HttpErrorResponse) => this.notify(error.error?.message ?? 'No se pudo guardar.', true),
    });
  }

  publish(): void {
    const id = this.postId();
    if (id === null) return;
    this.save(() => this.api.publish(id).subscribe({
      next: (published) => { this.draft.update((d) => d ? { ...d, status: published.status, slug: published.slug } : d); this.notify('Artículo publicado.'); },
      error: () => this.notify('No se pudo publicar.', true),
    }));
  }

  unpublish(): void {
    const id = this.postId();
    if (id === null) return;
    this.api.unpublish(id).subscribe({
      next: (post) => { this.draft.update((d) => d ? { ...d, status: post.status, slug: post.slug } : d); this.notify('Artículo retirado.'); },
      error: () => this.notify('No se pudo retirar.', true),
    });
  }

  removePost(): void {
    const id = this.postId();
    const draft = this.draft();
    if (id === null || !draft || this.deleting()) return;
    const confirmed = window.confirm(`¿Eliminar "${draft.title || 'Sin título'}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    this.deleting.set(true);
    this.api.delete(id).pipe(finalize(() => this.deleting.set(false))).subscribe({
      next: () => void this.router.navigate(['/blog']),
      error: () => this.notify('No se pudo eliminar el artículo.', true),
    });
  }

  add(type: BlogBlock['type']): void {
    const draft = this.draft();
    if (!draft) return;
    const id = crypto.randomUUID();
    const block: BlogBlock =
      type === 'paragraph' ? { id, type, data: { text: '' } } :
      type === 'heading' ? { id, type, data: { text: '', level: 2 } } :
      type === 'list' ? { id, type, data: { items: [''] } } :
      type === 'link' ? { id, type, data: { text: '', url: '' } } :
      { id, type, data: { url: '', alt: '' } };
    this.draft.set({ ...draft, blocks: [...draft.blocks, block] });
  }

  remove(index: number): void { const d = this.draft(); if (!d) return; const blocks = [...d.blocks]; blocks.splice(index, 1); this.draft.set({ ...d, blocks }); }
  move(index: number, offset: number): void { const d = this.draft(); const target = index + offset; if (!d || target < 0 || target >= d.blocks.length) return; const blocks = [...d.blocks]; [blocks[index], blocks[target]] = [blocks[target], blocks[index]]; this.draft.set({ ...d, blocks }); }
  upload(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; const d = this.draft(); if (!file || !d) return; this.uploading.set(true); this.media.uploadImage(file).pipe(finalize(() => this.uploading.set(false))).subscribe({ next: (image) => this.draft.set({ ...d, coverImageUrl: image.url }), error: () => this.notify('No se pudo subir la imagen.', true) }); }
  mediaUrl(path: string): string { return this.urls.resolve(path); }
  splitLines(value: string): string[] { return value.split('\n'); }
  label(block: BlogBlock): string { return { paragraph: 'Párrafo', heading: 'Título', list: 'Lista', link: 'Enlace', image: 'Imagen' }[block.type]; }
  private notify(message: string, failed = false): void { this.message.set(message); this.failed.set(failed); }
}
