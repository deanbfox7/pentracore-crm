// LOI generation utilities integrated with deal documents workflow
import { buildDealDocumentContent } from '@/lib/deal-documents'

export interface LOIGenerationRequest {
  dealId: string | number
  token: string
}

export interface LOIGenerationResponse {
  success: boolean
  document_id?: number
  loi_text?: string
  generated_at?: string
  error?: string
}

/**
 * Generate and store LOI document for a deal
 * Uses the documents API which enforces business rules (NCNDA must exist first)
 */
export async function generateLOI(req: LOIGenerationRequest): Promise<LOIGenerationResponse> {
  try {
    const res = await fetch(`/api/crm/deals/${req.dealId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.token}`
      },
      body: JSON.stringify({ document_type: 'loi' })
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to generate LOI' }
    }

    return {
      success: true,
      document_id: data.id,
      generated_at: new Date().toISOString()
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Check if LOI generation is allowed for a deal
 * LOI can be generated after NCNDA document exists
 */
export function canGenerateLOI(deal: any): { allowed: boolean; reason?: string } {
  if (!deal) {
    return { allowed: false, reason: 'Deal not found' }
  }

  const documents = Array.isArray(deal.deal_documents) ? deal.deal_documents : []
  const hasNcnda = documents.some((doc: any) => doc.document_type === 'ncnda')

  if (!hasNcnda) {
    return { allowed: false, reason: 'NCNDA must be generated before LOI' }
  }

  return { allowed: true }
}
