import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { BlogBlock, BlogPost } from '../core/models/blog';
import { BlogService } from '../core/services/blog.service';
import { ContentSection } from '../core/models/content-section';
import { ContentSectionsService } from '../core/services/content-sections.service';
import { MediaService } from '../core/services/media.service';
import { MediaUrlService } from '../core/services/media-url.service';
import { AdminShellComponent } from '../layout/admin-shell.component';

@Component({
  selector: 'app-blog-editor-page',
  imports: [FormsModule, AdminShellComponent],
  template: `
    <app-admin-shell [sections]="sections()">
      @if (post(); as article) {
        <div class="mx-auto max-w-7xl px-5 py-7 sm:px-8">
          <header class="flex flex-wrap items-center justify-between gap-3">
            <div><p class="eyebrow">Editor de blog</p><h1 class="mt-1 font-display text-4xl font-bold tracking-tight text-blue-950">{{ article.title }}</h1><p class="mt-2 text-xs font-bold text-blue-950/45">/blog/{{ article.slug }}</p></div>
            <div class="flex gap-2">
              @if (article.status === 'PUBLISHED') { <button class="secondary-button" type="button" (click)="unpublish()">Retirar</button> }
              @else { <button class="secondary-button" type="button" (click)="publish()">Publicar</button> }
              <button class="primary-button" type="button" (click)="save()">{{ saving() ? 'Guardando...' : 'Guardar borrador' }}</button>
            </div>
          </header>
          @if (message()) { <p class="mt-4 text-sm font-bold" [class.text-red-600]="failed()" [class.text-green-700]="!failed()">{{ message() }}</p> }

          <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.82fr)]">
            <section class="editor-surface grid gap-5">
              <label class="field"><span>Título</span><input [(ngModel)]="article.title" /></label>
              <label class="field"><span>Extracto</span><textarea rows="3" [(ngModel)]="article.excerpt"></textarea></label>
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
              <h2 class="mt-5 font-display text-4xl font-bold leading-tight text-blue-950">{{ article.title }}</h2><p class="mt-3 text-sm leading-relaxed text-blue-950/60">{{ article.excerpt }}</p>
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
  private readonly api = inject(BlogService); private readonly content = inject(ContentSectionsService); private readonly media = inject(MediaService); private readonly urls = inject(MediaUrlService); private readonly route = inject(ActivatedRoute);
  readonly post = signal<BlogPost | null>(null); readonly sections = signal<ContentSection[]>([]); readonly saving = signal(false); readonly uploading = signal(false); readonly message = signal(''); readonly failed = signal(false);
  constructor() { this.api.find(Number(this.route.snapshot.paramMap.get('id'))).subscribe({ next: (post) => this.post.set(post), error: () => this.notify('No se pudo cargar el artículo.', true) }); this.content.list().subscribe({ next: (sections) => this.sections.set(sections) }); }
  save(after?: (post: BlogPost) => void): void { const post = this.post(); if (!post || this.saving()) return; this.saving.set(true); const draft = { title: post.title, excerpt: post.excerpt, coverImageUrl: post.coverImageUrl, blocks: post.blocks }; this.api.update(post.id, draft).pipe(finalize(() => this.saving.set(false))).subscribe({ next: (saved) => { this.post.set(saved); this.notify('Borrador guardado.'); after?.(saved); }, error: (error: HttpErrorResponse) => this.notify(error.error?.message ?? 'No se pudo guardar.', true) }); }
  publish(): void { this.save((post) => this.api.publish(post.id).subscribe({ next: (published) => { this.post.set(published); this.notify('Artículo publicado.'); }, error: () => this.notify('No se pudo publicar.', true) })); }
  unpublish(): void { const post = this.post(); if (!post) return; this.api.unpublish(post.id).subscribe({ next: (draft) => { this.post.set(draft); this.notify('Artículo retirado.'); }, error: () => this.notify('No se pudo retirar.', true) }); }
  add(type: BlogBlock['type']): void { const post = this.post(); if (!post) return; const id = crypto.randomUUID(); const block = type === 'paragraph' ? { id, type, data: { text: '' } } : type === 'heading' ? { id, type, data: { text: '', level: 2 as const } } : type === 'list' ? { id, type, data: { items: [''] } } : type === 'link' ? { id, type, data: { text: '', url: '' } } : { id, type, data: { url: '', alt: '' } }; post.blocks = [...post.blocks, block]; this.post.set({ ...post }); }
  remove(index: number): void { const post = this.post(); if (!post) return; post.blocks.splice(index, 1); this.post.set({ ...post }); }
  move(index: number, offset: number): void { const post = this.post(); const target = index + offset; if (!post || target < 0 || target >= post.blocks.length) return; [post.blocks[index], post.blocks[target]] = [post.blocks[target], post.blocks[index]]; this.post.set({ ...post }); }
  upload(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; const post = this.post(); if (!file || !post) return; this.uploading.set(true); this.media.uploadImage(file).pipe(finalize(() => this.uploading.set(false))).subscribe({ next: (image) => { post.coverImageUrl = image.url; this.post.set({ ...post }); }, error: () => this.notify('No se pudo subir la imagen.', true) }); }
  mediaUrl(path: string): string { return this.urls.resolve(path); } splitLines(value: string): string[] { return value.split('\n'); } label(block: BlogBlock): string { return { paragraph: 'Párrafo', heading: 'Título', list: 'Lista', link: 'Enlace', image: 'Imagen' }[block.type]; }
  private notify(message: string, failed = false): void { this.message.set(message); this.failed.set(failed); }
}
