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

    const ncndaText = generateProfessionalNCNDA(deal, buyer, seller)

    return NextResponse.json({
      deal_id: deal.id,
      document_type: 'ncnda',
      ncnda_text: ncndaText,
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

    const ncndaText = generateProfessionalNCNDA(deal, buyer, seller)

    const { data: document, error: insertError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .insert({
        deal_id: deal.id,
        document_type: 'ncnda',
        content: ncndaText,
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
        document_type: 'ncnda',
        ncnda_text: ncndaText,
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

function generateProfessionalNCNDA(deal: any, buyer: any, seller: any): string {
  const today = new Date().toISOString().split('T')[0]
  const buyerName = buyer?.name || '[BUYER NAME]'
  const sellerName = seller?.name || '[SELLER NAME]'
  const buyerCountry = buyer?.country || '[BUYER COUNTRY]'
  const sellerCountry = seller?.country || '[SELLER COUNTRY]'
  const commodity = deal.commodity || '[COMMODITY]'

  return `NON-CIRCUMVENTION AND NON-DISCLOSURE AGREEMENT (NCNDA)

Date: ${today}
Reference Number: NCNDA-DEAL-${deal.id}


PARTIES

This Agreement is entered into between:

1. ${buyerName} (${buyerCountry})
   ("Buyer")

2. ${sellerName} (${sellerCountry})
   ("Seller")

3. PentraCore International
   ("Broker")

Collectively referred to as "Parties" and individually as "Party."


RECITALS

WHEREAS, the Parties wish to explore a business opportunity regarding the sale and purchase of ${commodity};

WHEREAS, the Parties recognize the sensitive and confidential nature of this transaction;

WHEREAS, the Parties wish to protect their respective interests and proprietary information;

NOW, THEREFORE, in consideration of the mutual covenants herein contained, the Parties agree as follows:


1. NON-CIRCUMVENTION CLAUSE

1.1 The Buyer and Seller agree not to circumvent, bypass, or deal directly with each other or with any third party regarding this transaction, except through PentraCore International as the authorized Broker.

1.2 Neither party shall attempt to obtain the contact information of the other party for the purpose of conducting direct negotiations without the involvement of PentraCore International.

1.3 Any attempt at circumvention shall result in the liable party paying the full brokerage commission as outlined in the transaction terms, regardless of whether the transaction is ultimately completed.

1.4 This non-circumvention obligation shall survive for a period of twelve (12) months following the termination of this Agreement.


2. NON-DISCLOSURE CLAUSE

2.1 Each Party acknowledges that it may receive Confidential Information from the other Parties during the course of this transaction. "Confidential Information" includes, but is not limited to:
   - Business plans, financial data, and pricing information
   - Technical specifications and commodity details
   - Counterparty identities, contact information, and negotiations
   - Any information marked or identified as confidential
   - Information that a reasonable person would understand to be confidential

2.2 Each Party agrees to maintain the confidentiality of all Confidential Information and to use it solely for the purpose of evaluating this transaction.

2.3 Confidential Information shall not be disclosed to any third party without the prior written consent of the disclosing Party, except:
   - To employees, advisors, and legal representatives who have a need to know
   - To parties performing verification or due diligence as required
   - As required by law or court order, with prompt notice to the disclosing Party


3. OBLIGATIONS OF THE PARTIES

3.1 Each Party shall:
   - Maintain strict confidentiality of all information shared
   - Use information only for evaluating this business opportunity
   - Protect information with reasonable security measures
   - Not copy, reproduce, or distribute confidential materials without authorization

3.2 The Broker shall:
   - Maintain confidentiality regarding both parties' identities and information
   - Serve as the exclusive intermediary for all communications
   - Not disclose one party's information to the other without consent
   - Facilitate the transaction in accordance with all applicable laws


4. TERM AND SURVIVAL

4.1 This Agreement becomes effective upon signature and shall remain in force for a period of twenty-four (24) months from the date hereof, unless earlier terminated by written agreement of the Parties.

4.2 The obligations of confidentiality shall survive the termination of this Agreement indefinitely.

4.3 The non-circumvention clause shall survive for twelve (12) months after termination.


5. EXCLUSIONS

The obligations herein do not apply to information that:
   - Was known to the receiving Party prior to disclosure, as evidenced by written records
   - Is or becomes publicly available through no breach of this Agreement
   - Is independently developed by the receiving Party without use of the disclosed information
   - Is rightfully received from a third party without confidentiality obligations


6. REMEDIES

The Parties acknowledge that breach of this Agreement may cause irreparable harm for which monetary damages would be an insufficient remedy. Accordingly, in addition to any other remedies available at law or in equity, the disclosing Party shall be entitled to seek injunctive relief to prevent breach or continued breach of this Agreement.


7. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the Parties regarding the subject matter and supersedes all prior and contemporaneous agreements, whether written or oral.


8. DISCLAIMER

This Non-Circumvention and Non-Disclosure Agreement is a binding legal document. By executing this Agreement, each Party acknowledges:
   - Understanding of all terms and conditions
   - Authority to enter into this Agreement
   - Intent to be legally bound by the terms hereof
   - Agreement to comply with all applicable laws and regulations

The execution of this NCNDA does not constitute a binding agreement to purchase or sell. It is entered into for the sole purpose of permitting the Parties to conduct preliminary discussions and due diligence regarding the proposed transaction.


SIGNATURES

By signing below, the Parties acknowledge receipt and understanding of this Agreement and commit to its terms.

Buyer: _________________________     Date: __________
       ${buyerName}


Seller: _________________________     Date: __________
        ${sellerName}


Broker: _________________________     Date: __________
        PentraCore International


---
Generated by PentraCore International
This document is confidential and intended only for the named parties.
Unauthorized copying or distribution is strictly prohibited.`
}
