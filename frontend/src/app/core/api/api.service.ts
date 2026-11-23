import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { SITE_CONFIG } from '../../../site.config';
import {
  ContactMessagePayload,
  InquiryPayload,
  OrderPayload,
  OrderResult,
  ServiceBookingPayload,
  TestRidePayload,
} from './models';

/** Builds an absolute API url from a path such as `motorcycles/`. */
export function apiUrl(path: string): string {
  return `${SITE_CONFIG.apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/** Converts a plain object into HttpParams, skipping empty values. */
export function toHttpParams(params: Record<string, string | number | boolean | null | undefined>): HttpParams {
  let result = new HttpParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      result = result.set(key, String(value));
    }
  }
  return result;
}

/**
 * Write operations. Read operations use `httpResource` directly in the
 * feature components (see `apiUrl`) so they integrate with signals.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  createOrder(payload: OrderPayload): Observable<OrderResult> {
    return this.http.post<OrderResult>(apiUrl('orders/'), payload);
  }

  createServiceBooking(payload: ServiceBookingPayload): Observable<unknown> {
    return this.http.post(apiUrl('service-bookings/'), payload);
  }

  createTestRide(payload: TestRidePayload): Observable<unknown> {
    return this.http.post(apiUrl('test-rides/'), payload);
  }

  createInquiry(payload: InquiryPayload): Observable<unknown> {
    return this.http.post(apiUrl('inquiries/'), payload);
  }

  sendContactMessage(payload: ContactMessagePayload): Observable<unknown> {
    return this.http.post(apiUrl('contact/'), payload);
  }
}
