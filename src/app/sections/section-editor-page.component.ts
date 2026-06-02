import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { ComparisonBadge } from '../core/models/comparison';
import { FaqItem } from '../core/models/faq';
import { SectionCatalogItem, sectionByKey, sectionCatalog } from '../core/models/section-catalog';
import { isTempId } from '../core/models/temp-id';
import { CmsTestimonial } from '../core/models/testimonial';
import { CmsVideo } from '../core/models/video';
import { ComparisonRowsService, CreateComparisonRow, UpdateComparisonRow } from '../core/services/comparison-rows.service';
import { CreateFaqItem, FaqItemsService, UpdateFaqItem } from '../core/services/faq-items.service';
import { CreateTestimonial, TestimonialsService, UpdateTestimonial } from '../core/services/testimonials.service';
import { CreateVideo, UpdateVideo, VideosService } from '../core/services/videos.service';
import { MediaService } from '../core/services/media.service';
import { AdminShellComponent } from '../layout/admin-shell.component';
import { SaveBarComponent, SaveStatus } from '../layout/save-bar.component';
import { ComparisonEditorComponent } from './comparison-editor.component';
import { FaqEditorComponent } from './faq-editor.component';
import { TestimonialsEditorComponent } from './testimonials-editor.component';
import { VideosEditorComponent } from './videos-editor.component';

type Identified = { id: number };

@Component({
  selector: 'app-section-editor-page',
  imports: [CommonModule, FormsModule, AdminShellComponent, SaveBarComponent, ComparisonEditorComponent, FaqEditorComponent, VideosEditorComponent, TestimonialsEditorComponent],
  template: `
    <app-admin-shell>
      <div class="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9">
        @if (loading()) {
          <div class="grid min-h-[55vh] place-items-center text-blue-700"><i class="fa-solid fa-circle-notch animate-spin text-3xl"></i></div>
        } @else if (section(); as s) {
          <section class="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="eyebrow">Sección de la landing</p>
              <h1 class="mt-1 font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-none tracking-[-.045em] text-blue-950">{{ s.label }}</h1>
              <p class="mt-3 max-w-2xl text-sm leading-relaxed text-blue-950/55">{{ s.description }}</p>
            </div>
          </section>

          <section class="editor-surface">
            @switch (s.editor) {
              @case ('testimonials') {
                <app-testimonials-editor [testimonials]="testimonials()" (testimonialsChange)="onTestimonialsChange($event)" (queuedDelete)="queueDelete($event)" />
              }
              @case ('videos') {
                <app-videos-editor [videos]="videos()" (videosChange)="onVideosChange($event)" (queuedDelete)="queueDelete($event)" />
              }
              @case ('comparison') {
                <app-comparison-editor [badges]="badges()" (badgesChange)="onBadgesChange($event)" />
              }
              @case ('faq') {
                <app-faq-editor [faqs]="faqs()" (faqsChange)="onFaqsChange($event)" />
              }
            }
          </section>
        } @else {
          <div class="grid min-h-[55vh] place-items-center border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center">
            <div>
              <i class="fa-regular fa-folder-open text-4xl text-blue-400"></i>
              <h1 class="mt-4 font-display text-3xl font-bold tracking-tight text-blue-950">Sección no encontrada</h1>
            </div>
          </div>
        }
      </div>

      @if (section()) {
        <app-save-bar [status]="saveStatus()" [errorMessage]="saveError()" (save)="save()" />
      }
    </app-admin-shell>
  `,
})
export class SectionEditorPageComponent {
  private readonly testimonialsApi = inject(TestimonialsService);
  private readonly videosApi = inject(VideosService);
  private readonly comparisonApi = inject(ComparisonRowsService);
  private readonly faqApi = inject(FaqItemsService);
  private readonly media = inject(MediaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly section = signal<SectionCatalogItem | null>(null);

  readonly testimonials = signal<CmsTestimonial[]>([]);
  readonly videos = signal<CmsVideo[]>([]);
  readonly badges = signal<ComparisonBadge[]>([]);
  readonly faqs = signal<FaqItem[]>([]);

  private originalTestimonials: CmsTestimonial[] = [];
  private originalVideos: CmsVideo[] = [];
  private originalBadges: ComparisonBadge[] = [];
  private originalFaqs: FaqItem[] = [];

  readonly pendingDelete = signal<string[]>([]);
  readonly loading = signal(true);
  readonly saveStatus = signal<SaveStatus>('idle');
  readonly saveError = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const key = params.get('key');
      const found = key ? sectionByKey(key) : sectionCatalog[0];
      if (!key && found) {
        void this.router.navigate(['/sections', found.key], { replaceUrl: true });
        return;
      }
      this.section.set(found ?? null);
      if (found) this.load(found);
      else this.loading.set(false);
    });
  }

  private load(section: SectionCatalogItem): void {
    this.loading.set(true);
    this.saveError.set('');
    this.saveStatus.set('idle');
    this.pendingDelete.set([]);
    switch (section.editor) {
      case 'testimonials':
        this.testimonialsApi.list().subscribe({
          next: (items) => { this.originalTestimonials = items; this.testimonials.set(structuredClone(items)); this.loading.set(false); },
          error: () => this.failLoad(),
        });
        break;
      case 'videos':
        this.videosApi.list().subscribe({
          next: (items) => { this.originalVideos = items; this.videos.set(structuredClone(items)); this.loading.set(false); },
          error: () => this.failLoad(),
        });
        break;
      case 'comparison':
        this.comparisonApi.list().subscribe({
          next: (items) => { this.originalBadges = items; this.badges.set(structuredClone(items)); this.loading.set(false); },
          error: () => this.failLoad(),
        });
        break;
      case 'faq':
        this.faqApi.list().subscribe({
          next: (items) => { this.originalFaqs = items; this.faqs.set(structuredClone(items)); this.loading.set(false); },
          error: () => this.failLoad(),
        });
        break;
    }
  }

  private failLoad(): void {
    this.loading.set(false);
    this.saveError.set('No se pudo conectar con la API.');
    this.saveStatus.set('error');
  }

  onTestimonialsChange(items: CmsTestimonial[]): void { this.testimonials.set(items); this.markDirty(); }
  onVideosChange(items: CmsVideo[]): void { this.videos.set(items); this.markDirty(); }
  onBadgesChange(items: ComparisonBadge[]): void { this.badges.set(items); this.markDirty(); }
  onFaqsChange(items: FaqItem[]): void { this.faqs.set(items); this.markDirty(); }

  queueDelete(filename: string): void {
    this.pendingDelete.update((list) => [...new Set([...list, filename])]);
  }

  save(): void {
    const section = this.section();
    if (!section || this.saveStatus() === 'saving') return;
    this.saveStatus.set('saving');
    this.saveError.set('');
    switch (section.editor) {
      case 'testimonials':
        this.saveTestimonials();
        break;
      case 'videos':
        this.saveVideos();
        break;
      case 'comparison':
        this.saveBadges();
        break;
      case 'faq':
        this.saveFaqs();
        break;
    }
  }

  private saveTestimonials(): void {
    const draft = this.testimonials();
    const original = this.originalTestimonials;
    const createOps = draft.filter((d) => isTempId(d.id)).map((d) => {
      const dto: CreateTestimonial = { name: d.name, label: d.label, videoUrl: d.videoUrl, featured: d.featured, isVisible: d.isVisible };
      return this.testimonialsApi.create(dto);
    });
    const updateOps = draft.filter((d) => !isTempId(d.id)).map((d) => {
      const orig = original.find((o) => o.id === d.id);
      if (!orig) return null;
      const patch = this.diffPatch<CmsTestimonial, UpdateTestimonial>(orig, d, ['name', 'label', 'videoUrl', 'featured', 'isVisible']);
      return patch ? this.testimonialsApi.update(d.id, patch) : null;
    }).filter((op): op is NonNullable<typeof op> => op !== null);
    const deleteOps = this.deletedIds(original, draft).map((id) => this.testimonialsApi.delete(id));
    this.runSave([...createOps, ...updateOps, ...deleteOps], () => {
      const finalIds = draft.map((d) => isTempId(d.id) ? null : d.id).filter((id): id is number => id !== null);
      const reorder = this.shouldReorder(original, draft) && finalIds.length === draft.length ? this.testimonialsApi.reorder(finalIds) : null;
      this.finishSave(reorder, () => this.load(this.section()!));
    });
  }

  private saveVideos(): void {
    const draft = this.videos();
    const original = this.originalVideos;
    const createOps = draft.filter((d) => isTempId(d.id)).map((d) => {
      const dto: CreateVideo = { title: d.title, url: d.url, vertical: d.vertical, isVisible: d.isVisible };
      return this.videosApi.create(dto);
    });
    const updateOps = draft.filter((d) => !isTempId(d.id)).map((d) => {
      const orig = original.find((o) => o.id === d.id);
      if (!orig) return null;
      const patch = this.diffPatch<CmsVideo, UpdateVideo>(orig, d, ['title', 'url', 'vertical', 'isVisible']);
      return patch ? this.videosApi.update(d.id, patch) : null;
    }).filter((op): op is NonNullable<typeof op> => op !== null);
    const deleteOps = this.deletedIds(original, draft).map((id) => this.videosApi.delete(id));
    this.runSave([...createOps, ...updateOps, ...deleteOps], () => {
      const finalIds = draft.map((d) => isTempId(d.id) ? null : d.id).filter((id): id is number => id !== null);
      const reorder = this.shouldReorder(original, draft) && finalIds.length === draft.length ? this.videosApi.reorder(finalIds) : null;
      this.finishSave(reorder, () => this.load(this.section()!));
    });
  }

  private saveBadges(): void {
    const draft = this.badges();
    const original = this.originalBadges;
    const createOps = draft.filter((d) => isTempId(d.id)).map((d) => {
      const dto: CreateComparisonRow = { feature: d.feature, category: d.category, purifrezeText: d.purifrezeText, garrafonesText: d.garrafonesText, isVisible: d.isVisible };
      return this.comparisonApi.create(dto);
    });
    const updateOps = draft.filter((d) => !isTempId(d.id)).map((d) => {
      const orig = original.find((o) => o.id === d.id);
      if (!orig) return null;
      const patch = this.diffPatch<ComparisonBadge, UpdateComparisonRow>(orig, d, ['feature', 'category', 'purifrezeText', 'garrafonesText', 'isVisible']);
      return patch ? this.comparisonApi.update(d.id, patch) : null;
    }).filter((op): op is NonNullable<typeof op> => op !== null);
    const deleteOps = this.deletedIds(original, draft).map((id) => this.comparisonApi.delete(id));
    this.runSave([...createOps, ...updateOps, ...deleteOps], () => {
      const finalIds = draft.map((d) => isTempId(d.id) ? null : d.id).filter((id): id is number => id !== null);
      const reorder = this.shouldReorder(original, draft) && finalIds.length === draft.length ? this.comparisonApi.reorder(finalIds) : null;
      this.finishSave(reorder, () => this.load(this.section()!));
    });
  }

  private saveFaqs(): void {
    const draft = this.faqs();
    const original = this.originalFaqs;
    const createOps = draft.filter((d) => isTempId(d.id)).map((d) => {
      const dto: CreateFaqItem = { question: d.question, answer: d.answer, isVisible: d.isVisible };
      return this.faqApi.create(dto);
    });
    const updateOps = draft.filter((d) => !isTempId(d.id)).map((d) => {
      const orig = original.find((o) => o.id === d.id);
      if (!orig) return null;
      const patch = this.diffPatch<FaqItem, UpdateFaqItem>(orig, d, ['question', 'answer', 'isVisible']);
      return patch ? this.faqApi.update(d.id, patch) : null;
    }).filter((op): op is NonNullable<typeof op> => op !== null);
    const deleteOps = this.deletedIds(original, draft).map((id) => this.faqApi.delete(id));
    this.runSave([...createOps, ...updateOps, ...deleteOps], () => {
      const finalIds = draft.map((d) => isTempId(d.id) ? null : d.id).filter((id): id is number => id !== null);
      const reorder = this.shouldReorder(original, draft) && finalIds.length === draft.length ? this.faqApi.reorder(finalIds) : null;
      this.finishSave(reorder, () => this.load(this.section()!));
    });
  }

  private runSave(ops: Array<{ subscribe: Function }>, then: () => void): void {
    if (!ops.length) { then(); return; }
    forkJoin(ops as any).subscribe({
      next: () => then(),
      error: (error: HttpErrorResponse) => this.failSave(error),
    });
  }

  private finishSave(reorder: any, then: () => void): void {
    const flushMedia = this.flushPendingDelete();
    const tail = reorder ?? flushMedia ?? of(null);
    (tail as any).subscribe({
      next: () => {
        this.saveStatus.set('saved');
        then();
      },
      error: (error: HttpErrorResponse) => this.failSave(error),
    });
  }

  private flushPendingDelete(): any {
    const filenames = this.pendingDelete();
    if (!filenames.length) return null;
    this.pendingDelete.set([]);
    return forkJoin(filenames.map((filename) => this.media.remove(filename).pipe(catchError(() => of({ deleted: false })))));
  }

  private failSave(error: HttpErrorResponse): void {
    this.saveError.set(error.error?.message ?? 'No se pudieron guardar los cambios.');
    this.saveStatus.set('error');
  }

  private markDirty(): void {
    this.saveError.set('');
    this.saveStatus.set('dirty');
  }

  private deletedIds<T extends Identified>(original: T[], draft: T[]): number[] {
    const draftIds = new Set(draft.map((d) => d.id));
    return original.filter((o) => !draftIds.has(o.id)).map((o) => o.id);
  }

  private shouldReorder<T extends Identified>(original: T[], draft: T[]): boolean {
    const origPersisted = original.map((o) => o.id);
    const draftPersisted = draft.filter((d) => !isTempId(d.id)).map((d) => d.id);
    if (origPersisted.length !== draftPersisted.length) return true;
    return origPersisted.some((id, i) => draftPersisted[i] !== id);
  }

  private diffPatch<T extends Identified, P>(original: T, draft: T, fields: (keyof T)[]): P | null {
    const patch: Record<string, unknown> = {};
    let changed = false;
    for (const field of fields) {
      if (original[field] !== draft[field]) {
        patch[field as string] = draft[field];
        changed = true;
      }
    }
    return changed ? (patch as P) : null;
  }
}
