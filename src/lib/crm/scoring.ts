type LeadScoreInput = {
  hasEmail?: boolean
  hasPhone?: boolean
  hasLinkedIn?: boolean
  hasWebsite?: boolean
  commodityCount?: number
  estimatedDealValue?: number
  hasNotes?: boolean
}

export function computeLeadScore(input: LeadScoreInput): { score: number; reason: string } {
  let score = 0
  const reasons: string[] = []

  if (input.hasEmail) {
    score += 15
    reasons.push('Email present')
  }
  if (input.hasPhone) {
    score += 15
    reasons.push('Phone present')
  }
  if (input.hasLinkedIn) {
    score += 10
    reasons.push('LinkedIn profile provided')
  }
  if (input.hasWebsite) {
    score += 10
    reasons.push('Company website provided')
  }
  if ((input.commodityCount || 0) > 1) {
    score += 10
    reasons.push('Multiple commodity interests')
  }

  const dealValue = input.estimatedDealValue || 0
  if (dealValue >= 1_000_000) {
    score += 25
    reasons.push('Large expected deal value')
  } else if (dealValue >= 250_000) {
    score += 15
    reasons.push('Mid-sized expected deal value')
  } else if (dealValue > 0) {
    score += 8
    reasons.push('Known expected deal value')
  }

  if (input.hasNotes) {
    score += 5
    reasons.push('Context notes included')
  }

  return {
    score: Math.min(score, 100),
    reason: reasons.join(', '),
  }
}
