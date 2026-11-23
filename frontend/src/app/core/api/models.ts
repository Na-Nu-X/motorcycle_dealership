/** Types mirroring the Django REST API. Decimal fields arrive as strings. */

export type MotorcycleCategory = 'adventure' | 'cruiser' | 'sport' | 'naked' | 'scooter';
export type StockStatus = 'in_stock' | 'on_order' | 'in_transit' | 'reserved' | 'sold';
export type LicenseCategory = 'AM' | 'A1' | 'A2' | 'A';
export type AccessoryCategory = 'helmets' | 'jackets' | 'gloves' | 'boots' | 'parts' | 'maintenance';
export type ServiceType = 'maintenance' | 'tires' | 'diagnostics' | 'repair';
export type InquiryType = 'interest' | 'reservation' | 'financing' | 'trade_in';
export type DeliveryMethod = 'pickup' | 'courier';

export interface Paginated<T> {
  readonly count: number;
  readonly next: string | null;
  readonly previous: string | null;
  readonly results: T[];
}

export interface Choice<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

export interface Brand {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly country: string;
  readonly logo: string | null;
  readonly motorcycle_count: number;
}

export interface MotorcycleListItem {
  readonly id: number;
  readonly slug: string;
  readonly brand: string;
  readonly brand_slug: string;
  readonly model: string;
  readonly year: number;
  readonly category: MotorcycleCategory;
  readonly category_label: string;
  readonly engine_cc: number;
  readonly power_hp: string;
  readonly power_kw: string;
  readonly price: string;
  readonly previous_price: string | null;
  readonly mileage_km: number;
  readonly stock_status: StockStatus;
  readonly stock_status_label: string;
  readonly license_category: LicenseCategory;
  readonly short_description: string;
  readonly featured: boolean;
  readonly new_arrival: boolean;
  readonly used: boolean;
  readonly image: string | null;
}

export interface MotorcycleImage {
  readonly id: number;
  readonly image: string;
  readonly alt: string;
}

export interface MotorcycleDetail extends MotorcycleListItem {
  readonly description: string;
  readonly color: string;
  readonly engine_type: string;
  readonly transmission: string;
  readonly transmission_label: string;
  readonly gears: number | null;
  readonly cooling: string;
  readonly cooling_label: string;
  readonly torque_nm: string | null;
  readonly weight_kg: number | null;
  readonly seat_height_mm: number | null;
  readonly fuel_capacity_l: string | null;
  readonly top_speed_kmh: number | null;
  readonly abs: boolean;
  readonly traction_control: boolean;
  readonly riding_modes: boolean;
  readonly quickshifter: boolean;
  readonly cruise_control: boolean;
  readonly extra_specs: Record<string, string>;
  readonly images: MotorcycleImage[];
}

export interface Facets {
  readonly price_min: number | null;
  readonly price_max: number | null;
  readonly cc_min: number | null;
  readonly cc_max: number | null;
  readonly categories: (Choice<MotorcycleCategory> & { count: number })[];
  readonly brands: { slug: string; name: string; count: number }[];
  readonly conditions: { new: number; used: number };
}

export interface Accessory {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly brand: string;
  readonly sku: string | null;
  readonly category: AccessoryCategory;
  readonly category_label: string;
  readonly price: string;
  readonly previous_price: string | null;
  readonly sizes: string[];
  readonly colors: string[];
  readonly stock: number;
  readonly in_stock: boolean;
  readonly short_description: string;
  readonly description: string;
  readonly image: string | null;
  readonly featured: boolean;
}

export interface SiteMeta {
  readonly site_name: string;
  readonly motorcycle_categories: Choice<MotorcycleCategory>[];
  readonly accessory_categories: Choice<AccessoryCategory>[];
  readonly service_types: Choice<ServiceType>[];
  readonly license_categories: Choice<LicenseCategory>[];
  readonly inquiry_types: Choice<InquiryType>[];
  readonly delivery_methods: Choice<DeliveryMethod>[];
  readonly shipping: { courier_price: string; free_from: string };
  readonly workshop: { open_hour: number; close_hour: number; saturday_close_hour: number; max_days_ahead: number };
}

export interface Slot {
  readonly time: string;
  readonly available: boolean;
}

export interface Availability {
  readonly date: string;
  readonly slots: Slot[];
}

// ---- Request payloads ------------------------------------------------------

export interface ContactFields {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gdpr_consent: boolean;
  /** honeypot – must stay empty */
  website: string;
}

export interface ServiceBookingPayload extends ContactFields {
  motorcycle_model: string;
  motorcycle_year: number | null;
  mileage_km: number | null;
  license_plate: string;
  service_type: ServiceType | '';
  preferred_date: string;
  preferred_time: string;
  note: string;
}

export interface TestRidePayload extends ContactFields {
  motorcycle: string;
  preferred_date: string;
  preferred_time: string;
  license_category: LicenseCategory | '';
  license_confirmed: boolean;
  riding_experience_years: number;
  note: string;
}

export interface InquiryPayload extends ContactFields {
  motorcycle: string;
  inquiry_type: InquiryType;
  message: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  gdpr_consent: boolean;
  website: string;
}

export interface OrderPayload extends ContactFields {
  delivery_method: DeliveryMethod;
  street: string;
  city: string;
  postal_code: string;
  note: string;
  items: { accessory: number; quantity: number; size: string; color: string }[];
  motorcycles: string[];
}

export interface OrderResult {
  readonly number: string;
  readonly total: string;
  readonly shipping_price: string;
  readonly reserved_motorcycles: string[];
}
