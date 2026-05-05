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

    const kycText = generateProfessionalKYC(deal, buyer, seller)

    return NextResponse.json({
      deal_id: deal.id,
      document_type: 'kyc',
      kyc_text: kycText,
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

    const kycText = generateProfessionalKYC(deal, buyer, seller)

    const { data: document, error: insertError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .insert({
        deal_id: deal.id,
        document_type: 'kyc',
        content: kycText,
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
        document_type: 'kyc',
        kyc_text: kycText,
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

function generateProfessionalKYC(deal: any, buyer: any, seller: any): string {
  const today = new Date().toISOString().split('T')[0]
  const buyerName = buyer?.name || '[BUYER NAME]'
  const sellerName = seller?.name || '[SELLER NAME]'
  const buyerCountry = buyer?.country || '[BUYER COUNTRY]'
  const sellerCountry = seller?.country || '[SELLER COUNTRY]'
  const buyerContact = buyer?.contact_person || '[BUYER CONTACT]'
  const sellerContact = seller?.contact_person || '[SELLER CONTACT]'
  const buyerEmail = buyer?.email || '[BUYER EMAIL]'
  const sellerEmail = seller?.email || '[SELLER EMAIL]'
  const commodity = deal.commodity || '[COMMODITY]'

  return `KNOW YOUR CUSTOMER (KYC) VERIFICATION CHECKLIST

Date: ${today}
Reference Number: KYC-DEAL-${deal.id}
Transaction: ${commodity}

--- TRANSACTION DETAILS ---

Deal ID: ${deal.id}
Commodity: ${commodity}
Tonnage: ${deal.tonnage || 'N/A'}
Estimated Value: USD ${deal.total_value?.toLocaleString() || 'N/A'}


--- BUYER PROFILE ---

Company Name: ${buyerName}
Country of Origin: ${buyerCountry}
Contact Person: ${buyerContact}
Email: ${buyerEmail}
Phone: ${buyer?.phone || '[PHONE]'}


--- SELLER PROFILE ---

Company Name: ${sellerName}
Country of Origin: ${sellerCountry}
Contact Person: ${sellerContact}
Email: ${sellerEmail}
Phone: ${seller?.phone || '[PHONE]'}


--- BUYER VERIFICATION CHECKLIST ---

[ ] Company Registration Certificate
    Status: _______________

[ ] Certificate of Good Standing
    Status: _______________

[ ] Articles of Incorporation / Bylaws
    Status: _______________

[ ] Directors & Officers List
    Status: _______________

[ ] Certificate of Authority / Power of Attorney
    Status: _______________

[ ] Government-issued ID - Contact Person
    Status: _______________

[ ] Proof of Business Address
    Status: _______________


--- SELLER VERIFICATION CHECKLIST ---

[ ] Company Registration Certificate
    Status: _______________

[ ] Certificate of Good Standing
    Status: _______________

[ ] Articles of Incorporation / Bylaws
    Status: _______________

[ ] Directors & Officers List
    Status: _______________

[ ] Certificate of Authority / Power of Attorney
    Status: _______________

[ ] Government-issued ID - Contact Person
    Status: _______________

[ ] Proof of Business Address
    Status: _______________


--- BENEFICIAL OWNERSHIP VERIFICATION ---

Buyer - Ultimate Beneficial Owner (UBO):
[ ] Name: ___________________________________
[ ] Ownership %: ____________________________
[ ] Jurisdiction: ____________________________
[ ] Address: ________________________________
[ ] ID Type & Number: _______________________

Seller - Ultimate Beneficial Owner (UBO):
[ ] Name: ___________________________________
[ ] Ownership %: ____________________________
[ ] Jurisdiction: ____________________________
[ ] Address: ________________________________
[ ] ID Type & Number: _______________________


--- ANTI-MONEY LAUNDERING (AML) SCREENING ---

Buyer:
[ ] OFAC Screening - PASS / FAIL
[ ] UN Sanctions List - PASS / FAIL
[ ] EU Sanctions List - PASS / FAIL
[ ] National Sanctions List - PASS / FAIL
[ ] Industry Watchlist - PASS / FAIL
[ ] PEP (Politically Exposed Person) Check - PASS / FAIL

Seller:
[ ] OFAC Screening - PASS / FAIL
[ ] UN Sanctions List - PASS / FAIL
[ ] EU Sanctions List - PASS / FAIL
[ ] National Sanctions List - PASS / FAIL
[ ] Industry Watchlist - PASS / FAIL
[ ] PEP (Politically Exposed Person) Check - PASS / FAIL


--- SOURCE OF FUNDS / WEALTH ---

Buyer Source of Funds:
_____________________________________________________

Seller Source of Wealth:
_____________________________________________________


--- COMPLIANCE SIGN-OFF ---

KYC Reviewer Name: ______________________________

KYC Reviewer Title: _______________________________

Review Date: ____________________________________

Approval Status: [ ] APPROVED  [ ] REJECTED  [ ] PENDING

Comments/Notes:
_____________________________________________________
_____________________________________________________


--- TRANSACTION AUTHORIZATION ---

By signing below, I confirm that all KYC verification has been completed and documented, and that both parties meet PentraCore International's compliance standards for conducting this transaction.


Compliance Officer: _________________________     Date: __________
                PentraCore International


Buyer Representative: _________________________     Date: __________
                    ${buyerName}


Seller Representative: _________________________     Date: __________
                     ${sellerName}


---
Generated by PentraCore International
This document is confidential and intended only for authorized personnel.
Unauthorized distribution is strictly prohibited.`
}
