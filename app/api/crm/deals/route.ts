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
