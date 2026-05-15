import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { ChatMessage, createCachedChatCompletion } from '@/lib/ai/claude'

const LEAD_QUALIFICATION_PROMPT =
  'You are PentraCore Trade Intelligence, a public lead qualifier. Collect commodity type, volume, country of origin, buyer/seller, and contact info. Ask concise questions. Never promise price, allocation, timing, or guarantees. When complete, append QUALIFIED_JSON with those fields.'

type QualifiedLead = {
  commodity_type?: string
  volume?: string
  country_of_origin?: string
  role?: 'buyer' | 'seller'
  contact_info?: string
}

function parseQualifiedLead(text: string): QualifiedLead | null {
  const match = text.match(/QUALIFIED_JSON\s*:?\s*(\{[\s\S]*\})/i)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[1]) as QualifiedLead
    const complete =
      parsed.commodity_type &&
      parsed.volume &&
      parsed.country_of_origin &&
      parsed.role &&
      parsed.contact_info
    return complete ? parsed : null
  } catch {
    return null
  }
}

function stripQualifiedJson(text: string) {
  return text.replace(/QUALIFIED_JSON\s*:?\s*\{[\s\S]*\}\s*$/i, '').trim()
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as {
      messages?: ChatMessage[]
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const aiText = await createCachedChatCompletion({
      system: LEAD_QUALIFICATION_PROMPT,
      messages,
      maxTokens: 350,
    })

    const qualifiedLead = parseQualifiedLead(aiText)
    const reply = stripQualifiedJson(aiText) || 'Thanks. Please share commodity type, volume, origin country, buyer or seller role, and contact details.'

    if (qualifiedLead) {
      const supabase = await createServiceClient()
      await supabase.from('crm_leads').insert({
        commodity_type: qualifiedLead.commodity_type,
        volume: qualifiedLead.volume,
        country_of_origin: qualifiedLead.country_of_origin,
        role: qualifiedLead.role,
        contact_info: qualifiedLead.contact_info,
        source: 'web_chatbot',
        status: 'new',
        conversation_history: messages,
      })
    }

    return NextResponse.json({ reply, qualified: Boolean(qualifiedLead) })
  } catch (err: unknown) {
    console.error('Lead chat API error:', err)
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Chat failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
