import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDeanRequest } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  try {
    await verifyDeanRequest(req)

    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyDeanRequest(req)

    const body = await req.json()

    if (!body.deal_name || !body.commodity || !body.tonnage || !body.counterparty_name || !body.counterparty_email) {
      return NextResponse.json(
        { error: 'Deal name, commodity, tonnage, counterparty name, and counterparty email are required' },
        { status: 400 }
      )
    }

    if (body.spa_signed_date && !body.imfpa_signed_date) {
      return NextResponse.json(
        { error: 'SPA cannot be signed before IMFPA' },
        { status: 400 }
      )
    }

    const tonnage = Number(body.tonnage)
    const targetPrice = body.target_price === '' || body.target_price === null ? null : Number(body.target_price)

    if (body.probability_percent !== undefined && body.probability_percent !== null) {
      const probPercent = Number(body.probability_percent)
      if (probPercent < 0 || probPercent > 100) {
        return NextResponse.json(
          { error: 'probability_percent must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    const deal = {
      deal_name: String(body.deal_name),
      commodity: String(body.commodity),
      tonnage,
      origin_country: body.origin_country ? String(body.origin_country) : null,
      target_price: targetPrice,
      price_per_unit: targetPrice,
      total_value: targetPrice === null ? null : tonnage * targetPrice,
      counterparty_name: String(body.counterparty_name),
      counterparty_email: String(body.counterparty_email),
      submitter_name: body.submitter_name ? String(body.submitter_name) : null,
      submitter_email: body.submitter_email ? String(body.submitter_email) : null,
      notes: body.notes ? String(body.notes) : null,
      stage: 'inquiry',
      verified: false,
      verification_notes: null,
      probability_percent: body.probability_percent !== undefined && body.probability_percent !== null ? Number(body.probability_percent) : 0,
      owner: body.owner ? String(body.owner) : null,
      risk_level: body.risk_level ? String(body.risk_level) : 'Medium',
      current_bottleneck: body.current_bottleneck ? String(body.current_bottleneck) : null,
      missing_documents: body.missing_documents ? String(body.missing_documents) : null,
      next_action: body.next_action ? String(body.next_action) : null,
    }

    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deals')
      .insert([deal])
      .select()

    if (error) throw error
    return NextResponse.json(data[0], { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}
