import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function GET() {
  const supabase = await createServiceClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .is('scored_at', null)
    .limit(20)

  if (!leads?.length) return NextResponse.json({ scored: 0 })

  let scored = 0
  for (const lead of leads) {
    try {
      const prompt = `Score lead 0-100 for purchasing African mineral commodities.
Company: ${lead.company_name}, Industry: ${lead.industry || 'Unknown'}, Country: ${lead.country}, Size: ${lead.company_size || 'Unknown'}, Commodities: ${(lead.commodities_of_interest || []).join(', ') || 'None specified'}
Return JSON: {"score": <0-100>, "reasoning": "<1-2 sentences>"}`

      const openai = getOpenAI()
      if (!openai) continue
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }, max_tokens: 150,
      })
      const result = JSON.parse(response.choices[0].message.content || '{}')
      await supabase.from('leads').update({ lead_score: Math.min(100, Math.max(0, result.score || 0)), score_reasoning: result.reasoning, scored_at: new Date().toISOString() }).eq('id', lead.id)
      scored++
    } catch {}
  }

  return NextResponse.json({ scored })
}
