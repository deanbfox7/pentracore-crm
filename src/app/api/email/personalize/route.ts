import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, template_body, template_subject } = await req.json()

  const { data: lead } = await supabase.from('leads').select('*').eq('id', lead_id).single()
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const prompt = `You are a sales email writer for Pentracore International, a company that sells African mineral commodities (manganese, chrome, iron ore, coal, copper, gold, platinum) globally.

Personalize the following email template for this specific lead. Keep the same core message and CTA but make it feel tailored to them.

Lead context:
- Name: ${lead.first_name} ${lead.last_name}
- Company: ${lead.company_name}
- Industry: ${lead.industry || 'N/A'}
- Country: ${lead.country}
- Company size: ${lead.company_size || 'N/A'}
- Commodities of interest: ${(lead.commodities_of_interest || []).join(', ') || 'general commodities'}

Template subject: ${template_subject}
Template body:
${template_body}

Rules:
- Keep under 200 words
- Professional but warm tone
- Reference their industry or region naturally (1 sentence max)
- Do NOT invent facts about their company
- Return JSON: {"subject": "...", "body": "..."}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 400,
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return NextResponse.json({ subject: result.subject || template_subject, body: result.body || template_body })
}
