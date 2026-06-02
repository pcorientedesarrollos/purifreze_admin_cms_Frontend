import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComparisonBadge } from '../core/models/comparison';
import { ContentSection, SectionDraft } from '../core/models/content-section';
import { FaqItem } from '../core/models/faq';
import { editorForSection, sectionCatalog, SectionCatalogItem } from '../core/models/section-catalog';
import { CmsVideo } from '../core/models/video';
import { CmsTestimonial } from '../core/models/testimonial';
import { ContentSectionsService } from '../core/services/content-sections.service';
import { MediaService } from '../core/services/media.service';
import { AdminShellComponent } from '../layout/admin-shell.component';
import { SaveBarComponent, SaveStatus } from '../layout/save-bar.component';
import { ComparisonEditorComponent } from './comparison-editor.component';
import { FaqEditorComponent } from './faq-editor.component';
import { GenericEditorComponent } from './generic-editor.component';
import { VideosEditorComponent } from './videos-editor.component';
import { TestimonialsEditorComponent } from './testimonials-editor.component';

@Component({
  selector: 'app-section-editor-page',
  imports: [CommonModule, FormsModule, AdminShellComponent, SaveBarComponent, GenericEditorComponent, ComparisonEditorComponent, FaqEditorComponent, VideosEditorComponent, TestimonialsEditorComponent],
  template: `
    <app-admin-shell [sections]="sections()" (create)="createOpen.set(true)">
      <div class="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9">
        @if (loading()) {
          <div class="grid min-h-[55vh] place-items-center text-blue-700"><i class="fa-solid fa-circle-notch animate-spin text-3xl"></i></div>
        } @else if (draft(); as section) {
          <section class="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="eyebrow">Seccion de la landing</p>
              <h1 class="mt-1 font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-none tracking-[-.045em] text-blue-950">{{ section.label }}</h1>
              <p class="mt-3 max-w-2xl text-sm leading-relaxed text-blue-950/55">Edita el contenido publicado de esta sección. El cambio llega a la landing cuando presionas guardar.</p>
            </div>
            <span class="rounded-full px-3 py-1.5 text-xs font-extrabold" [class.bg-blue-100]="section.isVisible" [class.text-blue-700]="section.isVisible" [class.bg-slate-200]="!section.isVisible" [class.text-slate-600]="!section.isVisible">
              {{ section.isVisible ? 'Visible en landing' : 'Oculta en landing' }}
            </span>
          </section>

          <section class="editor-surface">
            <app-generic-editor
              [section]="section"
              [showJson]="editorFor(section.key) === 'generic'"
              [json]="jsonText()"
              (sectionChange)="updateDraft($event)"
              (jsonChange)="updateJson($event)"
            />
          </section>

          @if (editorFor(section.key) === 'comparison') {
            <section class="editor-surface mt-5">
              <app-comparison-editor [badges]="comparisonBadges()" (badgesChange)="updateBadges($event)" />
            </section>
          }

          @if (editorFor(section.key) === 'faq') {
            <section class="editor-surface mt-5">
              <app-faq-editor [faqs]="faqs()" (faqsChange)="updateFaqs($event)" />
            </section>
          }

          @if (editorFor(section.key) === 'videos') {
            <section class="editor-surface mt-5">
              <app-videos-editor [videos]="videos()" (videosChange)="updateVideos($event)" (queuedDelete)="queueDelete($event)" />
            </section>
          }
          @if (editorFor(section.key) === 'testimonials') {
            <section class="editor-surface mt-5">
              <app-testimonials-editor [testimonials]="testimonials()" (testimonialsChange)="updateTestimonials($event)" (queuedDelete)="queueDelete($event)" />
            </section>
          }
        } @else {
          <div class="grid min-h-[55vh] place-items-center border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center">
            <div>
              <i class="fa-regular fa-folder-open text-4xl text-blue-400"></i>
              <h1 class="mt-4 font-display text-3xl font-bold tracking-tight text-blue-950">No hay secciones todavía</h1>
              <button type="button" class="primary-button mt-5" (click)="createOpen.set(true)">Crear primera sección</button>
            </div>
          </div>
        }
      </div>

      @if (draft()) {
        <app-save-bar [status]="saveStatus()" [errorMessage]="saveError()" (save)="save()" />
      }
    </app-admin-shell>

    @if (createOpen()) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-blue-950/35 p-4" (click)="createOpen.set(false)">
        <section class="w-full max-w-2xl rounded-2xl bg-[#fbfdff] p-6 shadow-2xl shadow-blue-950/25" (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between gap-4">
            <div><p class="eyebrow">Nueva sección</p><h2 class="mt-1 font-display text-2xl font-bold tracking-tight text-blue-950">¿Qué quieres agregar?</h2></div>
            <button type="button" class="text-blue-950/45 hover:text-blue-950" (click)="createOpen.set(false)"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <p class="mt-2 text-sm leading-relaxed text-blue-950/55">Elige una sección. Podrás personalizar su contenido después de agregarla.</p>
          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            @for (item of catalog; track item.key) {
              <button
                type="button"
                class="rounded-2xl border border-blue-100 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45"
                [disabled]="hasSection(item.key) || creating()"
                (click)="create(item)"
              >
                <i class="fa-solid text-xl text-blue-500" [class]="item.icon"></i>
                <strong class="mt-4 block text-sm text-blue-950">{{ item.label }}</strong>
                <span class="mt-1 block text-xs leading-relaxed text-blue-950/55">{{ item.description }}</span>
                <span class="mt-3 block text-[10px] font-extrabold uppercase tracking-[.14em]" [class.text-blue-400]="hasSection(item.key)" [class.text-blue-700]="!hasSection(item.key)">
                  {{ hasSection(item.key) ? 'Ya agregada' : creating() ? 'Agregando...' : 'Agregar' }}
                </span>
              </button>
            }
          </div>
          @if (createError()) { <p class="mt-3 text-sm font-bold text-red-600">{{ createError() }}</p> }
          <div class="mt-6 flex justify-end">
            <button type="button" class="secondary-button" (click)="createOpen.set(false)">Cerrar</button>
          </div>
        </section>
      </div>
    }
  `,
})
export class SectionEditorPageComponent {
  private readonly api = inject(ContentSectionsService);
  private readonly media = inject(MediaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly sections = signal<ContentSection[]>([]);
  readonly draft = signal<SectionDraft | null>(null);
  readonly jsonText = signal('{}');
  readonly comparisonBadges = signal<ComparisonBadge[]>([]);
  readonly faqs = signal<FaqItem[]>([]);
  readonly videos = signal<CmsVideo[]>([]);
  readonly testimonials = signal<CmsTestimonial[]>([]);
  readonly pendingDelete = signal<string[]>([]);
  readonly loading = signal(true);
  readonly saveStatus = signal<SaveStatus>('idle');
  readonly saveError = signal('');
  readonly createOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly catalog = sectionCatalog;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (sections) => {
        this.sections.set(sections);
        const key = this.route.snapshot.paramMap.get('key');
        if (!key && sections[0]) {
          void this.router.navigate(['/sections', sections[0].key], { replaceUrl: true });
          return;
        }
        this.setActive(sections.find((section) => section.key === key) ?? sections[0] ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.saveError.set('No se pudo conectar con la API de contenido.');
        this.saveStatus.set('error');
      },
    });
  }

  setActive(section: ContentSection | null): void {
    if (!section) {
      this.draft.set(null);
      return;
    }
    const draft = structuredClone(section) as SectionDraft;
    this.draft.set(draft);
    this.jsonText.set(JSON.stringify(draft.content ?? {}, null, 2));
    this.comparisonBadges.set(this.readArray<ComparisonBadge>(draft.content, 'badges'));
    this.faqs.set(this.readArray<FaqItem>(draft.content, 'faqs'));
    this.videos.set(this.readArray<CmsVideo>(draft.content, 'videos'));
    this.testimonials.set(this.readArray<CmsTestimonial>(draft.content, 'testimonials'));
    this.pendingDelete.set([]);
    this.saveError.set('');
    this.saveStatus.set('idle');
  }

  updateDraft(section: SectionDraft): void {
    this.draft.set(section);
    this.markDirty();
  }

  updateJson(json: string): void {
    this.jsonText.set(json);
    this.markDirty();
  }

  updateBadges(badges: ComparisonBadge[]): void {
    this.comparisonBadges.set(badges);
    this.mergeContent({ badges });
  }

  updateVideos(videos: CmsVideo[]): void {
    this.videos.set(videos);
    this.mergeContent({ videos });
  }

  updateFaqs(faqs: FaqItem[]): void {
    this.faqs.set(faqs);
    this.mergeContent({ faqs });
  }

  updateTestimonials(testimonials: CmsTestimonial[]): void {
    this.testimonials.set(testimonials);
    this.mergeContent({ testimonials });
  }

  queueDelete(filename: string): void {
    this.pendingDelete.update((items) => [...new Set([...items, filename])]);
  }

  save(): void {
    const draft = this.draft();
    if (!draft || this.saveStatus() === 'saving') return;
    let content = draft.content ?? {};
    if (this.editorFor(draft.key) === 'generic') {
      try {
        content = JSON.parse(this.jsonText()) as Record<string, unknown>;
      } catch {
        this.saveError.set('El contenido avanzado no contiene JSON válido.');
        this.saveStatus.set('error');
        return;
      }
    }
    this.saveStatus.set('saving');
    this.saveError.set('');
    this.api.update(draft.key, {
      label: draft.label,
      title: draft.title,
      description: draft.description,
      content,
      sortOrder: draft.sortOrder,
      isVisible: draft.isVisible,
    }).subscribe({
      next: (section) => {
        this.sections.update((items) => items.map((item) => (item.key === section.key ? section : item)));
        this.deleteQueuedFiles();
        this.setActive(section);
        this.saveStatus.set('saved');
      },
      error: (error: HttpErrorResponse) => {
        this.saveError.set(error.error?.message ?? 'No se pudieron guardar los cambios.');
        this.saveStatus.set('error');
      },
    });
  }

  create(item: SectionCatalogItem): void {
    if (this.hasSection(item.key)) return;
    this.creating.set(true);
    this.createError.set('');
    this.api.create(item.createSection()).subscribe({
      next: (section) => {
        this.createOpen.set(false);
        this.creating.set(false);
        void this.router.navigate(['/sections', section.key]);
      },
      error: (error: HttpErrorResponse) => {
        this.creating.set(false);
        this.createError.set(error.error?.message ?? 'No se pudo crear la sección.');
      },
    });
  }

  editorFor(key: string) {
    return editorForSection(key);
  }

  hasSection(key: string): boolean {
    return this.sections().some((section) => section.key === key);
  }

  private mergeContent(change: Record<string, unknown>): void {
    const draft = this.draft();
    if (!draft) return;
    this.draft.set({ ...draft, content: { ...(draft.content ?? {}), ...change } });
    this.markDirty();
  }

  private markDirty(): void {
    this.saveError.set('');
    this.saveStatus.set('dirty');
  }

  private deleteQueuedFiles(): void {
    const filenames = this.pendingDelete();
    this.pendingDelete.set([]);
    if (!filenames.length) return;
    forkJoin(filenames.map((filename) => this.media.remove(filename).pipe(catchError(() => of({ deleted: false }))))).subscribe();
  }

  private readArray<T>(content: Record<string, unknown> | null, key: string): T[] {
    const value = content?.[key];
    return Array.isArray(value) ? structuredClone(value) as T[] : [];
  }
}
