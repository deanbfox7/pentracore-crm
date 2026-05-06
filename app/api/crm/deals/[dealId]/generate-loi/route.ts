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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOCUMENT HEADER

Date:               ${today}
Reference Number:   DEAL-${deal.id}
Prepared by:        PentraCore International
Status:             DRAFT — INTERNAL REVIEW ONLY
Confidentiality:    This document is confidential and proprietary.
                    Not for external distribution without explicit approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARTIES TO THE TRANSACTION

Buyer:      ${buyerName}
Seller:     ${sellerName}
Broker:     PentraCore International

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMODITY & TRANSACTION SUMMARY

This Letter of Intent sets forth the preliminary terms for a transaction
involving the sale and purchase of the commodity specified below. The
parties express interest in moving forward subject to satisfactory
completion of all verification, due diligence, and compliance requirements.

Commodity:          ${commodity}
Quantity:           ${tonnage} MT (Metric Tonnes)
Indicative Price:   ${pricePerUnit}
Estimated Value:    ${totalValue}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INDICATIVE COMMERCIAL TERMS

Price Per Unit:     ${pricePerUnit}
Total Value:        ${totalValue}
Expected Commission:${commission}
Additional Notes:   ${dealNotes}

All pricing is indicative and subject to final verification of commodity
specifications, market conditions, and buyer/seller creditworthiness.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRANSACTION PROCESS & COMPLIANCE STATUS

All transactions follow PentraCore's standardized compliance framework:

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

Note: The IMFPA must be executed before the SPA. The KYC verification
must be complete before IMFPA is signed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS & TIMELINE

Upon mutual agreement to proceed with this LOI:

1. Both parties review and approve this LOI (INTERNAL)
2. Buyer and Seller execute NCNDA (EXTERNAL)
3. KYC verification commences
4. Upon KYC approval, IMFPA is drafted and presented
5. Upon IMFPA execution, SPA is prepared
6. SPA execution and payment/delivery follow

Following internal LOI approval, the next key external milestone is
receipt/review of the Full Corporate Offer (FCO) from the seller,
before SPA preparation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONDITIONS & APPROVALS

This LOI is contingent upon:

✓ Satisfactory completion of due diligence on both buyer and seller
✓ Verification of buyer creditworthiness and funds availability
✓ Verification of seller commodity ownership and ability to deliver
✓ Final confirmation of commodity specifications and quantity
✓ Mutual agreement on all commercial terms
✓ Compliance with applicable trade, customs, and regulatory requirements
✓ Internal approval by PentraCore and both transacting parties

Either party may withdraw from this transaction at any stage prior to
execution of binding legal agreements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONFIDENTIALITY & NON-BINDING DECLARATION

This Letter of Intent is:
  • NOT a binding legal contract
  • An expression of preliminary interest and intent to negotiate
  • Subject to execution of formal binding agreements
  • CONFIDENTIAL — Intended only for the named parties and their advisors

No obligation exists unless and until all parties execute binding agreements
(NCNDA, IMFPA, SPA) as outlined in the Transaction Process section above.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠ HUMAN APPROVAL NOTICE

This is a DRAFT document prepared by the PentraCore system.
This document MUST be manually reviewed and approved before being
shared with any external party (buyer or seller).

DO NOT send this document externally without explicit written approval
from PentraCore management.

Once approved internally, this LOI will serve as the foundation for the
NCNDA execution, which is the formal entry point to the transaction process.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by PentraCore International
${today}`
}

function formatCurrency(value: number): string {
  return `USD ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
