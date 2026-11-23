import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ToastService } from '../core/services/toast.service';
import { Icon } from '../shared/ui/icon';

@Component({
  selector: 'app-toasts',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      position: fixed;
      z-index: 200;
      right: var(--space-4);
      bottom: var(--space-4);
      left: var(--space-4);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-2);
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      max-width: min(100%, 420px);
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface-3);
      border: 1px solid var(--color-border-strong);
      border-left: 4px solid var(--color-success);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow);
      pointer-events: auto;
      animation: toast-in 220ms var(--ease);
    }
    .toast--error { border-left-color: var(--color-danger); }
    .toast--info { border-left-color: var(--color-info); }
    .toast a { color: var(--color-accent-text); font-weight: 600; white-space: nowrap; }
    .toast button { margin-left: auto; background: none; border: 0; padding: 4px; cursor: pointer; color: var(--color-text-muted); }
    @keyframes toast-in { from { opacity: 0; transform: translateY(8px); } }
  `,
  template: `
    <div class="visually-hidden" role="status" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <span>{{ toast.message }}</span>
      }
    </div>
    @for (toast of toastService.toasts(); track toast.id) {
      <div class="toast" [class]="'toast toast--' + toast.tone">
        <span>{{ toast.message }}</span>
        @if (toast.link; as link) {
          <a [routerLink]="link.url" (click)="toastService.dismiss(toast.id)">{{ link.label }}</a>
        }
        <button type="button" (click)="toastService.dismiss(toast.id)" aria-label="Zavrieť oznámenie">
          <app-icon name="close" />
        </button>
      </div>
    }
  `,
})
export class Toasts {
  protected readonly toastService = inject(ToastService);
}
