import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { sectionCatalog } from '../core/models/section-catalog';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-admin-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside class="relative overflow-hidden bg-[#0b2d59] px-5 pb-7 pt-6 text-blue-50 lg:min-h-screen">
        <div class="pointer-events-none absolute -right-20 top-12 h-52 w-52 rounded-full border border-blue-300/15"></div>
        <div class="pointer-events-none absolute -right-8 top-24 h-36 w-36 rounded-full border border-blue-300/15"></div>
        <a routerLink="/sections" class="relative flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-[18px] bg-blue-500 text-lg text-white shadow-lg shadow-blue-950/30">
            <i class="fa-solid fa-droplet"></i>
          </span>
          <span>
            <strong class="block font-display text-xl tracking-tight text-white">Purifreze</strong>
            <small class="text-[11px] font-bold uppercase tracking-[.22em] text-blue-200">Content studio</small>
          </span>
        </a>

        <div class="relative mt-10 flex items-center justify-between">
          <p class="text-[10px] font-bold uppercase tracking-[.24em] text-blue-200">Landing page</p>
        </div>
        <nav class="relative mt-3 grid gap-1">
          @for (section of catalog; track section.key) {
            <a
              [routerLink]="['/sections', section.key]"
              routerLinkActive="bg-white/12 text-white"
              class="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-white/8 hover:text-white"
            >
              <span class="flex min-w-0 items-center gap-2.5">
                <i class="fa-regular fa-file-lines text-xs text-blue-300"></i>
                <span class="truncate">{{ section.label }}</span>
              </span>
            </a>
          }
        </nav>
        <div class="relative mt-8"><p class="text-[10px] font-bold uppercase tracking-[.24em] text-blue-200">Editorial</p></div>
        <nav class="relative mt-3 grid gap-1">
          <a routerLink="/blog" routerLinkActive="bg-white/12 text-white" class="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-white/8 hover:text-white">
            <i class="fa-regular fa-newspaper text-xs text-blue-300"></i><span>Blog</span>
          </a>
        </nav>
      </aside>

      <main class="min-w-0 bg-[#f4f8fc]">
        <header class="flex min-h-16 items-center justify-between border-b border-blue-100 bg-[#fbfdff]/95 px-5 py-3 sm:px-8">
          <p class="text-xs font-bold uppercase tracking-[.2em] text-blue-950/55">Administrador de contenido</p>
          <div class="flex items-center gap-4">
            <a href="http://localhost:4321" target="_blank" class="text-sm font-bold text-blue-700 transition hover:text-blue-950">Ver landing <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-xs"></i></a>
            <button type="button" class="text-sm font-bold text-blue-700 transition hover:text-blue-950" (click)="logout()">Salir</button>
          </div>
        </header>
        <ng-content />
      </main>
    </div>
  `,
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly catalog = sectionCatalog;
  logout(): void { this.auth.logout().subscribe({ next: () => void this.router.navigate(['/login']) }); }
}
