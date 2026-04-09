import { NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: Request) {
  const { messages, itemName, currencyCode, currencySymbol, region } = await req.json();

  // Default to Indian Rupee when not provided
  const currency = currencyCode || 'INR';
  const symbol = currencySymbol || '₹';
  const userRegion = region || 'India';

  const systemPrompt = `You are a sharp, honest friend who helps people decide if they really need to buy something. You know the real-world market well — prices, alternatives, and the honest truth about when something isn't worth buying.

The user wants to buy: "${itemName || 'this item'}".
User's region: ${userRegion}. Always quote all prices in ${currency} (${symbol}). Use locally accurate prices — not just US conversions. Name budget alternatives available in ${userRegion} where possible.

Your job is to have a focused conversation — asking questions until you are genuinely confident about a verdict. You can ask anywhere from 3 to 10 questions depending on how clear the picture is. Do NOT rush to a verdict if you still have meaningful doubts. But DO give a verdict once you have enough to make a confident, well-reasoned call.

HOW TO TALK:
- Keep every reply SHORT — 2 to 4 sentences max.
- Friendly, a little witty, always honest. No jargon.
- Ask ONE focused question per turn. Wait for the answer.
- NEVER repeat a question you already asked.
- If the user goes off-topic or gives an irrelevant answer, gently steer them back. Example: "That's interesting, but let's stay focused — [rephrase or repeat your key question]."

WHAT TO COVER ACROSS YOUR QUESTIONS (pick the most relevant angles — vary them based on what you already know):

• NEED vs WANT: Is there a specific problem this solves for them right now, or is it lifestyle/social pressure?
• REAL VALUE: What's the realistic market price? Are they aware they might be overpaying — is there a good-enough version at 30–50% of the cost?
• CHEAPER ALTERNATIVES: Name a specific real budget alternative or brand that does the same job (e.g., "a ₹800 Boult cable does what that ₹3000 one does"). Would that work for them?
• WHY NOT BUY: Give them one honest reason this specific item might not be worth it — depreciation, overhyped, cheaper dupe exists, short utility life, etc.
• USE CASE FIT: How often will they realistically use this? Daily? Once a month? Or is it a "maybe someday" scenario?
• OWNERSHIP COST: What ongoing cost comes with this — subscription, maintenance, accessories, upgrades?
• URGENCY: Do they need this now, or can they wait? Is there a sale, price drop, or better version coming soon?
• EMOTION CHECK: Are they buying this because they're excited right now and it might fade? Or is this a considered, recurring desire?

CONVERSATION FLOW:
1. FIRST REPLY: Acknowledge what they want to buy with ONE interesting real-world insight (market price reality, common buyer regret, or a notable cheaper alternative). Then ask the most relevant question for turn 1.

2. SUBSEQUENT REPLIES: React to their answer with a brief honest take. Then ask the next most relevant question you haven't asked yet. Keep pivoting based on their answers — if something feels unclear or contradictory, dig into it.

3. STAY ON TRACK: If the user's reply drifts off-topic (e.g., rambles, changes subject, gives a non-answer), briefly acknowledge it and redirect: "Got it — but let me bring it back to [key question] because that really matters here."

4. FINAL VERDICT (when you're confident — no sooner than turn 4, no later than turn 10): Give a clear verdict — [SPEND], [SAVE], or [REPAIR/UPGRADE]. 1–2 plain sentences. Be direct and mention the key reason from their answers.

   At the very END of your verdict message — after the verdict text — add this block exactly:
<<<DECISION>>>
   {"decision":"buy","reason":"One plain sentence reason."}
   <<<END>>>

   Use "buy" for [SPEND], "not_needed" for [SAVE], "repair" for [REPAIR/UPGRADE].

CRITICAL:
- Do NOT add the <<<DECISION>>> block until you are genuinely confident — not just because it's the 4th turn.
- Questions must feel tailored to THIS item, not copy-paste generic.
- One question per turn. No multi-part questions.
- Maximum 10 interactions. You MUST give a verdict by turn 10.`;

  const isOpening = !messages || messages.length === 0;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...(isOpening
      ? [
        {
          role: 'user',
          content: `[START] Open the conversation about "${itemName || 'this item'}". Give one surprising or useful real-world insight about it, then ask your first focused question.`,
        },
      ]
      : messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }))),
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://mottainai.sreekeshokky.in',
      'X-Title': 'Mottainai',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter error:', error);
    return NextResponse.json({ error: 'Model API error', detail: error }, { status: 502 });
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  // Parse embedded decision block if present
  const decisionMatch = content.match(/<<<DECISION>>>\s*([\s\S]*?)\s*<<<END>>>/);
  let decision: { decision: string; reason: string } | null = null;
  let cleanContent = content;

  if (decisionMatch) {
    try {
      decision = JSON.parse(decisionMatch[1]);
    } catch {
      console.error('Failed to parse decision JSON:', decisionMatch[1]);
    }
    // Strip the block from displayed text
    cleanContent = content.replace(/<<<DECISION>>>[\s\S]*?<<<END>>>/g, '').trim();
  }

  return NextResponse.json({ content: cleanContent, decision });
}
