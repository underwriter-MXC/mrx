/**
 * Analytics dataLayer helpers. Typed event names. Stage 06 wires
 * `form_submit` from the redirect pages; stage 08 (GHL) wires
 * `appointment_booked` from the GTM-side postMessage listener.
 *
 * Per `SEO AEO Sitemap Schema Plan.md` §6.2.
 */
import type { PageType } from './site';

export type DataLayerEvent =
  | { event: 'gtm.js'; mrx_page_type: PageType; mrx_page_category?: string }
  | { event: 'page_view'; mrx_page_type: PageType; mrx_page_category?: string }
  | { event: 'view_faq_block'; mrx_faq_id: string }
  | { event: 'view_cta_hero'; mrx_cta_name: string }
  | { event: 'cta_click'; mrx_cta_name: string; mrx_href: string }
  | { event: 'form_submit'; mrx_form: 'book' | 'free-guide' }
  | { event: 'booking_opened'; source?: string }
  | { event: 'slot_displayed'; option_count: number; timezone?: string }
  | { event: 'appointment_booked'; mrx_calendar_event_id?: string }
  | { event: 'intake_started'; source?: string }
  | { event: 'intake_completed'; mineral_interest_id?: string }
  | { event: 'document_received'; document_type?: string; status?: string }
  | { event: 'case_ready'; profile_id?: string }
  | { event: 'appointment_held'; mrx_calendar_event_id?: string };

declare global {
  interface Window {
    dataLayer: object[];
  }
}

export function pushEvent(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export function initDataLayer(pageType: PageType, pageCategory?: string): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
    mrx_page_type: pageType,
    mrx_page_category: pageCategory,
  });
}
