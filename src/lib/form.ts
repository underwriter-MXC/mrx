/**
 * Shared form zod schema. Both `/api/book` and `/api/free-guide` use this.
 * Stage 08 (GHL) extends the form with GHL-specific fields and a contact
 * upsert payload; this file reserves the shape and field-level validation.
 *
 * Sensitive data is explicitly excluded (SSN, DOB, full bank info) per
 * `MRX Compliance Review.md` §9.
 */
import { z } from 'zod';

const OptionalCheckbox = z.literal('on').optional();
const OptionalText = (max: number) => z.string().max(max).optional().or(z.literal(''));

export const GUIDE_SLUG = 'how-to-find-out-what-your-mineral-rights-are';
export const GUIDE_TITLE = 'How to Find Out What Your Mineral Rights Are';
export const GUIDE_DOWNLOAD_PATH = `/guides/${GUIDE_SLUG}.pdf`;
export const GUIDE_DELIVERY_CONSENT_VERSION = '2026-07-20-free-guide-consent-v1';

export const GUIDE_EMAIL_CONSENT_TEXT = `I agree that Mineral Rights Xchange may use my email address to send me the requested guide, "${GUIDE_TITLE}." This transactional email is required to deliver the guide.`;
export const MARKETING_EMAIL_CONSENT_TEXT =
  'Optional: I agree to receive educational and marketing emails from Mineral Rights Xchange about mineral-rights ownership, valuation factors, and review options. I can unsubscribe at any time. This is not required to receive the guide.';
export const SMS_CONSENT_TEXT =
  'Optional: I authorize Mineral Rights Xchange to send recurring marketing and follow-up text messages to the phone number I provide using an autodialer or other automated technology. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not required to receive the guide or buy any goods or services. Carriers are not liable for delayed or undelivered messages.';
export const CALL_CONSENT_TEXT =
  'Optional: I authorize Mineral Rights Xchange to call the phone number I provide with marketing or telemarketing messages using an automatic telephone dialing system and an AI-generated, artificial, or prerecorded voice. Call frequency varies. Consent is not required to receive the guide or buy any goods or services. I can revoke consent by any reasonable method, including asking MRX to stop calling.';

const OptionalNameField = z.string().max(60).optional().or(z.literal(''));
const RequiredNameField = z.string().min(1).max(60);

const PhoneField = z
  .string()
  .max(30)
  .regex(/^[\d\s()+\-.]+$/, 'Phone may contain digits, spaces, parentheses, +, -, .')
  .optional()
  .or(z.literal(''));

export const LeadFormBaseSchema = z.object({
  firstName: OptionalNameField,
  lastName: OptionalNameField,
  email: z.string().email().max(120),
  phone: PhoneField,
  notes: OptionalText(2000),
  // UTMs and referrer are preserved for the GHL contact.
  utm_source: OptionalText(80),
  utm_medium: OptionalText(80),
  utm_campaign: OptionalText(80),
  utm_term: OptionalText(80),
  utm_content: OptionalText(80),
  page_url: OptionalText(500),
  page_title: OptionalText(200),
  // Required only for the requested transaction: email delivery of the guide.
  consent: z.literal('on', {
    errorMap: () => ({ message: 'Consent is required to email the requested guide.' }),
  }),
  requested_guide: z.literal(GUIDE_SLUG).optional().or(z.literal('')),
  guide_title: z.literal(GUIDE_TITLE).optional().or(z.literal('')),
  consent_version: z.literal(GUIDE_DELIVERY_CONSENT_VERSION).optional().or(z.literal('')),
  guide_email_consent_text: OptionalText(1000),
  marketing_email_consent: OptionalCheckbox,
  marketing_email_consent_text: OptionalText(1000),
  sms_consent: OptionalCheckbox,
  sms_consent_text: OptionalText(1400),
  call_consent: OptionalCheckbox,
  call_consent_text: OptionalText(1600),
  consent_timezone_offset: OptionalText(20),
  consent_client_timestamp: OptionalText(80),
});

function requirePhoneForSelectedChannels(
  value: z.infer<typeof LeadFormBaseSchema>,
  ctx: z.RefinementCtx,
) {
  const phone = (value.phone || '').trim();
  if ((value.sms_consent === 'on' || value.call_consent === 'on') && phone.length < 7) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phone'],
      message: 'Phone is required when optional SMS or call consent is selected.',
    });
  }
}

// Booking keeps the original server-side name requirement even if a client
// bypasses the HTML `required` attributes.
export const LeadFormSchema = LeadFormBaseSchema.extend({
  firstName: RequiredNameField,
  lastName: RequiredNameField,
}).superRefine(requirePhoneForSelectedChannels);

// The guide request intentionally requires only email + transactional delivery
// consent. Phone is required only when the owner explicitly selects SMS/calls.
export const FreeGuideLeadFormSchema = LeadFormBaseSchema.superRefine(
  requirePhoneForSelectedChannels,
);

export type LeadForm = z.infer<typeof LeadFormBaseSchema>;

export function normalizeLeadConsent(form: LeadForm) {
  return {
    guideEmail: form.consent === 'on',
    marketingEmail: form.marketing_email_consent === 'on',
    sms: form.sms_consent === 'on',
    call: form.call_consent === 'on',
    version: form.consent_version || GUIDE_DELIVERY_CONSENT_VERSION,
  };
}
