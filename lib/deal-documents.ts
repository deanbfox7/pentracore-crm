export type DealDocumentType = 'loi' | 'ncnda' | 'kyc' | 'imfpa' | 'spa'
export type DealDocumentStatus = 'draft' | 'sent' | 'signed'

export interface IntakeDeal {
  id: number
  deal_name: string | null
  commodity: string
  tonnage: number
  origin_country: string | null
  target_price: number | null
  price_per_unit: number | null
  counterparty_name: string | null
  counterparty_email: string | null
  submitter_name: string | null
  submitter_email: string | null
  notes: string | null
  verified: boolean | null
  verification_notes: string | null
  created_at: string
}

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function valueOrPending(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return 'Pending'
  return String(value)
}

export function buildDealDocumentContent(type: DealDocumentType, deal: IntakeDeal) {
  const dealName = valueOrPending(deal.deal_name)
  const counterpartyName = valueOrPending(deal.counterparty_name)
  const counterpartyEmail = valueOrPending(deal.counterparty_email)
  const commodity = valueOrPending(deal.commodity)
  const tonnage = valueOrPending(deal.tonnage)
  const price = valueOrPending(deal.target_price ?? deal.price_per_unit)
  const origin = valueOrPending(deal.origin_country)
  const today = formatDate()

  if (type === 'loi') {
    return `# Letter of Intent

Date: ${today}
Deal: ${dealName}

## Parties
- PentraCore
- ${counterpartyName}

## Transaction Summary
- Commodity: ${commodity}
- Estimated tonnage: ${tonnage}
- Target price: ${price}
- Origin: ${origin}

This Letter of Intent records the parties' good-faith intent to evaluate and progress a commodity transaction using the deal metadata above. The parties intend to proceed with commercial discussions, due diligence, and definitive transaction documentation subject to verification, compliance review, and final written agreement.

This draft is non-binding except for any confidentiality, non-circumvention, exclusivity, or other provisions that the parties expressly agree are binding in later executed documents.`
  }

  if (type === 'ncnda') {
    return `# Non-Circumvention Non-Disclosure Agreement

Date: ${today}
Deal: ${dealName}

## Parties
- PentraCore
- ${counterpartyName}

## Covered Transaction
- Commodity: ${commodity}

The parties agree to keep transaction information, contacts, pricing, procedures, documents, and commercial terms confidential. The parties further agree not to circumvent each other, directly or indirectly, in relation to the introduced counterparties, suppliers, buyers, brokers, mandates, or transaction channels connected to this commodity opportunity.

This draft is prepared for review and must be replaced by a fully executed NCNDA before reliance.`
  }

  if (type === 'kyc') {
    return `# KYC Request

Date: ${today}
Deal: ${dealName}

## Counterparty
- Name: ${counterpartyName}
- Email: ${counterpartyEmail}
- Commodity: ${commodity}

## Required Documents
- Passport or government-issued identity document
- Proof of address
- Company registration documents
- Recent bank statement

Please provide clear copies of the required documents for compliance review before the transaction advances.`
  }

  if (type === 'imfpa') {
    return `# IMFPA Draft

Date: ${today}
Deal: ${dealName}

This IMFPA placeholder records that an Irrevocable Master Fee Protection Agreement draft exists for ${counterpartyName} in relation to ${commodity}.`
  }

  return `# SPA Draft

Date: ${today}
Deal: ${dealName}

This SPA placeholder records that a Sale and Purchase Agreement draft exists for ${counterpartyName} in relation to ${commodity}.`
}
