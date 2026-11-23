import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  model,
  viewChild,
} from '@angular/core';

import { MotorcycleImage } from '../../core/api/models';
import { Icon } from './icon';

/**
 * Accessible fullscreen image viewer based on the native <dialog> element
 * (focus trap, Esc to close and inert background come for free).
 * Arrow keys / buttons / swipe switch images.
 */
@Component({
  selector: 'app-lightbox',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './lightbox.scss',
  template: `
    <dialog
      #dialog
      class="lb"
      aria-label="Galéria fotografií"
      (close)="index.set(null)"
      (keydown)="onKey($event)"
      (click)="onBackdrop($event)"
      (touchstart)="touchStart($event)"
      (touchend)="touchEnd($event)"
    >
      @if (current(); as img) {
        <figure class="lb__figure">
          <img [src]="img.image" [alt]="img.alt || title()" />
          <figcaption class="lb__caption num">
            {{ title() }} · {{ (index() ?? 0) + 1 }} / {{ images().length }}
          </figcaption>
        </figure>
      }
      <button type="button" class="lb__btn lb__close" (click)="close()" aria-label="Zavrieť galériu">
        <app-icon name="close" />
      </button>
      @if (images().length > 1) {
        <button type="button" class="lb__btn lb__prev" (click)="step(-1)" aria-label="Predchádzajúca fotografia">
          <app-icon name="chevron-left" />
        </button>
        <button type="button" class="lb__btn lb__next" (click)="step(1)" aria-label="Ďalšia fotografia">
          <app-icon name="chevron" />
        </button>
      }
    </dialog>
  `,
})
export class Lightbox {
  readonly images = input.required<MotorcycleImage[]>();
  readonly title = input('');
  /** Index of the open image, `null` when closed. */
  readonly index = model<number | null>(null);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private touchX: number | null = null;

  protected readonly current = computed(() => {
    const i = this.index();
    return i === null ? null : (this.images()[i] ?? null);
  });

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      const open = this.index() !== null;
      if (open && !el.open) {
        el.showModal();
      } else if (!open && el.open) {
        el.close();
      }
    });
  }

  close(): void {
    this.index.set(null);
  }

  step(delta: number): void {
    const n = this.images().length;
    const i = this.index();
    if (i !== null && n) {
      this.index.set((i + delta + n) % n);
    }
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.step(1);
    } else if (event.key === 'ArrowLeft') {
      this.step(-1);
    }
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  protected touchStart(event: TouchEvent): void {
    this.touchX = event.changedTouches[0]?.clientX ?? null;
  }

  protected touchEnd(event: TouchEvent): void {
    const end = event.changedTouches[0]?.clientX;
    if (this.touchX !== null && end !== undefined && Math.abs(end - this.touchX) > 50) {
      this.step(end < this.touchX ? 1 : -1);
    }
    this.touchX = null;
  }
}
