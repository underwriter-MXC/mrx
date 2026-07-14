import type { KnowledgeCitation, PersonaSlug } from './types';

const API_URL = 'https://api.openai.com/v1';

export function openAIConfigured() {
  return Boolean(import.meta.env.OPENAI_API_KEY);
}

export async function moderateText(input: string) {
  const key = import.meta.env.OPENAI_API_KEY;
  if (!key) return { flagged: false };
  const response = await fetch(`${API_URL}/moderations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: import.meta.env.OPENAI_MODERATION_MODEL || 'omni-moderation-latest', input }),
  });
  if (!response.ok) return { flagged: false };
  const data = await response.json();
  return { flagged: Boolean(data.results?.[0]?.flagged) };
}

function systemInstructions(
  persona: PersonaSlug,
  citations: KnowledgeCitation[],
  context?: { firstName?: string; location?: string },
) {
  const sources = citations.length
    ? citations.map((source, index) => `[${index + 1}] ${source.title}: ${source.excerpt} (${source.url})`).join('\n')
    : 'No reviewed MRX source matched closely. Do not mention that unless the visitor asks for a source.';

  const ownerContext = [
    context?.firstName ? `The visitor asked to be called ${context.firstName}.` : '',
    context?.location ? `The visitor says the mineral interest is in ${context.location}.` : '',
  ].filter(Boolean).join(' ');

  return `You are ${persona}, a fictional MRX AI Guide on MineralRightsXchange.com. You are not a real employee or a television character.
Give a direct, calm, useful first answer before requesting contact information. The visitor may be frustrated by unsolicited mineral-rights offers.
Talk like a knowledgeable neighbor at a barbecue: warm, plainspoken, and brief. Acknowledge what the visitor said, give one helpful thought, then ask exactly one short follow-up question.
Keep most replies to 1 to 3 short sentences and roughly 35 to 65 words. Do not use headings, numbered steps, bullet lists, jargon, formal intake language, or long lists of facts and documents unless the visitor explicitly asks for detail.
Do not front-load every fact you may eventually need. Ask for one thing at a time and let the conversation unfold naturally. Never pressure the visitor to sell. Never promise a value, price, production result, or transaction outcome.
Never give a certified appraisal, title opinion, or individualized legal or tax guidance. For legal or tax issues, explain general concepts and suggest a qualified professional in the applicable state.
Use only the reviewed MRX sources below for specific mineral-rights factual claims. When a supplied source directly supports the answer, cite only the best source as [1], once. Do not mention articles or sources during a simple conversational intake reply.

Owner context:
${ownerContext || 'No name or mineral location has been shared yet.'}

Reviewed MRX sources:
${sources}`;
}

export async function createOpenAIStream(args: {
  message: string;
  persona: PersonaSlug;
  citations: KnowledgeCitation[];
  context?: { firstName?: string; location?: string };
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  previousResponseId?: string;
}) {
  const key = import.meta.env.OPENAI_API_KEY;
  if (!key) return null;
  const response = await fetch(`${API_URL}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: import.meta.env.OPENAI_CHAT_MODEL || 'gpt-5.6-luna',
      instructions: systemInstructions(args.persona, args.citations, args.context),
      input: [
        ...(args.history ?? []).slice(-8).map((message) => ({
          role: message.role,
          content: [{ type: message.role === 'assistant' ? 'output_text' : 'input_text', text: message.content.slice(0, 4_000) }],
        })),
        { role: 'user', content: [{ type: 'input_text', text: args.message }] },
      ],
      previous_response_id: args.previousResponseId || undefined,
      reasoning: { effort: 'low' },
      stream: true,
      store: false,
    }),
  });
  if (!response.ok || !response.body) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`OpenAI response failed (${response.status}): ${detail}`);
  }
  return response;
}

export function fallbackAnswer(message: string, _persona: PersonaSlug, _citations: KnowledgeCitation[]) {
  const lower = message.toLowerCase();
  if (lower.includes('inherit')) {
    return 'That can feel confusing at first, but we can sort it out one piece at a time. What state and county are the mineral rights in?';
  }
  if (lower.includes('offer')) {
    return 'Absolutely. Before you sign anything, I can help you slow it down and see whether the offer makes sense. What state and county are the mineral rights in?';
  }
  if (lower.includes('royalt') || lower.includes('decline')) {
    return 'We can look at whether those checks are holding steady or starting to fall before you compare them with a sale. About how much was your most recent royalty check?';
  }
  if (lower.includes('worth') || lower.includes('value')) {
    return 'We can narrow that down, but location comes first because nearby mineral interests can still be very different. What state and county are the mineral rights in?';
  }
  if (lower.includes('sell') || lower.includes('selling')) {
    return 'Got it. I can help you figure out whether selling makes sense and what a fair offer might look like. What state and county are the mineral rights in?';
  }
  return 'Sure—I can help you sort it out. What is the one thing you are most worried about right now?';
}
