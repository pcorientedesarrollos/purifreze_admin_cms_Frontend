import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BlogPost } from '../core/models/blog';
import { BlogService } from '../core/services/blog.service';
import { AdminShellComponent } from '../layout/admin-shell.component';

@Component({
  selector: 'app-blog-list-page',
  imports: [RouterLink, AdminShellComponent],
  template: `
    <app-admin-shell>
      <div class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header class="flex flex-wrap items-end justify-between gap-4">
          <div><p class="eyebrow">Blog</p><h1 class="mt-1 font-display text-5xl font-bold tracking-tight text-blue-950">Artículos</h1><p class="mt-3 text-sm text-blue-950/55">Escribe, revisa y publica contenido para tus clientes.</p></div>
          <button type="button" class="primary-button" (click)="create()">Nuevo artículo</button>
        </header>
        @if (error()) { <p class="mt-6 text-sm font-bold text-red-600">{{ error() }}</p> }
        <section class="mt-8 grid gap-3">
          @for (post of posts(); track post.id) {
            <a [routerLink]="['/blog', post.id]" class="grid gap-2 rounded-2xl border border-blue-100 bg-[#fbfdff] p-5 transition hover:border-blue-300 sm:grid-cols-[1fr_auto]">
              <div><h2 class="font-display text-2xl font-bold text-blue-950">{{ post.title }}</h2><p class="mt-1 text-sm text-blue-950/55">{{ post.excerpt }}</p></div>
              <span class="self-start rounded-full px-3 py-1 text-xs font-extrabold" [class.bg-green-100]="post.status === 'PUBLISHED'" [class.text-green-700]="post.status === 'PUBLISHED'" [class.bg-amber-100]="post.status === 'DRAFT'" [class.text-amber-700]="post.status === 'DRAFT'">{{ post.status === 'PUBLISHED' ? 'Publicado' : 'Borrador' }}</span>
            </a>
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
  private readonly router = inject(Router);
  readonly posts = signal<BlogPost[]>([]);
  readonly error = signal('');

  constructor() { this.load(); }
  load(): void { this.api.list().subscribe({ next: (posts) => this.posts.set(posts), error: () => this.error.set('No se pudo cargar el blog.') }); }
  create(): void {
    this.api.create({ title: 'Nuevo artículo', excerpt: 'Escribe un resumen breve para tus lectores.', coverImageUrl: null, blocks: [{ id: crypto.randomUUID(), type: 'paragraph', data: { text: 'Comienza a escribir aquí.' } }] })
      .subscribe({ next: (post) => void this.router.navigate(['/blog', post.id]), error: () => this.error.set('No se pudo crear el artículo.') });
  }
}
