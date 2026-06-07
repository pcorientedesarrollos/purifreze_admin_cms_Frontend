import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SaveSeoMetadata } from '../../core/models/seo';

@Component({
  selector: 'app-seo-fields',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="grid gap-4">
      <label class="field">
        <span>Título meta <span class="text-xs font-normal text-blue-950/45">(max 60)</span></span>
        <input [(ngModel)]="seo.metaTitle" (ngModelChange)="emit()" placeholder="Título para buscadores" maxlength="60" />
        <span class="mt-1 text-xs" [class.text-red-600]="(seo.metaTitle || '').length > 60" [class.text-blue-950/45]="(seo.metaTitle || '').length <= 60">{{ (seo.metaTitle || '').length }}/60</span>
      </label>

      <label class="field">
        <span>Descripción meta <span class="text-xs font-normal text-blue-950/45">(max 160)</span></span>
        <textarea rows="3" [(ngModel)]="seo.metaDesc" (ngModelChange)="emit()" placeholder="Resumen para resultados de búsqueda" maxlength="160"></textarea>
        <span class="mt-1 text-xs" [class.text-red-600]="(seo.metaDesc || '').length > 160" [class.text-blue-950/45]="(seo.metaDesc || '').length <= 160">{{ (seo.metaDesc || '').length }}/160</span>
      </label>

      <label class="field">
        <span>Palabras clave</span>
        <input [(ngModel)]="seo.keywords" (ngModelChange)="emit()" placeholder="seo, purifreze, refrigeración, separadas por coma" />
      </label>

      <div class="mt-2 rounded-xl border border-blue-100 bg-white p-4">
        <p class="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">Vista previa Google</p>
        <p class="text-lg leading-snug text-blue-700 hover:underline">{{ seo.metaTitle || 'Título del artículo' }}</p>
        <p class="mt-1 text-sm leading-snug text-green-800">{{ cleanUrl }}</p>
        <p class="mt-1 text-sm leading-snug text-blue-950/60">{{ seo.metaDesc || 'Descripción del artículo en buscadores...' }}</p>
      </div>
    </div>
  `,
})
export class SeoFieldsComponent {
  @Input({ required: true }) seo!: Partial<SaveSeoMetadata>;
  @Output() seoChange = new EventEmitter<Partial<SaveSeoMetadata>>();

  get cleanUrl(): string {
    return 'purifreze.com/blog/...';
  }

  emit(): void {
    this.seoChange.emit({ ...this.seo });
  }
}