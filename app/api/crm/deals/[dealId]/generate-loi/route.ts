import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDeanRequest } from '@/lib/server-auth'

type RouteContext = {
  params: {
    dealId: string
  }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)

    const { data: deal, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deals')
      .select('*')
      .eq('id', params.dealId)
      .single()

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const loiText = generateSimpleLOI(deal)

    return NextResponse.json({
      deal_id: deal.id,
      commodity: deal.commodity,
      loi_text: loiText,
      generated_at: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)

    const { data: deal, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deals')
      .select('*')
      .eq('id', params.dealId)
      .single()

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const loiText = generateSimpleLOI(deal)

    return NextResponse.json(
      {
        deal_id: deal.id,
        commodity: deal.commodity,
        loi_text: loiText,
        generated_at: new Date().toISOString()
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

function generateSimpleLOI(deal: any): string {
  const commodity = deal.commodity || '[COMMODITY]'
  const tonnage = deal.tonnage || '[TONNAGE]'
  const pricePerUnit = deal.price_per_unit || '[PRICE]'
  const totalValue = deal.total_value || '[VALUE]'
  const today = new Date().toISOString().split('T')[0]

  return `LETTER OF INTENT

Date: ${today}
Commodity: ${commodity}
Quantity: ${tonnage} tonnes
Price Per Unit: ${pricePerUnit}
Total Value: ${totalValue}

TRANSACTION PROCESS:
1. NCNDA signing
2. KYC verification
3. IMFPA signing
4. SPA execution
5. Payment & Delivery

DEAL REFERENCE: ${deal.id}

This LOI represents an agreement in principle and is subject to execution of binding agreements.`
}
