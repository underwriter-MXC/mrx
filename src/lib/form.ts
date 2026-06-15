/**
 * Shared form zod schema. Both `/api/book` and `/api/free-guide` use this.
 * Stage 08 (GHL) extends the form with GHL-specific fields and a contact
 * upsert payload; this file reserves the shape and field-level validation.
 *
 * Sensitive data is explicitly excluded (SSN, DOB, full bank info) per
 * `MRX Compliance Review.md` §9.
 */
import { z } from 'zod';

export const LeadFormSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email().max(120),
  phone: z
    .string()
    .min(7)
    .max(30)
    .regex(/^[\d\s()+\-.]+$/, 'Phone may contain digits, spaces, parentheses, +, -, .')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  // UTMs and referrer — preserved for the GHL contact.
  utm_source: z.string().max(80).optional().or(z.literal('')),
  utm_medium: z.string().max(80).optional().or(z.literal('')),
  utm_campaign: z.string().max(80).optional().or(z.literal('')),
  utm_term: z.string().max(80).optional().or(z.literal('')),
  utm_content: z.string().max(80).optional().or(z.literal('')),
  page_url: z.string().max(500).optional().or(z.literal('')),
  page_title: z.string().max(200).optional().or(z.literal('')),
  // Free intake consent: required checkbox for §9.
  consent: z.literal('on', {
    errorMap: () => ({ message: 'Consent is required to submit the form.' }),
  }),
});

export type LeadForm = z.infer<typeof LeadFormSchema>;
