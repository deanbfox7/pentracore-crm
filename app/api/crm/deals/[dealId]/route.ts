import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDeanRequest } from '@/lib/server-auth'

type RouteContext = {
  params: {
    dealId: string
  }
}

async function fetchDeal(dealId: string) {
  return supabaseAdmin
    .schema('dean_crm')
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single()
}

function generateLOIText(deal: any): string {
  return `LETTER OF INTENT

Buyer ID: ${deal.buyer_id ?? ''}
Seller ID: ${deal.seller_id ?? ''}
Commodity: ${deal.commodity ?? ''}
Tonnage: ${deal.tonnage ?? ''}
Price Per Unit: ${deal.price_per_unit ?? ''}
Total Value: ${deal.total_value ?? ''}
`
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)

    const { data, error } = await fetchDeal(params.dealId)

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message?.includes('Forbidden') ? 403 : 401 })
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)

    const body = await req.json()

    if (body.action !== 'generate_loi') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    const { data: deal, error } = await fetchDeal(params.dealId)

    if (error) throw error

    return NextResponse.json({
      deal_id: deal.id,
      action: 'generate_loi',
      loi_text: generateLOIText(deal),
      generated_at: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message?.includes('Forbidden') ? 403 : 401 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)
    const body = await req.json()

    const updates: Record<string, string | number | boolean | null> = {}

    if (typeof body.verified === 'boolean') {
      updates.verified = body.verified
    }

    if (typeof body.verification_notes === 'string') {
      updates.verification_notes = body.verification_notes
    }

    if (body.probability_percent !== undefined && body.probability_percent !== null) {
      const probPercent = Number(body.probability_percent)
      if (probPercent < 0 || probPercent > 100) {
        return NextResponse.json(
          { error: 'probability_percent must be between 0 and 100' },
          { status: 400 }
        )
      }
      updates.probability_percent = probPercent
    }

    if (typeof body.owner === 'string') {
      updates.owner = body.owner
    }

    if (typeof body.risk_level === 'string') {
      updates.risk_level = body.risk_level
    }

    if (typeof body.current_bottleneck === 'string') {
      updates.current_bottleneck = body.current_bottleneck
    }

    if (typeof body.missing_documents === 'string') {
      updates.missing_documents = body.missing_documents
    }

    if (typeof body.next_action === 'string') {
      updates.next_action = body.next_action
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No supported updates supplied' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deals')
      .update(updates)
      .eq('id', params.dealId)
      .select('*, deal_documents(*)')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message?.includes('Forbidden') ? 403 : 401 })
  }
}
