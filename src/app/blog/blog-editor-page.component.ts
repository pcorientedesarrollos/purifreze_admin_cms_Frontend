import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, computed, DestroyRef, ElementRef, inject, OnDestroy, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BlogBlock, BlogPost, SaveBlogPost } from '../core/models/blog';
import { SaveSeoMetadata } from '../core/models/seo';
import { BlogService } from '../core/services/blog.service';
import { MediaService } from '../core/services/media.service';
import { MediaUrlService } from '../core/services/media-url.service';
import { SeoService } from '../core/services/seo.service';
import { CoverEditorComponent } from './components/cover-editor.component';
import { SeoFieldsComponent } from './components/seo-fields.component';

type EditorDraft = SaveBlogPost & { status: BlogPost['status'] | null; slug: string | null; readMin: number | null };

interface SlashItem { type: string; label: string; icon: string; hint: string }

const SLASH_ITEMS: SlashItem[] = [
  { type: 'p', label: 'Texto', icon: 'T', hint: 'Párrafo' },
  { type: 'h2', label: 'Título', icon: 'H2', hint: 'H2' },
  { type: 'h3', label: 'Subtítulo', icon: 'H3', hint: 'H3' },
  { type: 'list', label: 'Lista', icon: '•', hint: 'Viñetas' },
  { type: 'quote', label: 'Cita', icon: '❝', hint: 'Destacar' },
  { type: 'callout', label: 'Resaltado', icon: '!', hint: 'Aviso' },
  { type: 'image', label: 'Imagen', icon: '🖼', hint: 'Portada/foto' },
];

@Component({
  selector: 'app-blog-editor-page',
  imports: [FormsModule, CoverEditorComponent, SeoFieldsComponent],
  styleUrls: ['./blog-editor.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (draft(); as article) {
      <div class="editor">
        <!-- ────── Top bar ────── -->
        <div class="ed-top">
          <button class="ed-btn ghost sm" (click)="goBack()" title="Volver">← Volver</button>
          <span class="crumb">Blog <b>›</b> {{ isNew() ? 'Nuevo artículo' : 'Editar' }}</span>
          @if (article.status) {
            <span class="ed-pill" [class.pub]="article.status === 'PUBLISHED'" [class.draft]="article.status === 'DRAFT'">
              {{ article.status === 'PUBLISHED' ? 'Publicado' : 'Borrador' }}
            </span>
          }
          <span class="ed-status" [class.saving]="saving()">
            <span class="ic">{{ saving() ? '↻' : '✓' }}</span>
            <span>{{ saving() ? 'Guardando…' : 'Guardado' }}</span>
          </span>
          <span class="spacer"></span>
          <button class="ed-btn ghost sm" (click)="toggleInspector()">⚙️ Ajustes</button>
          @if (!isNew()) {
            @if (article.status === 'PUBLISHED') {
              <button class="ed-btn ghost sm" (click)="updateStatus('DRAFT')" title="Volver a borrador">Retirar</button>
            } @else {
              <button class="ed-btn primary sm" (click)="updateStatus('PUBLISHED')" title="Publicar artículo">Publicar</button>
            }
          }
          <button class="ed-btn primary sm" (click)="save()" [disabled]="saving()">Guardar</button>
        </div>

        <!-- ────── Body ────── -->
        <div class="ed-body">
          <div class="scroller" #scroller>
            <div class="doc">
              <!-- Cover -->
              <div #coverSlot></div>

              <!-- Title -->
              <h1 class="doc-title" contenteditable="true" data-empty="Escribe el título…" #titleEl></h1>

              <!-- Excerpt -->
              <div class="doc-ex" contenteditable="true" data-empty="Agrega un extracto o subtítulo…" #excerptEl></div>

              <!-- Blocks -->
              <div class="blocks" #blocksContainer></div>
            </div>
          </div>

          <!-- ────── Inspector drawer ────── -->
          <aside class="inspector" [class.open]="inspectorOpen()">
            <div class="insp-head">
              <b>Ajustes</b>
              <button (click)="inspectorOpen.set(false)" title="Cerrar">✕</button>
            </div>
            <div class="insp-tabs">
              <span class="insp-tab" [class.on]="inspectorTab() === 'general'" (click)="inspectorTab.set('general')">General</span>
              <span class="insp-tab" [class.on]="inspectorTab() === 'seo'" (click)="inspectorTab.set('seo')">SEO</span>
            </div>
            <div class="insp-body">
              @if (inspectorTab() === 'general') {
                <!-- Cover -->
                <div class="insp-field">
                  <div class="insp-flabel">Portada</div>
                  <app-cover-editor
                    [coverImageUrl]="article.coverImageUrl"
                    [coverColor]="article.coverColor"
                    [coverIcon]="article.coverIcon"
                    [uploading]="uploading()"
                    (coverImageChange)="onCoverImageChange($event)"
                    (coverColorChange)="onCoverColorChange($event)"
                    (coverIconChange)="onCoverIconChange($event)"
                    (uploadChange)="upload($event)"
                  />
                </div>

                <!-- Category -->
                <div class="insp-field">
                  <div class="insp-flabel">Categoría</div>
                  <input class="insp-input" [ngModel]="article.category" (ngModelChange)="updateField('category', $event)" placeholder="Ej: Tecnología" />
                </div>

                <!-- Author -->
                <div class="insp-field">
                  <div class="insp-flabel">Autor</div>
                  <input class="insp-input" [ngModel]="article.authorName" (ngModelChange)="updateField('authorName', $event)" placeholder="Nombre del autor" />
                </div>
                <div class="insp-field">
                  <div class="insp-flabel">Iniciales del autor</div>
                  <input class="insp-input" [ngModel]="article.authorInitials" (ngModelChange)="updateField('authorInitials', $event)" placeholder="Ej: JP" maxlength="3" />
                </div>

                @if (!isNew()) {
                  <div class="insp-field">
                    <div class="insp-flabel">Enlace</div>
                    <input class="insp-input" [value]="article.slug ?? ''" readonly style="color:#94a3b8" />
                  </div>
                }
              }

              @if (inspectorTab() === 'seo') {
                @if (seo()) {
                  <app-seo-fields [seo]="seo()!" (seoChange)="onSeoChange($event)" />
                  <div style="margin-top:14px">
                    <button class="ed-btn primary" style="width:100%" [disabled]="savingSeo()" (click)="saveSeo()">
                      {{ savingSeo() ? 'Guardando SEO…' : 'Guardar SEO' }}
                    </button>
                    @if (seoMessage()) {
                      <p style="margin-top:8px;font-size:13px;font-weight:700" [style.color]="seoFailed() ? '#dc2626' : '#16a34a'">{{ seoMessage() }}</p>
                    }
                  </div>
                } @else {
                  <p style="font-size:13px;color:#94a3b8">Guardá el artículo primero para editar SEO.</p>
                }
              }
            </div>
          </aside>
        </div>

        <!-- Toast -->
        <div class="ed-toast" [class.show]="!!toastMsg()">{{ toastMsg() }}</div>
      </div>
    }
  `,
})
export class BlogEditorPageComponent implements AfterViewInit, OnDestroy {
  private readonly api = inject(BlogService);
  private readonly media = inject(MediaService);
  private readonly urls = inject(MediaUrlService);
  private readonly seoApi = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly postId = signal<number | null>(null);
  readonly draft = signal<EditorDraft | null>(null);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly isNew = computed(() => this.postId() === null);
  readonly inspectorOpen = signal(false);
  readonly inspectorTab = signal<'general' | 'seo'>('general');
  readonly toastMsg = signal('');

  // SEO
  readonly seo = signal<Partial<SaveSeoMetadata> | null>(null);
  readonly savingSeo = signal(false);
  readonly seoMessage = signal('');
  readonly seoFailed = signal(false);

  // ViewChild refs
  @ViewChild('titleEl') titleEl!: ElementRef<HTMLHeadingElement>;
  @ViewChild('excerptEl') excerptEl!: ElementRef<HTMLDivElement>;
  @ViewChild('blocksContainer') blocksContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scroller') scroller!: ElementRef<HTMLDivElement>;
  @ViewChild('coverSlot') coverSlot!: ElementRef<HTMLDivElement>;

  private viewReady = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private slashEl: HTMLElement | null = null;
  private slashBlk: HTMLElement | null = null;
  private slashIdx = 0;
  private selToolEl: HTMLElement | null = null;
  private blkMenuEl: HTMLElement | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Bound handlers for proper cleanup (Bug 2)
  private readonly boundUpdateSelTool = () => setTimeout(() => this.updateSelTool(), 1);
  private readonly boundUpdateSelToolKey = () => this.updateSelTool();

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.postId.set(id);
      this.api.find(id).subscribe({
        next: (post) => {
          this.draft.set({
            title: post.title, excerpt: post.excerpt,
            coverImageUrl: post.coverImageUrl, coverColor: post.coverColor ?? null, coverIcon: post.coverIcon ?? null,
            category: post.category ?? null, authorName: post.authorName ?? null, authorInitials: post.authorInitials ?? null,
            blocks: post.blocks, status: post.status, slug: post.slug, readMin: post.readMin ?? null,
          });
          this.loadSeo(id);
          setTimeout(() => this.renderEditor(), 0);
        },
        error: () => this.toast('No se pudo cargar el artículo.'),
      });
    } else {
      this.draft.set({
        title: '', excerpt: '', coverImageUrl: null, coverColor: null, coverIcon: null,
        category: null, authorName: null, authorInitials: null, blocks: [], status: null, slug: null, readMin: null,
      });
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderEditor();
  }

  ngOnDestroy(): void {
    this.closeSlash();
    this.closeSelTool();
    this.closeBlkMenu();
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    // Remove selection toolbar listeners from doc (Bug 2)
    const doc = this.titleEl?.nativeElement.parentElement;
    if (doc) {
      doc.removeEventListener('mouseup', this.boundUpdateSelTool);
      doc.removeEventListener('keyup', this.boundUpdateSelToolKey);
    }
  }

  // ═══════════════════════════════════════════════
  // EDITOR RENDERING
  // ═══════════════════════════════════════════════

  private renderEditor(): void {
    const d = this.draft();
    if (!d || !this.viewReady) return;

    // Title
    const title = this.titleEl.nativeElement;
    title.textContent = d.title;
    this.cleanupEmpty(title);

    // Excerpt
    const excerpt = this.excerptEl.nativeElement;
    excerpt.textContent = d.excerpt;
    this.cleanupEmpty(excerpt);

    // Wire title/excerpt events
    title.oninput = () => {
      d.title = title.textContent ?? '';
      this.cleanupEmpty(title);
      this.scheduleSave();
    };
    title.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); excerpt.focus(); this.placeCaretStart(excerpt); }
    };

    excerpt.oninput = () => {
      d.excerpt = excerpt.textContent ?? '';
      this.cleanupEmpty(excerpt);
      this.scheduleSave();
    };
    excerpt.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.focusFirstBlock(); }
    };

    // Blocks
    this.renderBlocks();

    // Cover
    this.renderCover();

    // Wire block events
    this.wireBlockEvents();

    // Wire selection toolbar
    this.wireSelectionToolbar();
  }

  private renderCover(): void {
    const d = this.draft();
    if (!d) return;
    const slot = this.coverSlot.nativeElement;
    if (d.coverImageUrl) {
      slot.innerHTML = `<div class="ed-cover" style="background-image:url('${this.urls.resolve(d.coverImageUrl)}')">
        <button class="cover-x" title="Quitar portada">✕</button></div>`;
      slot.querySelector('.cover-x')!.addEventListener('click', () => {
        this.updateField('coverImageUrl', null);
        this.renderCover();
        this.scheduleSave();
      });
    } else if (d.coverColor && d.coverIcon) {
      slot.innerHTML = `<div class="ed-cover" style="background-color:${d.coverColor}">
        <div style="position:absolute;inset:0;display:grid;place-items:center;font-size:48px;color:rgba(255,255,255,.8)">
          <i class="fa-solid fa-${d.coverIcon}"></i>
        </div>
        <button class="cover-x" title="Quitar portada">✕</button></div>`;
      slot.querySelector('.cover-x')!.addEventListener('click', () => {
        this.updateField('coverColor', null);
        this.updateField('coverIcon', null);
        this.renderCover();
        this.scheduleSave();
      });
    } else {
      slot.innerHTML = `<div class="ed-cover empty">+ Agregar portada</div>`;
      slot.querySelector('.ed-cover')!.addEventListener('click', () => {
        const palette = ['#0b3a5e', '#3a2e6e', '#155e4b', '#1e293b'];
        const icons = ['droplet', 'snow', 'gauge', 'flask'];
        this.updateField('coverColor', palette[Math.floor(Math.random() * palette.length)]);
        this.updateField('coverIcon', icons[Math.floor(Math.random() * icons.length)]);
        this.updateField('coverImageUrl', null);
        this.renderCover();
        this.scheduleSave();
      });
    }
  }

  // ═══════════════════════════════════════════════
  // BLOCKS
  // ═══════════════════════════════════════════════

  private renderBlocks(): void {
    const container = this.blocksContainer?.nativeElement;
    if (!container) return;
    const d = this.draft();
    if (!d) return;

    container.innerHTML = '';
    const blocks = d.blocks.length > 0 ? d.blocks : [{ id: crypto.randomUUID(), type: 'paragraph' as const, data: { text: '' } }];
    blocks.forEach((b) => container.appendChild(this.createBlockElement(b)));
  }

  private createBlockElement(block: BlogBlock): HTMLElement {
    const blk = document.createElement('div');
    blk.className = 'blk';
    blk.dataset['type'] = this.getBlockDomType(block);
    blk.dataset['blockId'] = block.id;

    // Gutter
    const gutter = document.createElement('div');
    gutter.className = 'gutter';
    gutter.innerHTML = `<button class="gh add" title="Agregar bloque">+</button><button class="gh drag" title="Opciones">⋮⋮</button>`;
    blk.appendChild(gutter);

    // Content
    const content = document.createElement('div');
    content.className = 'blk-content';
    content.contentEditable = 'true';

    if (block.type === 'image') {
      content.contentEditable = 'false';
      const url = block.data.url;
      if (url) {
        content.innerHTML = `<div class="blk-img"><img src="${this.urls.resolve(url)}" alt=""></div>`;
      } else {
        content.innerHTML = `<div class="blk-img placeholder"><div>🖼</div><div>Imagen — marcador</div><div style="font-size:12px;color:#94a3b8;font-weight:500">Arrastrá una imagen o hacé clic para subir</div></div>`;
      }
    } else if (block.type === 'list') {
      const tag = 'ul';
      const items = block.data.items.length > 0 ? block.data.items : [''];
      content.innerHTML = `<${tag}>${items.map(i => `<li>${i}</li>`).join('')}</${tag}>`;
    } else {
      const html = this.getBlockHtml(block);
      content.innerHTML = html;
    }

    // Placeholder for empty blocks
    if (this.isBlockEmpty(content)) {
      content.setAttribute('data-empty', 'Escribe, o pulsá "/" para insertar');
    }

    blk.appendChild(content);
    return blk;
  }

  private getBlockDomType(block: BlogBlock): string {
    if (block.type === 'heading') return block.data.level === 3 ? 'h3' : 'h2';
    if (block.type === 'paragraph') return 'p';
    if (block.type === 'list') return 'list';
    return block.type;
  }

  private getBlockHtml(block: BlogBlock): string {
    switch (block.type) {
      case 'heading': return block.data.text;
      case 'paragraph': return block.data.text;
      case 'quote': return block.data.text;
      case 'callout': return block.data.text;
      case 'link': return `<a href="${block.data.url}">${block.data.text}</a>`;
      default: return '';
    }
  }

  private isBlockEmpty(el: HTMLElement): boolean {
    return el.textContent?.trim() === '' && !el.querySelector('img,li');
  }

  private cleanupEmpty(el: HTMLElement): void {
    if (el.innerHTML === '<br>' || el.textContent === '') el.innerHTML = '';
  }

  // ═══════════════════════════════════════════════
  // EVENT WIRING
  // ═══════════════════════════════════════════════

  private wireBlockEvents(): void {
    const container = this.blocksContainer?.nativeElement;
    if (!container) return;

    container.addEventListener('keydown', (e) => this.onBlockKey(e));
    container.addEventListener('input', () => { this.updateEmptyHints(); this.scheduleSave(); });
    container.addEventListener('click', (e) => this.onBlockClick(e));
    container.addEventListener('focusin', () => this.updateEmptyHints());

    container.addEventListener('dragover', (e) => {
      const ph = (e.target as HTMLElement).closest('.blk-img.placeholder') as HTMLElement | null;
      if (ph) { e.preventDefault(); ph.classList.add('dragover'); }
    });
    container.addEventListener('dragleave', (e) => {
      const ph = (e.target as HTMLElement).closest('.blk-img.placeholder') as HTMLElement | null;
      if (ph) ph.classList.remove('dragover');
    });
    container.addEventListener('drop', (e) => {
      const ph = (e.target as HTMLElement).closest('.blk-img.placeholder') as HTMLElement | null;
      if (!ph) return;
      e.preventDefault();
      ph.classList.remove('dragover');
      const file = e.dataTransfer?.files?.[0];
      const blk = ph.closest('.blk') as HTMLElement | null;
      if (file && blk) this.uploadImageIntoBlock(blk, file);
    });
  }

  private onBlockKey(e: KeyboardEvent): void {
    const content = (e.target as HTMLElement).closest('.blk-content') as HTMLElement | null;
    if (!content) return;
    const blk = content.closest('.blk') as HTMLElement;
    const type = blk.dataset['type'] ?? 'p';

    // Slash menu
    if (e.key === '/' && this.isBlockEmpty(content) && type !== 'list') {
      setTimeout(() => this.openSlash(blk), 0);
      return;
    }
    if (this.slashEl) {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
        this.slashKey(e);
        return;
      }
    }

    // Enter inside list block → split/exit list
    if (e.key === 'Enter' && !e.shiftKey && type === 'list') {
      this.handleListEnter(e, blk, content);
      return;
    }

    // Enter → new block
    if (e.key === 'Enter' && !e.shiftKey && type !== 'list') {
      e.preventDefault();
      const nb = this.createBlockElement({ id: crypto.randomUUID(), type: 'paragraph', data: { text: '' } });
      blk.after(nb);
      const c = nb.querySelector('.blk-content') as HTMLElement;
      c.focus();
      this.placeCaretStart(c);
      this.scheduleSave();
    }

    // Backspace on empty → remove or merge
    if (e.key === 'Backspace' && this.isBlockEmpty(content)) {
      const prev = blk.previousElementSibling as HTMLElement | null;
      if (prev) {
        e.preventDefault();
        const pc = prev.querySelector('.blk-content') as HTMLElement;
        blk.remove();
        if (pc) { pc.focus(); this.placeCaretEnd(pc); }
        this.scheduleSave();
      }
    }
  }

  private handleListEnter(e: KeyboardEvent, blk: HTMLElement, content: HTMLElement): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    let node: Node | null = range.startContainer;
    let li: HTMLLIElement | null = null;
    while (node && node !== content) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'LI') {
        li = node as HTMLLIElement;
        break;
      }
      node = node.parentNode;
    }
    if (!li) return;

    e.preventDefault();

    const isEmpty = (li.textContent ?? '').trim() === '';
    const ul = li.parentElement as HTMLElement;

    if (isEmpty) {
      li.remove();
      if (ul.children.length === 0) {
        ul.remove();
        blk.dataset['type'] = 'p';
        content.innerHTML = '';
      }
      const nb = this.createBlockElement({ id: crypto.randomUUID(), type: 'paragraph', data: { text: '' } });
      blk.after(nb);
      const nc = nb.querySelector('.blk-content') as HTMLElement;
      nc.focus();
      this.placeCaretStart(nc);
      this.scheduleSave();
      return;
    }

    const after = range.cloneRange();
    after.setEndAfter(li.lastChild ?? li);
    const tail = after.extractContents();

    const newLi = document.createElement('li');
    newLi.appendChild(tail);
    li.after(newLi);

    const r = document.createRange();
    r.selectNodeContents(newLi);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);

    this.scheduleSave();
  }

  private onBlockClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // Add block button
    const addBtn = target.closest('.gh.add') as HTMLElement | null;
    if (addBtn) {
      const blk = addBtn.closest('.blk') as HTMLElement;
      const nb = this.createBlockElement({ id: crypto.randomUUID(), type: 'paragraph', data: { text: '' } });
      blk.after(nb);
      const c = nb.querySelector('.blk-content') as HTMLElement;
      c.focus();
      this.placeCaretStart(c);
      this.openSlash(nb);
      this.scheduleSave();
      return;
    }

    // Drag/options button
    const dragBtn = target.closest('.gh.drag') as HTMLElement | null;
    if (dragBtn) {
      const blk = dragBtn.closest('.blk') as HTMLElement;
      this.openBlkMenu(dragBtn, blk);
      return;
    }

    // Image placeholder
    const imgPlaceholder = target.closest('.blk-img.placeholder') as HTMLElement | null;
    if (imgPlaceholder) {
      const blk = imgPlaceholder.closest('.blk') as HTMLElement | null;
      if (blk) this.pickImageForBlock(blk);
    }
  }

  private pickImageForBlock(blk: HTMLElement): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) this.uploadImageIntoBlock(blk, file);
    };
    input.click();
  }

  private uploadImageIntoBlock(blk: HTMLElement, file: File): void {
    const content = blk.querySelector('.blk-content') as HTMLElement;
    if (!content) return;
    const placeholder = content.querySelector('.blk-img.placeholder') as HTMLElement | null;
    if (placeholder) placeholder.classList.add('uploading');

    this.media.uploadImage(file).subscribe({
      next: (image) => {
        content.innerHTML = `<div class="blk-img"><img src="${this.urls.resolve(image.url)}" alt=""></div>`;
        this.scheduleSave();
      },
      error: () => {
        if (placeholder) placeholder.classList.remove('uploading');
        this.toast('No se pudo subir la imagen.');
      },
    });
  }

  // ═══════════════════════════════════════════════
  // SLASH MENU
  // ═══════════════════════════════════════════════

  private openSlash(blk: HTMLElement): void {
    this.closeSlash();
    this.slashBlk = blk;
    this.slashIdx = 0;

    const el = document.createElement('div');
    el.className = 'ed-slash';
    el.innerHTML = `<div class="sh">Insertar bloque</div>` +
      SLASH_ITEMS.map((s, i) =>
        `<div class="ed-slash-item ${i === 0 ? 'sel' : ''}" data-idx="${i}">
          <span class="ib">${s.icon}</span>${s.label}<small>${s.hint}</small>
        </div>`
      ).join('');

    el.querySelectorAll('.ed-slash-item').forEach((item) => {
      (item as HTMLElement).onmousedown = (ev) => {
        ev.preventDefault();
        this.chooseSlash(Number((item as HTMLElement).dataset['idx']));
      };
    });

    document.body.appendChild(el);
    this.slashEl = el;
    this.positionSlash(blk);

    // Close on outside click
    const closeHandler = (ev: MouseEvent) => {
      if (!el.contains(ev.target as Node)) this.closeSlash();
    };
    setTimeout(() => document.addEventListener('mousedown', closeHandler), 0);
  }

  private positionSlash(blk: HTMLElement): void {
    if (!this.slashEl) return;
    const r = blk.getBoundingClientRect();
    let top = r.bottom + 6;
    const left = r.left;
    if (top + 330 > window.innerHeight) top = Math.max(8, r.top - 336);
    this.slashEl.style.top = top + 'px';
    this.slashEl.style.left = left + 'px';
  }

  private slashKey(e: KeyboardEvent): void {
    e.preventDefault();
    const items = this.slashEl?.querySelectorAll('.ed-slash-item');
    if (!items) return;

    if (e.key === 'Escape') { this.closeSlash(); return; }
    if (e.key === 'Enter') { this.chooseSlash(this.slashIdx); return; }
    if (e.key === 'ArrowDown') this.slashIdx = (this.slashIdx + 1) % items.length;
    if (e.key === 'ArrowUp') this.slashIdx = (this.slashIdx - 1 + items.length) % items.length;

    items.forEach((it, i) => it.classList.toggle('sel', i === this.slashIdx));
    items[this.slashIdx]?.scrollIntoView({ block: 'nearest' });
  }

  private chooseSlash(idx: number): void {
    const item = SLASH_ITEMS[idx];
    const blk = this.slashBlk;
    this.closeSlash();
    if (!blk || !item) return;

    const content = blk.querySelector('.blk-content') as HTMLElement;
    if (content && content.textContent === '/') content.innerHTML = '';

    if (item.type === 'image') {
      const nb = this.createBlockElement({ id: crypto.randomUUID(), type: 'image', data: { url: '', alt: '' } });
      if (this.isBlockEmpty(blk)) blk.replaceWith(nb); else blk.after(nb);
      const after = this.createBlockElement({ id: crypto.randomUUID(), type: 'paragraph', data: { text: '' } });
      nb.after(after);
      (after.querySelector('.blk-content') as HTMLElement).focus();
    } else {
      this.convertBlock(blk, item.type);
      const c = blk.querySelector('.blk-content') as HTMLElement;
      if (c) {
        c.focus();
        const caretTarget = item.type === 'list'
          ? ((c.querySelector('li') as HTMLElement | null) ?? c)
          : c;
        this.placeCaretEnd(caretTarget);
      }
    }
    this.scheduleSave();
  }

  private closeSlash(): void {
    if (this.slashEl) { this.slashEl.remove(); this.slashEl = null; this.slashBlk = null; }
  }

  private convertBlock(blk: HTMLElement, type: string): void {
    const old = blk.dataset['type'];
    const content = blk.querySelector('.blk-content') as HTMLElement;
    const text = content?.innerHTML ?? '';
    const id = blk.dataset['blockId'] ?? crypto.randomUUID();

    blk.dataset['type'] = type;

    if (type === 'list') {
      const tag = 'ul';
      content.innerHTML = `<${tag}><li>${this.stripTags(text) || ''}</li></${tag}>`;
    } else if (old === 'list') {
      content.innerHTML = content.textContent ?? '';
    } else if (type === 'image') {
      content.innerHTML = `<div class="blk-img placeholder"><div>🖼</div><div>Imagen — marcador</div></div>`;
      content.contentEditable = 'false';
    }
  }

  // ═══════════════════════════════════════════════
  // BLOCK HANDLE MENU (⋮⋮)
  // ═══════════════════════════════════════════════

  private openBlkMenu(anchor: HTMLElement, blk: HTMLElement): void {
    this.closeBlkMenu();
    blk.classList.add('menuopen');

    const el = document.createElement('div');
    el.className = 'ed-blkmenu';
    el.innerHTML = `
      <div class="ed-blkmenu-item" data-action="up">↑ Subir</div>
      <div class="ed-blkmenu-item" data-action="down">↓ Bajar</div>
      <div class="ed-blkmenu-item" data-action="dup">⎘ Duplicar</div>
      <div class="ed-blkmenu-item danger" data-action="del">✕ Eliminar</div>`;

    const r = anchor.getBoundingClientRect();
    el.style.left = r.left + 'px';
    el.style.top = (r.bottom + 6) + 'px';
    if (r.bottom + 180 > window.innerHeight) el.style.top = (r.top - 186) + 'px';

    el.querySelectorAll('.ed-blkmenu-item').forEach((item) => {
      (item as HTMLElement).onclick = () => {
        const action = (item as HTMLElement).dataset['action'];
        this.closeBlkMenu();
        blk.classList.remove('menuopen');
        this.executeBlkAction(blk, action!);
      };
    });

    document.body.appendChild(el);
    this.blkMenuEl = el;
  }

  private executeBlkAction(blk: HTMLElement, action: string): void {
    if (action === 'up') {
      const prev = blk.previousElementSibling;
      if (prev) blk.parentElement!.insertBefore(blk, prev);
    } else if (action === 'down') {
      const next = blk.nextElementSibling;
      if (next) blk.parentElement!.insertBefore(next, blk);
    } else if (action === 'dup') {
      const blockData = this.domToBlock(blk);
      const clone = this.createBlockElement({ ...blockData, id: crypto.randomUUID() });
      blk.after(clone);
    } else if (action === 'del') {
      if (blk.parentElement!.children.length > 1) blk.remove();
      else { const c = blk.querySelector('.blk-content') as HTMLElement; if (c) c.innerHTML = ''; }
    }
    this.scheduleSave();
  }

  private closeBlkMenu(): void {
    if (this.blkMenuEl) { this.blkMenuEl.remove(); this.blkMenuEl = null; }
  }

  // ═══════════════════════════════════════════════
  // SELECTION TOOLBAR
  // ═══════════════════════════════════════════════

  private wireSelectionToolbar(): void {
    const doc = this.titleEl?.nativeElement.parentElement;
    if (!doc) return;

    // Bug 2: Remove previous listeners before re-adding to prevent accumulation
    doc.removeEventListener('mouseup', this.boundUpdateSelTool);
    doc.removeEventListener('keyup', this.boundUpdateSelToolKey);

    doc.addEventListener('mouseup', this.boundUpdateSelTool);
    doc.addEventListener('keyup', this.boundUpdateSelToolKey);
  }

  private updateSelTool(): void {
    const sel = window.getSelection();
    if (!sel?.rangeCount || sel.isCollapsed) { this.hideSelTool(); return; }

    const range = sel.getRangeAt(0);
    const doc = this.titleEl?.nativeElement.parentElement;
    if (!doc?.contains(range.commonAncestorContainer)) { this.hideSelTool(); return; }
    if (!range.toString().trim()) { this.hideSelTool(); return; }

    const rect = range.getBoundingClientRect();

    if (!this.selToolEl) {
      this.selToolEl = document.createElement('div');
      this.selToolEl.className = 'ed-seltool';
      this.selToolEl.innerHTML = `
        <button data-cmd="bold" style="font-weight:800">B</button>
        <button data-cmd="italic"><i>i</i></button>
        <button data-cmd="underline" style="text-decoration:underline">U</button>
        <span class="sep"></span>
        <button data-type="h2">H2</button>
        <button data-type="h3">H3</button>
        <button data-type="quote">❝</button>
        <button data-cmd="link">🔗</button>`;

      this.selToolEl.querySelectorAll('button').forEach((btn) => {
        (btn as HTMLElement).onmousedown = (ev) => {
          ev.preventDefault();
          const ds = (btn as HTMLElement).dataset!;
          const cmd = ds['cmd'];
          const type = ds['type'];
          if (cmd === 'link') this.doLink();
          else if (cmd) document.execCommand(cmd, false, null as any);
          else if (type) this.convertActive(type);
          this.refreshSelActive();
          this.scheduleSave();
        };
      });
      document.body.appendChild(this.selToolEl);
    }

    this.selToolEl.style.left = (rect.left + rect.width / 2) + 'px';
    this.selToolEl.style.top = (rect.top - 46) + 'px';
    this.selToolEl.style.display = 'inline-flex';
    this.refreshSelActive();
  }

  private refreshSelActive(): void {
    if (!this.selToolEl) return;
    ['bold', 'italic', 'underline'].forEach((cmd) => {
      const btn = this.selToolEl!.querySelector(`[data-cmd="${cmd}"]`);
      if (btn) { let on = false; try { on = document.queryCommandState(cmd); } catch { } btn.classList.toggle('act', on); }
    });
  }

  private hideSelTool(): void {
    if (this.selToolEl) this.selToolEl.style.display = 'none';
  }

  private closeSelTool(): void {
    if (this.selToolEl) { this.selToolEl.remove(); this.selToolEl = null; }
  }

  private convertActive(type: string): void {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    let node = sel.anchorNode as HTMLElement | null;
    const blk = node && (node.nodeType === 1 ? node : node.parentElement)?.closest('.blk') as HTMLElement | null;
    if (blk) {
      this.convertBlock(blk, type);
      const c = blk.querySelector('.blk-content') as HTMLElement;
      if (c) { c.focus(); this.placeCaretEnd(c); }
      this.scheduleSave();
    }
  }

  private doLink(): void {
    const url = prompt('Pegá el enlace (URL):', 'https://');
    if (url) { document.execCommand('createLink', false, url); this.scheduleSave(); }
  }

  // ═══════════════════════════════════════════════
  // SYNC DOM → DATA
  // ═══════════════════════════════════════════════

  private syncDraftToDom(): void {
    // Sync title and excerpt from signals to DOM if needed
    const d = this.draft();
    if (!d || !this.viewReady) return;
    if (this.titleEl && this.titleEl.nativeElement.textContent !== d.title) {
      this.titleEl.nativeElement.textContent = d.title;
    }
    if (this.excerptEl && this.excerptEl.nativeElement.textContent !== d.excerpt) {
      this.excerptEl.nativeElement.textContent = d.excerpt;
    }
  }

  private syncDomToDraft(): EditorDraft | null {
    const d = this.draft();
    if (!d) return null;

    // Title & excerpt
    if (this.titleEl) d.title = this.titleEl.nativeElement.textContent ?? '';
    if (this.excerptEl) d.excerpt = this.excerptEl.nativeElement.textContent ?? '';

    // Blocks
    const container = this.blocksContainer?.nativeElement;
    if (container) {
      const blocks: BlogBlock[] = [];
      container.querySelectorAll(':scope > .blk').forEach((blkEl) => {
        blocks.push(this.domToBlock(blkEl as HTMLElement));
      });
      d.blocks = blocks;
    }

    return { ...d };
  }

  private domToBlock(blk: HTMLElement): BlogBlock {
    const type = blk.dataset['type'] ?? 'p';
    const content = blk.querySelector('.blk-content') as HTMLElement;
    const id = blk.dataset['blockId'] ?? crypto.randomUUID();

    switch (type) {
      case 'p': return { id, type: 'paragraph', data: { text: content?.innerHTML ?? '' } };
      case 'h2': return { id, type: 'heading', data: { text: content?.textContent ?? '', level: 2 } };
      case 'h3': return { id, type: 'heading', data: { text: content?.textContent ?? '', level: 3 } };
      case 'list': {
        const lis = [...(content?.querySelectorAll('li') ?? [])].map(li => li.innerHTML).filter(x => x.trim() !== '');
        const strays = [...(content?.childNodes ?? [])]
          .filter(n => n.nodeName !== 'UL' && n.nodeName !== 'OL')
          .map(n => (n.textContent ?? '').trim())
          .filter(Boolean);
        const items = [...lis, ...strays];
        return { id, type: 'list', data: { items: items.length > 0 ? items : [''] } };
      }
      case 'quote': return { id, type: 'quote', data: { text: content?.innerHTML ?? '' } };
      case 'callout': return { id, type: 'callout', data: { text: content?.innerHTML ?? '' } };
      case 'link': return { id, type: 'link', data: { text: content?.textContent?.trim() ?? '', url: content?.querySelector('a')?.href ?? '' } };
      case 'image': {
        const img = content?.querySelector('img');
        return { id, type: 'image', data: { url: img?.src ?? '', alt: img?.alt ?? '' } };
      }
      default: return { id, type: 'paragraph', data: { text: content?.innerHTML ?? '' } };
    }
  }

  // ═══════════════════════════════════════════════
  // EMPTY HINTS & HELPERS
  // ═══════════════════════════════════════════════

  private updateEmptyHints(): void {
    const container = this.blocksContainer?.nativeElement;
    if (!container) return;
    container.querySelectorAll('.blk').forEach((b) => {
      const c = b.querySelector('.blk-content') as HTMLElement;
      if (!c) return;
      if ((b as HTMLElement).dataset['type'] === 'p' && this.isBlockEmpty(c)) {
        c.setAttribute('data-empty', 'Escribe, o pulsá "/" para insertar');
      } else {
        c.removeAttribute('data-empty');
      }
    });
  }

  private stripTags(html: string): string {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent ?? '';
  }

  private placeCaretEnd(el: HTMLElement): void {
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  }

  private placeCaretStart(el: HTMLElement): void {
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(true);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  }

  private focusFirstBlock(): void {
    const c = this.blocksContainer?.nativeElement?.querySelector('.blk .blk-content[contenteditable]');
    if (c) { (c as HTMLElement).focus(); this.placeCaretStart(c as HTMLElement); }
  }

  // ═══════════════════════════════════════════════
  // AUTO-SAVE
  // ═══════════════════════════════════════════════

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.syncDomToDraft(); // Bug 1: sync blocks from DOM to draft data
    }, 700);
  }

  // ═══════════════════════════════════════════════
  // INSPECTOR
  // ═══════════════════════════════════════════════

  toggleInspector(): void {
    this.inspectorOpen.update(v => !v);
  }

  // ═══════════════════════════════════════════════
  // FIELD UPDATES
  // ═══════════════════════════════════════════════

  updateField(field: string, value: any): void {
    const d = this.draft();
    if (!d) return;
    (d as any)[field] = value;
    this.draft.set({ ...d });
    if (field === 'coverImageUrl' || field === 'coverColor' || field === 'coverIcon') {
      this.renderCover();
    }
  }

  updateStatus(status: string): void {
    this.updateField('status', status);
    if (this.postId() !== null) {
      if (status === 'PUBLISHED') this.publish();
      else this.unpublish();
    }
  }

  // ═══════════════════════════════════════════════
  // COVER
  // ═══════════════════════════════════════════════

  onCoverImageChange(value: string | null): void {
    const d = this.draft();
    if (!d) return;
    this.draft.set({ ...d, coverImageUrl: value, coverColor: null, coverIcon: null });
    this.renderCover();
  }

  onCoverColorChange(value: string | null): void {
    const d = this.draft();
    if (!d) return;
    this.draft.set({ ...d, coverColor: value, coverImageUrl: null });
    this.renderCover();
  }

  onCoverIconChange(value: string | null): void {
    const d = this.draft();
    if (!d) return;
    this.draft.set({ ...d, coverIcon: value });
    this.renderCover();
  }

  upload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const d = this.draft();
    if (!file || !d) return;
    this.uploading.set(true);
    this.media.uploadImage(file).pipe(finalize(() => this.uploading.set(false))).subscribe({
      next: (image) => { this.draft.set({ ...d, coverImageUrl: image.url, coverColor: null, coverIcon: null }); this.renderCover(); },
      error: () => this.toast('No se pudo subir la imagen.'),
    });
  }

  // ═══════════════════════════════════════════════
  // SEO
  // ═══════════════════════════════════════════════

  private loadSeo(postId: number): void {
    this.seoApi.findByEntity('blog', String(postId)).subscribe({
      next: (meta) => this.seo.set(meta ? { entityType: 'blog', entityId: String(postId), metaTitle: meta.metaTitle, metaDesc: meta.metaDesc, keywords: meta.keywords } : { entityType: 'blog', entityId: String(postId), metaTitle: null, metaDesc: null, keywords: null }),
      error: () => this.seo.set({ entityType: 'blog', entityId: String(postId), metaTitle: null, metaDesc: null, keywords: null }),
    });
  }

  onSeoChange(data: Partial<SaveSeoMetadata>): void {
    this.seo.set(data);
  }

  saveSeo(): void {
    const seoData = this.seo();
    const id = this.postId();
    if (!seoData || id === null || this.savingSeo()) return;
    const payload: SaveSeoMetadata = { entityType: 'blog', entityId: String(id), metaTitle: seoData.metaTitle ?? null, metaDesc: seoData.metaDesc ?? null, keywords: seoData.keywords ?? null, ogTitle: seoData.ogTitle ?? null, ogDesc: seoData.ogDesc ?? null, ogImage: seoData.ogImage ?? null, twitterCard: seoData.twitterCard ?? null, canonicalUrl: seoData.canonicalUrl ?? null, noIndex: seoData.noIndex ?? false, noFollow: seoData.noFollow ?? false };
    this.savingSeo.set(true);
    this.seoApi.upsert(payload).pipe(finalize(() => this.savingSeo.set(false))).subscribe({
      next: () => { this.seoMessage.set('SEO guardado.'); this.seoFailed.set(false); },
      error: () => { this.seoMessage.set('No se pudo guardar SEO.'); this.seoFailed.set(true); },
    });
  }

  // ═══════════════════════════════════════════════
  // SAVE / PUBLISH / NAVIGATE
  // ═══════════════════════════════════════════════

  private canSave(): boolean {
    const d = this.draft();
    return !!d && d.title.trim().length > 0 && d.excerpt.trim().length > 0;
  }

  save(): void {
    const draft = this.syncDomToDraft();
    if (!draft || this.saving() || !this.canSave()) return;
    this.saving.set(true);
    const payload: SaveBlogPost = {
      title: draft.title.trim(), excerpt: draft.excerpt.trim(),
      coverImageUrl: draft.coverImageUrl?.trim() || null, coverColor: draft.coverColor ?? null, coverIcon: draft.coverIcon ?? null,
      category: draft.category?.trim() || null, authorName: draft.authorName?.trim() || null, authorInitials: draft.authorInitials?.trim() || null,
      blocks: draft.blocks,
    };
    const id = this.postId();
    const request$ = id === null ? this.api.create(payload) : this.api.update(id, payload);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        const wasNew = id === null;
        this.postId.set(saved.id);
        this.draft.set({
          title: saved.title, excerpt: saved.excerpt, coverImageUrl: saved.coverImageUrl,
          coverColor: saved.coverColor ?? null, coverIcon: saved.coverIcon ?? null,
          category: saved.category ?? null, authorName: saved.authorName ?? null, authorInitials: saved.authorInitials ?? null,
          blocks: saved.blocks, status: saved.status, slug: saved.slug, readMin: saved.readMin ?? null,
        });
        this.toast(wasNew ? 'Artículo creado.' : 'Borrador guardado.');
        if (wasNew) {
          void this.router.navigate(['/blog', saved.id], { replaceUrl: true });
          this.loadSeo(saved.id);
        }
      },
      error: (error: HttpErrorResponse) => this.toast(error.error?.message ?? 'No se pudo guardar.'),
    });
  }

  publish(): void {
    const id = this.postId();
    if (id === null) { this.save(); return; }
    // Bug 4: Save previous status for rollback on error
    const previousStatus = this.draft()?.status;
    this.api.publish(id).subscribe({
      next: (post) => { this.draft.update(d => d ? { ...d, status: post.status } : d); this.toast('Publicado.'); },
      error: () => {
        if (previousStatus) this.draft.update(d => d ? { ...d, status: previousStatus } : d);
        this.toast('No se pudo publicar.');
      },
    });
  }

  unpublish(): void {
    const id = this.postId();
    if (id === null) return;
    // Bug 4: Save previous status for rollback on error
    const previousStatus = this.draft()?.status;
    this.api.unpublish(id).subscribe({
      next: (post) => { this.draft.update(d => d ? { ...d, status: post.status } : d); this.toast('Artículo retirado.'); },
      error: () => {
        if (previousStatus) this.draft.update(d => d ? { ...d, status: previousStatus } : d);
        this.toast('No se pudo retirar.');
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/blog']);
  }

  // ═══════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════

  private toast(msg: string): void {
    this.toastMsg.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), 2400);
  }
}