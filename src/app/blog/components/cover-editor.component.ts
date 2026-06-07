import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const COVER_COLORS = ['#0b3a5e', '#3a2e6e', '#155e4b', '#1e293b'] as const;
const COVER_ICONS = ['droplet', 'snow', 'gauge', 'flask'] as const;

@Component({
  selector: 'app-cover-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="grid gap-4">
      <div class="flex gap-2">
        <button type="button" class="secondary-button" [class.bg-blue-600]="mode() === 'image'" [class.text-white]="mode() === 'image'" (click)="mode.set('image')">Imagen</button>
        <button type="button" class="secondary-button" [class.bg-blue-600]="mode() === 'icon'" [class.text-white]="mode() === 'icon'" (click)="mode.set('icon')">Color + Ícono</button>
      </div>

      @if (mode() === 'image') {
        <label class="field"><span>URL de imagen</span><input [ngModel]="coverImageUrl" (ngModelChange)="coverImageChange.emit($event)" placeholder="/uploads/images/..." /></label>
        <label class="secondary-button w-fit cursor-pointer">
          {{ uploading ? 'Subiendo...' : 'Subir imagen' }}
          <input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" [disabled]="uploading" (change)="uploadChange.emit($event)" />
        </label>
      }

      @if (mode() === 'icon') {
        <div>
          <p class="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">Color de fondo</p>
          <div class="flex gap-2">
            @for (color of colors; track color) {
              <button type="button" class="h-10 w-10 rounded-xl border-2 transition" [class.border-white]="coverColor === color" [class.border-blue-400]="coverColor !== color" [class.ring-2]="coverColor === color" [class.ring-blue-500]="coverColor === color" [class.scale-110]="coverColor === color" [style.backgroundColor]="color" (click)="coverColorChange.emit(color)"></button>
            }
          </div>
        </div>

        <div>
          <p class="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">Ícono</p>
          <div class="flex gap-2">
            @for (icon of icons; track icon) {
              <button type="button" class="grid h-12 w-12 place-items-center rounded-xl border-2 text-xl transition" [class.border-blue-500]="coverIcon === icon" [class.bg-blue-50]="coverIcon === icon" [class.border-blue-200]="coverIcon !== icon" (click)="coverIconChange.emit(icon)">
                <i class="fa-solid fa-{{ icon }}"></i>
              </button>
            }
          </div>
        </div>

        @if (coverColor && coverIcon) {
          <div class="mt-2 overflow-hidden rounded-xl" [style.backgroundColor]="coverColor">
            <div class="flex h-28 items-center justify-center">
              <i class="fa-solid fa-{{ coverIcon }} text-5xl text-white/80"></i>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class CoverEditorComponent {
  @Input({ required: true }) coverImageUrl!: string | null;
  @Input({ required: true }) coverColor!: string | null;
  @Input({ required: true }) coverIcon!: string | null;
  @Input() uploading = false;
  @Output() coverImageChange = new EventEmitter<string | null>();
  @Output() coverColorChange = new EventEmitter<string | null>();
  @Output() coverIconChange = new EventEmitter<string | null>();
  @Output() uploadChange = new EventEmitter<Event>();

  readonly colors = COVER_COLORS;
  readonly icons = COVER_ICONS;

  readonly mode = signal<'image' | 'icon'>('image');

  ngOnInit(): void {
    if (this.coverColor || this.coverIcon) {
      this.mode.set('icon');
    }
  }
}