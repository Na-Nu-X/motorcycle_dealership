import { FieldTree, ValidationError, submit } from '@angular/forms/signals';
import { Observable, firstValueFrom } from 'rxjs';

import { parseServerErrors } from '../../core/utils/server-errors';

/**
 * Submits a signal form to the API.
 *
 * - client-side validation runs first; on failure the first invalid control is focused
 * - DRF 400 errors are mapped back onto the matching fields (`kind: 'server'`)
 * - other errors (429 throttling, network) become root-level errors
 *
 * Resolves to `true` when the request succeeded.
 */
export async function submitToApi<T extends object>(
  form: FieldTree<T>,
  request: (value: T) => Observable<unknown>,
): Promise<boolean> {
  let succeeded = false;
  await submit(form, {
    action: async () => {
      try {
        await firstValueFrom(request(form().value()));
        succeeded = true;
        return undefined;
      } catch (error) {
        const fields = Object.keys(form().value());
        const parsed = parseServerErrors(error, fields);
        const tree = form as unknown as Record<string, FieldTree<unknown>>;
        const errors: ValidationError.WithOptionalFieldTree[] = [
          ...Object.entries(parsed.fields).map(([name, message]) => ({
            kind: 'server',
            message,
            fieldTree: tree[name],
          })),
          ...parsed.general.map((message) => ({ kind: 'server', message })),
        ];
        queueMicrotask(() => focusFirstInvalid(form));
        return errors;
      }
    },
    onInvalid: () => focusFirstInvalid(form),
  });
  return succeeded;
}

export function focusFirstInvalid(form: FieldTree<unknown>): void {
  const first = form().errorSummary().find((e) => e.fieldTree !== form);
  first?.fieldTree().focusBoundControl();
}

/** Root-level (non-field) errors of a form, e.g. throttling or network failures. */
export function rootErrors(form: FieldTree<unknown>): string[] {
  return form()
    .errors()
    .map((e) => e.message ?? '')
    .filter(Boolean);
}
