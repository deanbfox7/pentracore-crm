import { createCachedChatCompletion } from '@/lib/ai/claude'

export type ComplianceStatus = 'pass' | 'fail' | 'warn'

export type DocumentReviewResult = {
  compliance_status: ComplianceStatus
  missing_fields: string[]
  signature_gaps: string[]
  compliance_notes: string
}

const REVIEW_SYSTEM_PROMPT =
  'You review PentraCore trade documents. Return JSON only with compliance_status, missing_fields, signature_gaps, compliance_notes. Enforce NCNDA before SPA, KYC gate, IMFPA before SPA, and no buyer-seller data mixing. Be concise.'

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function extractJson(text: string): Partial<DocumentReviewResult> {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return {}

  try {
    return JSON.parse(match[0]) as Partial<DocumentReviewResult>
  } catch {
    return {}
  }
}

export async function reviewDocumentCompliance(documentText: string, documentType: string) {
  const lower = documentText.toLowerCase()
  const normalizedType = documentType.trim().toUpperCase()
  const missingFields: string[] = []
  const signatureGaps: string[] = []

  if (!hasAny(lower, ['kyc', 'know your customer', 'beneficial owner'])) {
    missingFields.push('KYC gate must be present')
  }

  if (normalizedType === 'SPA' && !hasAny(lower, ['ncnda', 'non-circumvention', 'non disclosure', 'non-disclosure'])) {
    missingFields.push('NCNDA must precede SPA')
  }

  if (normalizedType === 'SPA' && !hasAny(lower, ['imfpa', 'fee protection', 'intermediary master fee'])) {
    missingFields.push('IMFPA must be in place before SPA')
  }

  const hasBuyer = hasAny(lower, ['buyer:', 'buyer ', 'buyer company', 'purchaser'])
  const hasSeller = hasAny(lower, ['seller:', 'seller ', 'seller company', 'vendor'])
  if (hasBuyer && hasSeller && !hasAny(lower, ['masked', 'redacted', 'separate annex'])) {
    missingFields.push('Buyer and seller data must not be mixed in the same document')
  }

  if (!hasAny(lower, ['signature', 'signed by', 'executed by'])) {
    signatureGaps.push('Signature block missing')
  }

  if (!hasAny(lower, ['date:', 'dated', 'effective date'])) {
    signatureGaps.push('Execution date missing')
  }

  const aiText = await createCachedChatCompletion({
    system: REVIEW_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Type: ${normalizedType}\nDocument:\n${documentText.slice(0, 12000)}`,
      },
    ],
    maxTokens: 500,
  })

  const ai = extractJson(aiText)
  const aiMissing = Array.isArray(ai.missing_fields) ? ai.missing_fields : []
  const aiSignature = Array.isArray(ai.signature_gaps) ? ai.signature_gaps : []
  const combinedMissing = Array.from(new Set([...missingFields, ...aiMissing].filter(Boolean)))
  const combinedSignature = Array.from(new Set([...signatureGaps, ...aiSignature].filter(Boolean)))

  const compliance_status: ComplianceStatus =
    combinedMissing.length > 0 ? 'fail' : combinedSignature.length > 0 ? 'warn' : 'pass'

  return {
    compliance_status,
    missing_fields: combinedMissing,
    signature_gaps: combinedSignature,
    compliance_notes:
      typeof ai.compliance_notes === 'string' && ai.compliance_notes.trim()
        ? ai.compliance_notes.trim()
        : compliance_status === 'pass'
          ? 'Document passes the configured PentraCore compliance checks.'
          : 'Document requires remediation before progressing in the deal workflow.',
  } satisfies DocumentReviewResult
}
