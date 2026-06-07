import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BlogPost } from '../core/models/blog';
import { BlogService } from '../core/services/blog.service';
import { MediaUrlService } from '../core/services/media-url.service';
import { AdminShellComponent } from '../layout/admin-shell.component';

@Component({
  selector: 'app-blog-list-page',
  imports: [RouterLink, AdminShellComponent],
  template: `
    <app-admin-shell>
      <div class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header class="flex flex-wrap items-end justify-between gap-4">
          <div><p class="eyebrow">Blog</p><h1 class="mt-1 font-display text-5xl font-bold tracking-tight text-blue-950">Artículos</h1><p class="mt-3 text-sm text-blue-950/55">Escribe, revisa y publica contenido para tus clientes.</p></div>
          <a routerLink="/blog/new" class="primary-button">Nuevo artículo</a>
        </header>
        @if (error()) { <p class="mt-6 text-sm font-bold text-red-600">{{ error() }}</p> }
        <section class="mt-8 grid gap-3">
          @for (post of posts(); track post.id) {
            <article class="grid gap-4 rounded-2xl border border-blue-100 bg-[#fbfdff] p-5 transition hover:border-blue-300 sm:grid-cols-[auto_1fr_auto]">
              <a [routerLink]="['/blog', post.id]" class="flex items-center">
                @if (post.coverImageUrl) {
                  <img class="h-20 w-28 rounded-xl object-cover" [src]="urls.resolve(post.coverImageUrl)" alt="" />
                } @else if (post.coverColor && post.coverIcon) {
                  <div class="grid h-20 w-28 place-items-center rounded-xl" [style.backgroundColor]="post.coverColor">
                    <i class="fa-solid fa-{{ post.coverIcon }} text-3xl text-white/80"></i>
                  </div>
                } @else {
                  <div class="grid h-20 w-28 place-items-center rounded-xl bg-blue-50">
                    <i class="fa-regular fa-newspaper text-2xl text-blue-300"></i>
                  </div>
                }
              </a>
              <a [routerLink]="['/blog', post.id]" class="min-w-0">
                <h2 class="font-display text-2xl font-bold text-blue-950">{{ post.title }}</h2>
                <p class="mt-1 text-sm text-blue-950/55">{{ post.excerpt }}</p>
                <div class="mt-2 flex flex-wrap gap-2 text-xs">
                  @if (post.category) { <span class="rounded-full bg-blue-100 px-2.5 py-0.5 font-bold text-blue-700">{{ post.category }}</span> }
                  @if (post.authorName) { <span class="rounded-full bg-blue-950/5 px-2.5 py-0.5 font-bold text-blue-950/60">{{ post.authorInitials ? post.authorInitials + ' — ' : '' }}{{ post.authorName }}</span> }
                  @if (post.readMin !== null) { <span class="text-blue-950/40">{{ post.readMin }} min de lectura</span> }
                </div>
              </a>
              <div class="flex flex-col items-end justify-between gap-2">
                <span class="rounded-full px-3 py-1 text-xs font-extrabold" [class.bg-green-100]="post.status === 'PUBLISHED'" [class.text-green-700]="post.status === 'PUBLISHED'" [class.bg-amber-100]="post.status === 'DRAFT'" [class.text-amber-700]="post.status === 'DRAFT'">{{ post.status === 'PUBLISHED' ? 'Publicado' : 'Borrador' }}</span>
                <button type="button" class="secondary-button !px-3 !py-1.5 text-xs text-red-600 hover:text-red-800" [disabled]="deletingId() === post.id" (click)="remove(post)">
                  {{ deletingId() === post.id ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </article>
          } @empty {
            <div class="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-10 text-center text-sm text-blue-950/55">Todavía no hay artículos. Crea el primero para comenzar.</div>
          }
        </section>
      </div>
    </app-admin-shell>
  `,
})
export class BlogListPageComponent {
  private readonly api = inject(BlogService);
  readonly urls = inject(MediaUrlService);
  readonly posts = signal<BlogPost[]>([]);
  readonly error = signal('');
  readonly deletingId = signal<number | null>(null);

  constructor() { this.load(); }
  load(): void { this.api.list().subscribe({ next: (posts) => this.posts.set(posts), error: () => this.error.set('No se pudo cargar el blog.') }); }

  remove(post: BlogPost): void {
    const confirmed = window.confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`);
    if (!confirmed || this.deletingId()) return;
    this.error.set('');
    this.deletingId.set(post.id);
    this.api.delete(post.id).pipe(finalize(() => this.deletingId.set(null))).subscribe({
      next: () => this.posts.update((posts) => posts.filter((item) => item.id !== post.id)),
      error: () => this.error.set('No se pudo eliminar el artículo.'),
    });
  }
}