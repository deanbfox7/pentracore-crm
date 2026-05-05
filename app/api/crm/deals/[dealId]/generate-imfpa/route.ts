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

    const imfpaText = generateProfessionalIMFPA(deal, buyer, seller)

    return NextResponse.json({
      deal_id: deal.id,
      document_type: 'imfpa',
      imfpa_text: imfpaText,
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

    const imfpaText = generateProfessionalIMFPA(deal, buyer, seller)

    const { data: document, error: insertError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .insert({
        deal_id: deal.id,
        document_type: 'imfpa',
        content: imfpaText,
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
        document_type: 'imfpa',
        imfpa_text: imfpaText,
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

function generateProfessionalIMFPA(deal: any, buyer: any, seller: any): string {
  const today = new Date().toISOString().split('T')[0]
  const buyerName = buyer?.name || '[BUYER NAME]'
  const sellerName = seller?.name || '[SELLER NAME]'
  const buyerCountry = buyer?.country || '[BUYER COUNTRY]'
  const sellerCountry = seller?.country || '[SELLER COUNTRY]'
  const commodity = deal.commodity || '[COMMODITY]'
  const pricePerUnit = deal.price_per_unit || 0
  const tonnage = deal.tonnage || 0
  const totalValue = deal.total_value || 0
  const commission = deal.expected_commission || 0

  return `INTERNATIONAL MASTER FRAMEWORK PURCHASE AGREEMENT (IMFPA)

Date: ${today}
Reference Number: IMFPA-DEAL-${deal.id}


PARTIES TO THIS AGREEMENT

This Agreement is entered into by and between:

BUYER:
Name: ${buyerName}
Country: ${buyerCountry}
Address: [BUYER ADDRESS]
Contact Person: [BUYER CONTACT]
Email: [BUYER EMAIL]
Phone: [BUYER PHONE]
("Buyer")

SELLER:
Name: ${sellerName}
Country: ${sellerCountry}
Address: [SELLER ADDRESS]
Contact Person: [SELLER CONTACT]
Email: [SELLER EMAIL]
Phone: [SELLER PHONE]
("Seller")

BROKER/FACILITATOR:
Name: PentraCore International
Country: [BROKER COUNTRY]
Address: [BROKER ADDRESS]
Contact Person: [BROKER CONTACT]
Email: [BROKER EMAIL]
Phone: [BROKER PHONE]
("Broker")

The parties are collectively referred to as "Parties."


1. TRANSACTION OVERVIEW

1.1 Commodity Description
The Buyer and Seller agree to enter into a transaction for the purchase and sale of the following commodity:

Commodity: ${commodity}
Specification/Grade: [SPECIFICATION]
Quantity: ${tonnage} MT (Metric Tonnes)
Unit Price: USD ${pricePerUnit}
Estimated Total Value: USD ${totalValue?.toLocaleString()}

1.2 Transaction Structure
This transaction shall be conducted in accordance with the terms and conditions set forth herein and all supporting documentation, including but not limited to:
- Issued Proforma Invoice (PI)
- Letter of Credit (LC)
- Bills of Lading (B/L)
- Certificates of Analysis
- Insurance documents
- All regulatory and compliance documentation


2. COMMISSION AND FACILITATOR FEES

2.1 Broker Commission
The Buyer and Seller acknowledge and agree that PentraCore International is entitled to a brokerage fee of:

Commission Rate: [COMMISSION PERCENTAGE]%
Commission Amount: USD ${commission?.toLocaleString()}

This commission is payable by [BUYER/SELLER] upon successful completion of the transaction and receipt of payment by the Seller.

2.2 Facilitator/Introducer Fee
Any third-party introducers or facilitators involved in this transaction shall be compensated according to separate written agreements between the Broker and the introducing party. Such compensation shall not exceed [INTRODUCER FEE AMOUNT] and shall not be a direct obligation of the Buyer or Seller without their prior written consent.

2.3 Payment of Fees
All fees and commissions shall be deducted from the gross transaction proceeds or paid separately as agreed by the Parties.


3. NON-CIRCUMVENTION AND PROTECTION

3.1 Non-Circumvention Acknowledgement
The Buyer and Seller acknowledge and agree that they have been introduced to each other solely through the efforts and facilitation of PentraCore International. They further agree not to circumvent, bypass, or deal directly with each other in any transaction relating to this commodity or any similar commodities for a period of TWENTY-FOUR (24) MONTHS from the date of this Agreement, except through PentraCore International as the authorized intermediary.

3.2 Circumvention Liability
Should either party attempt to circumvent this Agreement or conduct direct negotiations without the Broker's involvement, the circumventing party agrees to pay the full brokerage commission and any applicable facilitator fees as if the transaction had been completed through PentraCore International.

3.3 Broker Protection
PentraCore International shall have the right to monitor all communications between the Parties and may require all correspondence to be conducted through the Broker's designated channels to ensure proper facilitation and fee protection.


4. PAYMENT TERMS AND TRIGGERS

4.1 Payment Mechanism
Payment shall be made by irrevocable Letter of Credit (LC) issued by a reputable international bank, unless otherwise agreed in writing.

4.2 Payment Trigger Events
The following events constitute triggers for payment:
a) Issuance of valid Bill of Lading (B/L)
b) Presentation of valid Certificate of Analysis
c) Compliance with all KYC and AML requirements
d) Satisfaction of all insurance and documentation requirements
e) Confirmation of commodity specification and quality

4.3 Payment Timeline
Payment shall be made within [PAYMENT DAYS] days following presentation of compliant shipping documents and satisfaction of all conditions precedent.

4.4 Pre-shipment Inspection
The Seller agrees to provide pre-shipment inspection certificates and the Buyer agrees to pay inspection costs unless otherwise stipulated.


5. CONFIDENTIALITY AND INFORMATION SECURITY

5.1 Confidential Information
All information exchanged between the Parties, including pricing, quantities, identities, financial details, and business terms, is strictly confidential and proprietary.

5.2 Non-Disclosure Obligation
The Parties agree not to disclose any confidential information to third parties without prior written consent, except as required by law or to professional advisors bound by confidentiality obligations.

5.3 Broker Access
The Broker retains full access to all transaction information for facilitation, compliance, and reporting purposes.

5.4 Survival
Confidentiality obligations shall survive termination of this Agreement for a period of THREE (3) YEARS.


6. REPRESENTATIONS AND WARRANTIES

6.1 Buyer Representations
The Buyer represents and warrants:
a) Authority to enter into this Agreement
b) Financial capacity to complete the transaction
c) No sanctions, regulatory, or compliance violations
d) Bonafide end-user status (if applicable)
e) Full disclosure of beneficial ownership

6.2 Seller Representations
The Seller represents and warrants:
a) Authority to enter into this Agreement
b) Right to sell the commodity
c) Compliance with all export regulations
d) Full disclosure of commodity source and custody chain
e) No liens, encumbrances, or third-party claims

6.3 Broker Representations
The Broker represents and warrants:
a) Authority to facilitate this transaction
b) Proper licensing and regulatory compliance
c) Competent and experienced facilitation team


7. GOVERNING LAW AND JURISDICTION

This Agreement shall be governed by and construed in accordance with the laws of [GOVERNING JURISDICTION], without regard to conflicts of law principles.

All disputes arising under this Agreement shall be resolved through:
1. Good faith negotiation (30 days)
2. Mediation under [MEDIATION RULES] (if negotiation fails)
3. Arbitration under [ARBITRATION RULES] (final and binding)

The seat of arbitration shall be [ARBITRATION SEAT].


8. ENTIRE AGREEMENT

This IMFPA, together with all exhibits, schedules, and attachments, constitutes the entire agreement between the Parties regarding the subject matter and supersedes all prior and contemporaneous agreements, whether written or oral.


9. AMENDMENT AND MODIFICATION

No amendment, modification, or waiver of any provision of this Agreement shall be effective unless made in writing and signed by authorized representatives of all Parties.


10. TERMINATION

10.1 Successful Completion
This Agreement shall terminate automatically upon full payment and delivery of the commodity.

10.2 Termination for Cause
Either party may terminate this Agreement upon written notice if:
a) The other party materially breaches its obligations and fails to cure within 15 days
b) The other party becomes insolvent or subject to insolvency proceedings
c) Force majeure renders performance impossible

10.3 Survival
Sections 3 (Non-Circumvention), 5 (Confidentiality), and 7 (Governing Law) shall survive termination.


SIGNATURES

IN WITNESS WHEREOF, the Parties have executed this International Master Framework Purchase Agreement as of the date first written above.

BUYER:

Authorized Signature: _________________________     Date: __________
Name: ${buyerName}
Title: _________________________


SELLER:

Authorized Signature: _________________________     Date: __________
Name: ${sellerName}
Title: _________________________


BROKER/FACILITATOR:

Authorized Signature: _________________________     Date: __________
Name: PentraCore International
Title: Broker/Facilitator
Representative: _________________________


---
Generated by PentraCore International
This document is confidential and intended only for the named parties.
Unauthorized copying or distribution is strictly prohibited.`
}
