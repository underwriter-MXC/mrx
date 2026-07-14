/**
 * Hybrid POST route: /api/free-guide
 * Validates form data with zod, submits to GHL, and redirects to
 * /free-guide/thank-you with a one-time download link.
 *
 * Per Architecture Plan §2.4: this is the second of the two hybrid server routes.
 */
import type { APIRoute } from 'astro';
import { LeadFormSchema } from '../../lib/form';
import { submitToGHL } from '../../lib/ghl';

export const GET: APIRoute = async () => new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
  status: 405,
  headers: { 'Content-Type': 'application/json', Allow: 'POST' },
});

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const raw = Object.fromEntries(formData.entries());
  const parsed = LeadFormSchema.safeParse(raw);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'validation_failed',
        issues: parsed.error.flatten().fieldErrors,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const result = await submitToGHL(ctx, parsed.data, 'free-guide');
  if (!result.ok) {
    return new Response(JSON.stringify({ ok: false, error: result.error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Redirect to the in-app thank-you page; the page's <script> pushes
  // the form_submit dataLayer event.
  return ctx.redirect('/free-guide/thank-you', 303);
};
