import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { z } from 'zod';
import { routeGuide } from '../../../data/guides';
import { createOpenAIStream, fallbackAnswer, moderateText } from '../../../lib/platform/openai';
import { saveMessage } from '../../../lib/platform/supabase';
import { assertRateLimit, assertSameOrigin, clientKey, safeError } from '../../../lib/platform/security';
import type { ChatRequest, KnowledgeCitation, StreamEvent } from '../../../lib/platform/types';

const RequestSchema = z.object({
  message: z.string().min(1).max(4_000),
  path: z.string().max(500).optional(),
  conversationId: z.string().max(100).optional(),
  context: z.object({
    firstName: z.string().max(80).optional(),
    location: z.string().max(200).optional(),
  }).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4_000),
  })).max(8).optional(),
});

function encode(event: StreamEvent) {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

function tokenize(value: string) {
  return new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
}

const strongCitationSignal = /\b(offer|buyer|fair|worth|value|valuation|inherit(?:ed|ance)?|royalt(?:y|ies)|production|decline|document|deed|division order|clawback|contract|clause|tax|severance|acre|depth|title)\b/i;

async function findCitations(message: string): Promise<KnowledgeCitation[]> {
  // A casual intake answer should stay conversational. Only surface an article when
  // the visitor has raised a specific topic that a reviewed source can help answer.
  if (!strongCitationSignal.test(message)) return [];
  const terms = tokenize(message);
  const posts = await getCollection('posts', (post) => !post.data.draft);
  return posts
    .map((post) => {
      const slug = post.id.replace(/\.mdx?$/, '');
      const haystack = `${post.data.title} ${post.data.description} ${post.data.excerpt} ${post.data.category}`.toLowerCase();
      const score = [...terms].reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return {
        score,
        citation: {
          id: slug,
          title: post.data.title,
          url: `/blog/${slug}/`,
          excerpt: post.data.excerpt,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, 1)
    .map((item) => item.citation);
}

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`chat:${clientKey(context)}`, 20);
    const parsed = RequestSchema.safeParse(await context.request.json() as ChatRequest);
    if (!parsed.success) return new Response('Invalid message', { status: 400 });
    const body = parsed.data;
    const message = body.message.trim();

    const moderation = await moderateText(message);
    if (moderation.flagged) {
      return new Response(encode({ type: 'error', code: 'message_blocked', message: 'That message could not be processed. Please rephrase it as a mineral-rights question.' }), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform' },
      });
    }

    const persona = routeGuide(message);
    const citations = await findCitations(message);
    const conversationId = context.cookies.get('mrx_conversation')?.value || crypto.randomUUID();
    await saveMessage({ conversationId, role: 'user', content: message });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = '';
        const send = (event: StreamEvent) => controller.enqueue(encoder.encode(encode(event)));
        try {
          if (persona.slug !== 'tommy') {
            send({ type: 'persona.handoff', from: 'tommy', to: persona.slug as any, reason: `${persona.name} focuses on ${persona.shortRole.toLowerCase()}.` });
          }
          citations.forEach((citation) => send({ type: 'citation', citation }));
          const upstream = await createOpenAIStream({
            message,
            persona: persona.slug as any,
            citations,
            context: body.context,
            history: body.history,
          });
          if (!upstream?.body) {
            const answer = fallbackAnswer(message, persona.slug as any, citations);
            fullText = answer;
            for (const chunk of answer.match(/.{1,48}(?:\s|$)/g) ?? [answer]) {
              send({ type: 'message.delta', delta: chunk, persona: persona.slug as any });
            }
          } else {
            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            let pending = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              pending += decoder.decode(value, { stream: true });
              const lines = pending.split('\n');
              pending = lines.pop() ?? '';
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6);
                if (raw === '[DONE]') continue;
                try {
                  const event = JSON.parse(raw);
                  if (event.type === 'response.output_text.delta' && event.delta) {
                    fullText += event.delta;
                    send({ type: 'message.delta', delta: event.delta, persona: persona.slug as any });
                  }
                } catch {
                  // Ignore incomplete upstream event lines; the next frame continues the stream.
                }
              }
            }
          }
          await saveMessage({ conversationId, role: 'assistant', content: fullText, persona: persona.slug, citations });
          send({ type: 'profile.request', fields: ['firstName', 'email'], reason: 'Save this answer and continue later.' });
          send({ type: 'done' });
        } catch (error) {
          console.error('[Ask Tommy stream]', error instanceof Error ? error.message : 'stream failed');
          send({ type: 'error', code: 'answer_failed', message: 'I hit a connection problem. Your question was not lost; please try once more.' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return safeError(error);
  }
};
