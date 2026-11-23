import { HttpErrorResponse } from '@angular/common/http';

export interface ParsedServerErrors {
  /** Field name → first message. */
  readonly fields: Record<string, string>;
  /** Errors not bound to a known field (e.g. throttling, network). */
  readonly general: string[];
}

const FALLBACK = 'Odoslanie sa nepodarilo. Skúste to prosím znova alebo nás kontaktujte telefonicky.';

function firstMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const msg = firstMessage(item);
      if (msg) {
        return msg;
      }
    }
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const msg = firstMessage(item);
      if (msg) {
        return msg;
      }
    }
  }
  return null;
}

/** Turns a DRF error response into field + general messages. */
export function parseServerErrors(error: unknown, knownFields: readonly string[]): ParsedServerErrors {
  const fields: Record<string, string> = {};
  const general: string[] = [];

  if (!(error instanceof HttpErrorResponse)) {
    return { fields, general: [FALLBACK] };
  }
  if (error.status === 0) {
    return { fields, general: ['Server je momentálne nedostupný. Skontrolujte pripojenie a skúste to znova.'] };
  }
  if (error.status === 429) {
    return { fields, general: ['Odoslali ste priveľa požiadaviek. Počkajte prosím chvíľu a skúste to znova.'] };
  }
  if (error.status !== 400 || !error.error || typeof error.error !== 'object') {
    return { fields, general: [FALLBACK] };
  }

  for (const [key, value] of Object.entries(error.error as Record<string, unknown>)) {
    const message = firstMessage(value);
    if (!message) {
      continue;
    }
    if (knownFields.includes(key)) {
      fields[key] = message;
    } else {
      general.push(message);
    }
  }
  if (!general.length && !Object.keys(fields).length) {
    general.push(FALLBACK);
  }
  return { fields, general };
}
