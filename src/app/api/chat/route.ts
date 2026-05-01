import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { ChatMessage, createCachedChatCompletion } from '@/lib/ai/claude'

function buildShareholderPrompt(name: string, role: string, deals: string) {
  return `You are PentraCore's private assistant for ${name} (${role}). Portfolio: ${deals || 'no active deal records'}. Answer only about their portfolio and business writing. Enforce NCNDA before SPA, KYC gate, IMFPA before SPA, and never mix buyer/seller data. Refuse unrelated or confidential requests.`
}

export async function POST(req: Request) {
  try {
    const { messages, shareholder_id } = (await req.json()) as {
      messages?: ChatMessage[]
      shareholder_id?: string
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    if (!shareholder_id) {
      return NextResponse.json({ error: 'shareholder_id required' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const { data: shareholder, error: shareholderError } = await supabase
      .from('shareholders')
      .select('id, name, email, role, portfolio_deal_ids')
      .eq('id', shareholder_id)
      .single()

    if (shareholderError || !shareholder) {
      return NextResponse.json({ error: 'Invalid shareholder_id' }, { status: 401 })
    }

    const portfolioDealIds = (shareholder.portfolio_deal_ids || []) as string[]
    const { data: deals } = portfolioDealIds.length
      ? await supabase
          .from('deals')
          .select('id, deal_code, stage, commodity, origin_country, destination_country, volume, uom')
          .in('id', portfolioDealIds)
      : { data: [] }

    const dealSummary = (deals || [])
      .map((deal) => `${deal.deal_code || deal.id}: ${deal.commodity || 'commodity'} ${deal.stage || ''}`)
      .join('; ')

    const reply = await createCachedChatCompletion({
      system: buildShareholderPrompt(shareholder.name, shareholder.role, dealSummary),
      messages,
      maxTokens: 400,
    })

    return NextResponse.json({
      reply: reply || 'I apologize - please try again.',
      shareholder: {
        id: shareholder.id,
        name: shareholder.name,
        portfolio: deals || [],
      },
    })
  } catch (err: unknown) {
    console.error('Chat API error:', err)
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Chat failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
