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

    const buyer = deal.buyer_id ? await fetchCounterparty(deal.buyer_id) : null
    const seller = deal.seller_id ? await fetchCounterparty(deal.seller_id) : null

    const loiText = generateProfessionalLOI(deal, buyer, seller)

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

    const buyer = deal.buyer_id ? await fetchCounterparty(deal.buyer_id) : null
    const seller = deal.seller_id ? await fetchCounterparty(deal.seller_id) : null

    const loiText = generateProfessionalLOI(deal, buyer, seller)

    const { data: document, error: insertError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .insert({
        deal_id: deal.id,
        document_type: 'loi',
        content: loiText,
        status: 'draft',
        generated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to save document: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        deal_id: deal.id,
        document_id: document?.id,
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

async function fetchCounterparty(counterpartyId: number) {
  try {
    const { data } = await supabaseAdmin
      .schema('dean_crm')
      .from('counterparties')
      .select('*')
      .eq('id', counterpartyId)
      .single()
    return data
  } catch {
    return null
  }
}

function generateProfessionalLOI(deal: any, buyer: any, seller: any): string {
  const today = new Date().toISOString().split('T')[0]
  const buyerName = buyer?.name || '[BUYER NAME]'
  const sellerName = seller?.name || '[SELLER NAME]'
  const commodity = deal.commodity || '[COMMODITY]'
  const tonnage = deal.tonnage || '[TONNAGE]'
  const unit = 'MT' // metric tonnes
  const pricePerUnit = deal.price_per_unit ? formatCurrency(deal.price_per_unit) : '[PRICE PER UNIT]'
  const totalValue = deal.total_value ? formatCurrency(deal.total_value) : '[TOTAL VALUE]'

  const formatDate = (dateStr: string | null) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : 'Pending'
  const ncndaStatus = deal.ncnda_signed_date ? `✓ Signed on ${formatDate(deal.ncnda_signed_date)}` : '○ Pending'
  const kycStatus = deal.kyc_approved_date ? `✓ Approved on ${formatDate(deal.kyc_approved_date)}` : '○ Pending'
  const imfpaStatus = deal.imfpa_signed_date ? `✓ Signed on ${formatDate(deal.imfpa_signed_date)}` : '○ Pending'
  const spaStatus = deal.spa_signed_date ? `✓ Signed on ${formatDate(deal.spa_signed_date)}` : '○ Pending'

  const commission = deal.expected_commission ? formatCurrency(deal.expected_commission) : 'To be determined'
  const dealNotes = deal.notes || 'None'

  return `LETTER OF INTENT

Date: ${today}
Reference Number: DEAL-${deal.id}


PARTIES TO THE TRANSACTION

Buyer:   ${buyerName}
Seller:  ${sellerName}
Broker:  PentraCore International


COMMODITY SPECIFICATIONS

Commodity:       ${commodity}
Quantity:        ${tonnage} ${unit}
Price Per Unit:  ${pricePerUnit}
Total Value:     ${totalValue}


TRANSACTION PROCESS AND COMPLIANCE STATUS

The transaction will proceed through the following stages:

1. Non-Circumvention & Non-Disclosure Agreement (NCNDA)
   Status: ${ncndaStatus}

2. Know Your Customer (KYC) Verification
   Status: ${kycStatus}

3. Instrument for Form of Payment Agreement (IMFPA)
   Status: ${imfpaStatus}

4. Sale and Purchase Agreement (SPA)
   Status: ${spaStatus}

5. Payment & Delivery
   Status: ○ Pending


COMMERCIAL TERMS

Expected Commission:  ${commission}
Notes:               ${dealNotes}


DECLARATION

This Letter of Intent represents an expression of interest in principle and outlines the commercial framework for the proposed transaction. Execution of this LOI does not constitute a binding agreement. All terms are subject to:

• Satisfactory completion of due diligence
• Final verification of buyer and seller credentials
• Execution of legally binding agreements (NCNDA, KYC approval, IMFPA, and SPA)
• Compliance with applicable laws and regulations
• Mutual agreement on all final terms and conditions

Each party reserves the right to withdraw from this transaction at any stage prior to execution of binding agreements.


---
Generated by PentraCore International
This document is confidential and intended only for the named parties.`
}

function formatCurrency(value: number): string {
  return `USD ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
