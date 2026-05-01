import { NextResponse } from 'next/server'
import { createCachedChatCompletion } from '@/lib/ai/claude'

type Prospect = {
  name?: string
  email?: string
  phone?: string
  commodity?: string
  country?: string
}

const SALES_SYSTEM_PROMPT =
  'You write PentraCore outbound prospecting copy. Return JSON only: email, whatsapp, sms. Personalise by commodity and country. Be professional, concise, compliant, and never promise pricing, allocation, timing, or guaranteed outcomes.'

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as { email?: string; whatsapp?: string; sms?: string }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { prospect } = (await req.json()) as { prospect?: Prospect }

    if (!prospect?.name && !prospect?.email && !prospect?.phone) {
      return NextResponse.json({ error: 'prospect required' }, { status: 400 })
    }

    const aiText = await createCachedChatCompletion({
      system: SALES_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            name: prospect.name || 'there',
            email: prospect.email || '',
            phone: prospect.phone || '',
            commodity: prospect.commodity || 'minerals',
            country: prospect.country || 'their market',
          }),
        },
      ],
      maxTokens: 550,
    })

    const parsed = extractJson(aiText)

    return NextResponse.json({
      email:
        parsed?.email ||
        `Hi ${prospect.name || 'there'},\n\nPentraCore works with structured commodity trade opportunities. I noticed your focus on ${prospect.commodity || 'minerals'} in ${prospect.country || 'your market'} and would value a brief conversation to understand your current requirements.\n\nRegards,\nPentraCore`,
      whatsapp:
        parsed?.whatsapp ||
        `Hi ${prospect.name || 'there'}, this is PentraCore. Are you currently buying or selling ${prospect.commodity || 'minerals'} in ${prospect.country || 'your market'}?`,
      sms:
        parsed?.sms ||
        `PentraCore: Are you active in ${prospect.commodity || 'minerals'} trade in ${prospect.country || 'your market'}? Reply with buyer/seller and volume.`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sales bot failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
