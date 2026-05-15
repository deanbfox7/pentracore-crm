import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id } = await req.json()

  const { data: lead } = await supabase.from('leads').select('*').eq('id', lead_id).eq('owner_id', user.id).single()
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const prompt = `You are a lead scoring expert for Pentracore International, a company that sells African mineral commodities (manganese, chrome, iron ore, coal, copper, gold, platinum) globally.

Score this lead from 0-100 for likelihood of purchasing African mineral commodities.

Lead data:
- Name: ${lead.first_name} ${lead.last_name}
- Company: ${lead.company_name}
- Industry: ${lead.industry || 'Unknown'}
- Country: ${lead.country}
- Company size: ${lead.company_size || 'Unknown'}
- Commodities of interest: ${(lead.commodities_of_interest || []).join(', ') || 'Not specified'}
- Estimated volume: ${lead.estimated_volume || 'Unknown'}

Scoring criteria (weight each):
- Industry relevance: steel manufacturing, smelting, construction, energy, mining, chemical processing = high (30 pts); trading/brokerage = medium (20 pts); other = low (10 pts)
- Geographic demand: China, India, Japan, South Korea, Europe, Middle East, USA = high (30 pts); Other Asia, South America = medium (20 pts); other = lower (10 pts)
- Company size: enterprise/large = high (20 pts); medium = 15 pts; small = 10 pts
- Commodity specificity: named specific commodities = +20 pts; general interest = +10 pts
- Volume indicator: specified volume = +10 pts bonus

Return ONLY valid JSON: {"score": <number 0-100>, "reasoning": "<2-3 sentence explanation>"}`

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    const score = Math.min(100, Math.max(0, Math.round(result.score || 0)))
    const reasoning = result.reasoning || ''

    await supabase.from('leads').update({ lead_score: score, score_reasoning: reasoning, scored_at: new Date().toISOString() }).eq('id', lead_id)

    return NextResponse.json({ score, reasoning })
  } catch (err) {
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
}
