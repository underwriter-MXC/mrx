import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { z } from 'zod';
import { routeGuideDecision } from '../../../data/guides';
import { isPublishedPost } from '../../../lib/content-graph';
import { createOpenAIStream, fallbackAnswer, moderateText } from '../../../lib/platform/openai';
import { buildOwnerContext, extractOwnerFacts } from '../../../lib/platform/facts';
import { resolveOwnerSession } from '../../../lib/platform/identity';
import { getSupabaseServer, saveMessage } from '../../../lib/platform/supabase';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  safeError,
} from '../../../lib/platform/security';
import type { ChatRequest, KnowledgeCitation, StreamEvent } from '../../../lib/platform/types';
import { runtimeComplianceCheck, normalizeMrxText } from '../../../lib/platform/style';
import { questionForAnswer, type ConversationTurn } from '../../../lib/platform/conversation';
import { syncVerifiedOwnerToGhl } from '../../../lib/platform/crm';
import {
  documentLocationCardFromInterest,
  persistGeographyResolution,
  publicGeography,
  resolveUSGeography,
  shouldShowKnownLocationCard,
  type GeographyResolution,
  type LocationCard,
} from '../../../lib/platform/geography';
import { documentMemoryForPrompt } from '../../../lib/platform/documents';

const RequestSchema = z.object({
  message: z.string().min(1).max(4_000),
  path: z.string().max(500).optional(),
  conversationId: z.string().max(100).optional(),
  context: z
    .object({
      firstName: z.string().max(80).optional(),
      location: z.string().max(200).optional(),
      currentPersona: z
        .enum(['tommy', 'cooper', 'charlie', 'dale', 'rebecca', 'angela'])
        .optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4_000),
      }),
    )
    .max(8)
    .optional(),
});

function encode(event: StreamEvent) {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

function tokenize(value: string) {
  return new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
}

const strongCitationSignal =
  /\b(offer|buyer|fair|worth|value|valuation|inherit(?:ed|ance)?|royalt(?:y|ies)|production|decline|document|deed|division order|clawback|contract|clause|tax|severance|acre|depth|title)\b/i;

async function persistRuntimeComplianceBlock(args: {
  conversationId: string;
  profileId: string;
  persona: string;
  delivery: 'stream' | 'connection_fallback';
  compliance: ReturnType<typeof runtimeComplianceCheck>;
  originalText: string;
}) {
  await getSupabaseServer()
    ?.from('audit_events')
    .insert({
      profile_id: args.profileId,
      event_type: 'compliance_runtime_block',
      target_type: 'conversation',
      target_id: args.conversationId,
      metadata: {
        source: 'chat.message',
        persona: args.persona,
        delivery: args.delivery,
        match: args.compliance.match,
        rule: args.compliance.source,
        original_excerpt: args.originalText.slice(0, 500),
      },
    });
}

async function findCitations(message: string): Promise<KnowledgeCitation[]> {
  // A casual intake answer should stay conversational. Only surface an article when
  // the visitor has raised a specific topic that a reviewed source can help answer.
  if (!strongCitationSignal.test(message)) return [];
  const terms = tokenize(message);
  const stateNames = [
    'texas',
    'new mexico',
    'oklahoma',
    'north dakota',
    'colorado',
    'wyoming',
    'pennsylvania',
    'west virginia',
    'ohio',
    'louisiana',
  ];
  const mentionedStates = stateNames.filter((state) => message.toLowerCase().includes(state));
  const posts = await getCollection('posts', isPublishedPost);
  return posts
    .filter((post) => {
      const publicSummary =
        `${post.data.title} ${post.data.description} ${post.data.excerpt}`.toLowerCase();
      const contentState = stateNames.find((state) => publicSummary.includes(state));
      return !contentState || mentionedStates.includes(contentState);
    })
    .map((post) => {
      const slug = post.id.replace(/\.mdx?$/, '');
      const haystack =
        `${post.data.title} ${post.data.description} ${post.data.excerpt} ${post.data.category}`.toLowerCase();
      const score = [...terms].reduce(
        (total, term) => total + (haystack.includes(term) ? 1 : 0),
        0,
      );
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
    const parsed = RequestSchema.safeParse((await context.request.json()) as ChatRequest);
    if (!parsed.success) return new Response('Invalid message', { status: 400 });
    const body = parsed.data;
    const message = body.message.trim();

    const moderation = await moderateText(message);
    if (moderation.flagged) {
      return new Response(
        encode({
          type: 'error',
          code: 'message_blocked',
          message:
            'That message could not be processed. Please rephrase it as a mineral-rights question.',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
          },
        },
      );
    }

    const ownerSession = await resolveOwnerSession(context);
    const conversationId = ownerSession.conversationId;
    const userMessageId = await saveMessage({ conversationId, role: 'user', content: message });
    if (userMessageId) {
      await getSupabaseServer()?.from('owner_memory_chunks').insert({
        profile_id: ownerSession.profileId,
        conversation_id: conversationId,
        source_type: 'conversation',
        content: message,
      });
    }
    let ownerContext = await buildOwnerContext(conversationId, ownerSession.profileId, message);
    const persistedHistory = ownerContext.history as ConversationTurn[];
    const historyWithoutCurrent =
      persistedHistory.at(-1)?.role === 'user' &&
      persistedHistory.at(-1)?.content.trim() === message
        ? persistedHistory.slice(0, -1)
        : persistedHistory;
    const history = body.history?.length ? body.history : historyWithoutCurrent;
    const effectiveQuestion = questionForAnswer(message, history);
    ownerContext = {
      ...ownerContext,
      memory: documentMemoryForPrompt(ownerContext.memory as any[], effectiveQuestion),
    };
    const citations = await findCitations(effectiveQuestion);
    const priorInterest = (
      ownerContext.interests as Array<{ state?: string; state_code?: string }>
    )[0];
    let geography: GeographyResolution | null = null;
    let geographyInterestId: string | null = null;
    try {
      geography = await resolveUSGeography(effectiveQuestion, {
        priorState: priorInterest?.state_code || priorInterest?.state,
        mode: 'chat',
      });
      if (geography && geography.status !== 'not_found') {
        const saved = await persistGeographyResolution({
          conversationId,
          profileId: ownerSession.profileId,
          resolution: geography,
          sourceMessageId: userMessageId,
        });
        geographyInterestId = saved.interestId;
        if (saved.persisted) {
          ownerContext = await buildOwnerContext(conversationId, ownerSession.profileId, message);
          ownerContext = {
            ...ownerContext,
            memory: documentMemoryForPrompt(ownerContext.memory as any[], effectiveQuestion),
          };
        }
      }
    } catch (error) {
      console.error(
        '[Owner geography persistence]',
        error instanceof Error ? error.message : 'failed',
      );
    }
    const route = routeGuideDecision(
      effectiveQuestion,
      body.context?.currentPersona ||
        (typeof ownerContext.lastPersona === 'string' ? ownerContext.lastPersona : 'tommy'),
    );
    const persona = route.guide;
    const profile = ownerContext.profile as {
      first_name?: string;
      last_name?: string;
    };
    const rememberedLocation = (ownerContext.interests as Array<Record<string, unknown>>)[0];
    const knownLocationCard = shouldShowKnownLocationCard(effectiveQuestion)
      ? documentLocationCardFromInterest(rememberedLocation as any)
      : null;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = '';
        const locationCards: LocationCard[] = [];
        const send = (event: StreamEvent) => controller.enqueue(encoder.encode(encode(event)));
        try {
          if (route.shouldHandoff && route.handoffMessage) {
            const handoffMessage = normalizeMrxText(route.handoffMessage);
            send({
              type: 'persona.handoff',
              from: route.from.slug as any,
              to: persona.slug as any,
              reason: route.reason ?? persona.shortRole,
              message: handoffMessage,
            });
            await saveMessage({
              conversationId,
              role: 'assistant',
              content: handoffMessage,
              persona: route.from.slug,
              eventType: 'handoff',
              metadata: { from: route.from.slug, to: persona.slug, reason: route.reason },
            });
            await saveMessage({
              conversationId,
              role: 'system',
              content: `${route.from.name} handed the conversation to ${persona.name}.`,
              persona: persona.slug,
              eventType: 'handoff',
              metadata: { from: route.from.slug, to: persona.slug, reason: route.reason },
            });
          }
          if (geography) {
            send({ type: 'geography.resolved', geography: publicGeography(geography) });
          }
          if (knownLocationCard) {
            locationCards.push(knownLocationCard);
            send({ type: 'location.card', card: knownLocationCard });
          }
          citations.forEach((citation) => send({ type: 'citation', citation }));
          const upstream = await createOpenAIStream({
            message: effectiveQuestion,
            persona: persona.slug as any,
            citations,
            context: {
              firstName: profile.first_name,
              location: rememberedLocation
                ? [rememberedLocation.county, rememberedLocation.state]
                    .filter((value): value is string => typeof value === 'string' && Boolean(value))
                    .join(', ')
                : undefined,
              facts: ownerContext.facts,
              interests: ownerContext.interests,
              memory: ownerContext.memory,
              geography,
            },
            history,
          });
          if (!upstream?.body) {
            const answer = fallbackAnswer(
              message,
              persona.slug as any,
              citations,
              geography,
              history,
            );
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
                    send({
                      type: 'message.delta',
                      delta: event.delta,
                      persona: persona.slug as any,
                    });
                  }
                } catch {
                  // Ignore incomplete upstream event lines; the next frame continues the stream.
                }
              }
            }
          }
          fullText = normalizeMrxText(fullText);
          const compliance = runtimeComplianceCheck(fullText);
          if (compliance.flagged) {
            const originalText = fullText;
            fullText = compliance.safeText;
            send({ type: 'message.replace', content: fullText, persona: persona.slug as any });
            await persistRuntimeComplianceBlock({
              conversationId,
              profileId: ownerSession.profileId,
              persona: persona.slug,
              delivery: 'stream',
              compliance,
              originalText,
            });
          }
          await saveMessage({
            conversationId,
            role: 'assistant',
            content: fullText,
            persona: persona.slug,
            citations,
            metadata: locationCards.length ? { locationCards } : undefined,
          });
          try {
            await syncVerifiedOwnerToGhl(ownerSession.profileId);
          } catch (error) {
            console.error(
              '[GHL conversation sync]',
              error instanceof Error ? error.message : 'failed',
            );
          }
          if (userMessageId) {
            try {
              await extractOwnerFacts({
                conversationId,
                profileId: ownerSession.profileId,
                messageId: userMessageId,
                text: message,
                mineralInterestId: geographyInterestId,
              });
            } catch (error) {
              console.error(
                '[Owner fact extraction]',
                error instanceof Error ? error.message : 'failed',
              );
            }
          }
          send({ type: 'done' });
        } catch (error) {
          console.error(
            '[Ask Tommy stream]',
            error instanceof Error ? error.message : 'stream failed',
          );
          // If the model connection fails before it returns any text, keep the
          // conversation useful with the same short, topic-aware local answer used
          // when no model is configured. Visitors should never see infrastructure
          // language or be pushed into booking just because a provider timed out.
          if (!fullText.trim()) {
            fullText = normalizeMrxText(
              fallbackAnswer(message, persona.slug as any, citations, geography, history),
            );
            for (const chunk of fullText.match(/.{1,48}(?:\s|$)/g) ?? [fullText]) {
              send({ type: 'message.delta', delta: chunk, persona: persona.slug as any });
            }
          }
          fullText = normalizeMrxText(fullText);
          const fallbackCompliance = runtimeComplianceCheck(fullText);
          if (fallbackCompliance.flagged) {
            const originalText = fullText;
            fullText = fallbackCompliance.safeText;
            send({ type: 'message.replace', content: fullText, persona: persona.slug as any });
            await persistRuntimeComplianceBlock({
              conversationId,
              profileId: ownerSession.profileId,
              persona: persona.slug,
              delivery: 'connection_fallback',
              compliance: fallbackCompliance,
              originalText,
            });
          }
          await saveMessage({
            conversationId,
            role: 'assistant',
            content: fullText,
            persona: persona.slug,
            citations,
            metadata: {
              delivery: 'connection_fallback',
              ...(locationCards.length ? { locationCards } : {}),
            },
          });
          try {
            await syncVerifiedOwnerToGhl(ownerSession.profileId);
          } catch (syncError) {
            console.error(
              '[GHL fallback conversation sync]',
              syncError instanceof Error ? syncError.message : 'failed',
            );
          }
          send({ type: 'done' });
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
