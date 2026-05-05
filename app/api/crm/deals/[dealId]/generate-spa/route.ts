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

    const spaText = generateProfessionalSPA(deal, buyer, seller)

    return NextResponse.json({
      deal_id: deal.id,
      document_type: 'spa',
      spa_text: spaText,
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

    const spaText = generateProfessionalSPA(deal, buyer, seller)

    const { data: document, error: insertError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .insert({
        deal_id: deal.id,
        document_type: 'spa',
        content: spaText,
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
        document_type: 'spa',
        spa_text: spaText,
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

function generateProfessionalSPA(deal: any, buyer: any, seller: any): string {
  const today = new Date().toISOString().split('T')[0]
  const buyerName = buyer?.name || '[BUYER NAME]'
  const sellerName = seller?.name || '[SELLER NAME]'
  const buyerCountry = buyer?.country || '[BUYER COUNTRY]'
  const sellerCountry = seller?.country || '[SELLER COUNTRY]'
  const commodity = deal.commodity || '[COMMODITY]'
  const specification = '[SPECIFICATION/GRADE]'
  const pricePerUnit = deal.price_per_unit || 0
  const tonnage = deal.tonnage || 0
  const totalValue = deal.total_value || 0

  return `SALES AND PURCHASE AGREEMENT (SPA)

Date: ${today}
Reference Number: SPA-DEAL-${deal.id}


PARTIES

This Agreement is entered into by and between:

BUYER:
Legal Name: ${buyerName}
Country: ${buyerCountry}
Address: [BUYER ADDRESS]
Contact: [BUYER CONTACT PERSON]
Email: [BUYER EMAIL]
Phone: [BUYER PHONE]
("Buyer")

and

SELLER:
Legal Name: ${sellerName}
Country: ${sellerCountry}
Address: [SELLER ADDRESS]
Contact: [SELLER CONTACT PERSON]
Email: [SELLER EMAIL]
Phone: [SELLER PHONE]
("Seller")

Collectively referred to as "Parties" and individually as "Party."


1. COMMODITY AND SPECIFICATIONS

1.1 Commodity Description
The Seller agrees to sell and the Buyer agrees to purchase the following commodity:

Commodity: ${commodity}
Specification/Grade: ${specification}
Quantity: ${tonnage} Metric Tonnes (MT)
Unit Price: USD ${pricePerUnit} per MT
Total Contract Value: USD ${totalValue?.toLocaleString()}

1.2 Quality Standards
The commodity shall conform to the specification set forth herein and shall be of merchantable quality, free from defects, and suitable for the intended purpose.

1.3 Inspection Certificate
A pre-shipment inspection certificate from an internationally recognized inspection body shall be provided by the Seller before shipment.


2. DELIVERY TERMS

2.1 Delivery Point
Delivery shall be made on an [FOB/CIF/CIP] basis at [DELIVERY PORT/LOCATION] or as mutually agreed by the Parties in writing.

2.2 Delivery Schedule
The commodity shall be delivered within [DELIVERY DAYS] days from the date of this Agreement, subject to force majeure events.

2.3 Shipping Documentation
The Seller shall provide:
a) Bill of Lading (B/L) or equivalent shipping document
b) Commercial Invoice
c) Packing List
d) Certificate of Origin
e) Pre-shipment Inspection Certificate
f) Insurance Certificate (if required)
g) All regulatory and compliance documentation

2.4 Risk Transfer
Risk of loss or damage to the commodity shall pass to the Buyer upon shipment (FOB terms) or upon delivery at destination (CIF/CIP terms).


3. PAYMENT TERMS

3.1 Payment Method
Payment shall be made by irrevocable Letter of Credit (LC) issued by a reputable international bank, or by wire transfer as mutually agreed.

3.2 Payment Triggers
Payment shall be made within [PAYMENT DAYS] days upon presentation of the following compliant documents:
a) Original or telex release of Bill of Lading
b) Commercial Invoice
c) Pre-shipment Inspection Certificate
d) Certificate of Analysis (where applicable)
e) Certificate of Origin
f) Any other documents specified in the LC

3.3 LC Specifications
The LC shall be:
- Irrevocable and confirmed by a bank acceptable to the Seller
- Issued in favor of the Seller
- Valid for presentation until [DATE]
- Negotiable at sight or on acceptance basis as agreed
- Free of restrictive conditions that impede payment

3.4 Price and Payment Adjustments
The unit price is fixed and not subject to adjustment unless the Parties mutually agree in writing.


4. INSPECTION AND QUALITY VERIFICATION

4.1 Pre-Shipment Inspection
The Seller shall permit the Buyer (or the Buyer's appointed inspector) to conduct pre-shipment inspection at [INSPECTION LOCATION].

4.2 Inspection Results
Should the pre-shipment inspection reveal non-conformity with specifications:
a) The Seller shall have [CURE DAYS] days to cure the defect
b) If not cured, the Buyer may reject the entire shipment
c) The cost of reinspection shall be borne by the Seller

4.3 Acceptance Testing
Upon delivery, the Buyer shall have [ACCEPTANCE DAYS] days to conduct acceptance testing. Results shall be deemed final unless disputed within [DISPUTE DAYS] days.

4.4 Documentation of Quality
All testing and inspection results shall be documented and provided to both Parties within [REPORT DAYS] days of completion.


5. WARRANTIES AND REPRESENTATIONS

5.1 Seller's Warranties
The Seller represents and warrants that:
a) The commodity is genuine, new, and of the quality and specification described
b) The Seller has full title to the commodity and right to sell
c) The commodity is free from all liens, encumbrances, and third-party claims
d) The commodity complies with all applicable laws and regulations
e) All necessary export licenses and permits have been obtained
f) The Seller has disclosed all material facts regarding the commodity

5.2 Buyer's Representations
The Buyer represents and warrants that:
a) The Buyer has authority to enter into this Agreement
b) The Buyer has financial capacity to pay the contract price
c) The Buyer is not subject to sanctions or export restrictions
d) The Buyer has obtained all necessary import licenses and permits
e) The commodity will be used in accordance with all applicable laws

5.3 Warranty Period
Warranty obligations shall survive for [WARRANTY PERIOD] days from the date of delivery.


6. DOCUMENTS REQUIRED FOR PAYMENT

The Seller shall provide the following documents for payment:

[ ] Original or telex release Bill of Lading
[ ] Commercial Invoice (in triplicate)
[ ] Packing List
[ ] Pre-shipment Inspection Certificate
[ ] Certificate of Analysis / Test Report
[ ] Certificate of Origin
[ ] Insurance Certificate (if applicable)
[ ] Import/Export Documentation
[ ] Any other document specified in the LC

All documents must be original, signed, and dated. Copies are acceptable only if specified in the LC.


7. DEFAULT AND REMEDIES

7.1 Buyer's Default
If the Buyer defaults in payment, the Seller may:
a) Suspend further shipments
b) Cancel this Agreement and resell the commodity
c) Claim damages for any losses incurred
d) Exercise any rights available under law

7.2 Seller's Default
If the Seller defaults in delivery, the Buyer may:
a) Cancel this Agreement
b) Purchase substitute commodity from third parties
c) Claim damages for price differences and incidental costs
d) Exercise any rights available under law

7.3 Notice of Default
Either Party shall notify the other of any suspected default within [NOTICE DAYS] days. The defaulting Party shall have [CURE DAYS] days to cure the default.


8. FORCE MAJEURE

8.1 Definition
Force majeure means any event beyond the reasonable control of a Party, including but not limited to: acts of God, war, terrorism, insurrection, pandemic, government action, natural disaster, labor strike, or shipping delays.

8.2 Consequences
Neither Party shall be liable for failure to perform if such failure is caused by force majeure, provided that:
a) The affected Party notifies the other within [NOTICE DAYS] days
b) The affected Party uses reasonable efforts to mitigate the impact
c) Performance is resumed when possible

8.3 Duration
If force majeure prevents performance for more than [FORCE MAJEURE DAYS] days, either Party may cancel this Agreement without liability.


9. CONFIDENTIALITY

9.1 Confidential Information
All information exchanged between the Parties, including pricing, specifications, and business terms, is strictly confidential.

9.2 Non-Disclosure
The Parties agree not to disclose confidential information to third parties without prior written consent, except to:
a) Employees and advisors with a need to know
b) Financial institutions for payment processing
c) Government agencies as required by law

9.3 Survival
Confidentiality obligations shall survive termination of this Agreement for [CONFIDENTIALITY PERIOD] years.


10. GOVERNING LAW AND DISPUTE RESOLUTION

10.1 Governing Law
This Agreement shall be governed by and construed in accordance with the laws of [GOVERNING JURISDICTION], without regard to conflicts of law principles.

10.2 Dispute Resolution
All disputes arising from this Agreement shall be resolved as follows:

a) Negotiation: In good faith for [NEGOTIATION DAYS] days
b) Mediation: Under [MEDIATION RULES] if negotiation fails
c) Arbitration: Under [ARBITRATION RULES] as final and binding remedy

10.3 Arbitration Details
Arbitration seat: [ARBITRATION SEAT]
Number of arbitrators: [NUMBER]
Language: English
Currency: USD


11. ENTIRE AGREEMENT

This Agreement, together with all exhibits, schedules, and attachments, constitutes the entire agreement between the Parties and supersedes all prior and contemporaneous agreements, negotiations, and understandings, whether written or oral.


12. AMENDMENTS AND MODIFICATIONS

No amendment, modification, or waiver of this Agreement shall be effective unless made in writing and signed by authorized representatives of both Parties.


13. TERMINATION

13.1 Successful Completion
This Agreement shall terminate automatically upon full payment by the Buyer and receipt of the commodity.

13.2 Termination for Cause
Either Party may terminate this Agreement upon written notice if:
a) The other Party materially breaches any provision and fails to cure within [CURE DAYS] days
b) The other Party becomes insolvent or is subject to bankruptcy proceedings
c) Performance becomes impossible due to force majeure lasting more than [FORCE MAJEURE DAYS] days

13.3 Effects of Termination
Upon termination:
a) All outstanding obligations cease
b) Buyer shall pay for any commodity already shipped
c) Seller shall cease further production and shipment


14. MISCELLANEOUS

14.1 Notices
All notices must be in writing and delivered personally, by courier, by email (with confirmation), or by registered mail to the addresses specified herein.

14.2 Severability
If any provision is found invalid or unenforceable, the remaining provisions shall continue in full force.

14.3 Waiver
No waiver of any provision shall be effective unless made in writing. A waiver of one breach does not constitute a waiver of any other breach.

14.4 Assignment
Neither Party may assign this Agreement without the written consent of the other Party.


EXECUTION

IN WITNESS WHEREOF, the Parties have executed this Sales and Purchase Agreement as of the date first written above.

BUYER:

Authorized Signature: _________________________     Date: __________
Name: ${buyerName}
Title: _________________________


SELLER:

Authorized Signature: _________________________     Date: __________
Name: ${sellerName}
Title: _________________________


---
Generated by PentraCore International
This document is confidential and intended only for the named parties.
Unauthorized copying or distribution is strictly prohibited.`
}
