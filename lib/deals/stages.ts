// Deal stage validation and state machine for commodity trading flow
// Rules enforce: NCNDA-first → KYC → IMFPA → SPA → closed

export type DealStage = 'inquiry' | 'loi_draft' | 'loi_sent' | 'ncnda_signed' | 'kyc_approved' | 'imfpa_signed' | 'spa_signed' | 'closed_won' | 'closed_lost'

export interface DealData {
  id: string | number
  stage: DealStage
  ncnda_signed_date: string | null
  kyc_approved_date: string | null
  imfpa_signed_date: string | null
  spa_signed_date: string | null
}

export interface StageTransitionResult {
  allowed: boolean
  reason?: string
  nextStage?: DealStage
}

// Valid state transitions (directed graph)
const VALID_TRANSITIONS: Record<DealStage, DealStage[]> = {
  inquiry: ['loi_draft', 'closed_lost'],
  loi_draft: ['loi_sent', 'closed_lost'],
  loi_sent: ['ncnda_signed', 'closed_lost'],
  ncnda_signed: ['kyc_approved', 'closed_lost'],
  kyc_approved: ['imfpa_signed', 'closed_lost'],
  imfpa_signed: ['spa_signed', 'closed_lost'],
  spa_signed: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
}

// Date field requirements for each stage
const STAGE_DATE_REQUIREMENTS: Record<DealStage, (keyof DealData)[]> = {
  inquiry: [],
  loi_draft: [],
  loi_sent: [],
  ncnda_signed: ['ncnda_signed_date'],
  kyc_approved: ['ncnda_signed_date', 'kyc_approved_date'],
  imfpa_signed: ['kyc_approved_date', 'imfpa_signed_date'],
  spa_signed: ['imfpa_signed_date', 'spa_signed_date'],
  closed_won: ['spa_signed_date'],
  closed_lost: [],
}

export function validateTransition(deal: DealData, targetStage: DealStage): StageTransitionResult {
  const currentStage = deal.stage as DealStage

  // Check if terminal state
  if (currentStage === 'closed_won' || currentStage === 'closed_lost') {
    return { allowed: false, reason: `Cannot transition from terminal stage ${currentStage}` }
  }

  // Check if transition is allowed
  if (!VALID_TRANSITIONS[currentStage]?.includes(targetStage)) {
    return { allowed: false, reason: `Cannot transition from ${currentStage} to ${targetStage}` }
  }

  // Check date requirements for target stage
  const requiredDates = STAGE_DATE_REQUIREMENTS[targetStage]
  for (const dateField of requiredDates) {
    if (!deal[dateField]) {
      return {
        allowed: false,
        reason: `Cannot move to ${targetStage}: ${dateField} is required but not set`
      }
    }
  }

  // Special rule: IMFPA must be before SPA (enforced in DB constraint but check here too)
  if (targetStage === 'spa_signed' && deal.imfpa_signed_date && deal.spa_signed_date) {
    const imfpaDate = new Date(deal.imfpa_signed_date)
    const spaDate = new Date(deal.spa_signed_date)
    if (spaDate < imfpaDate) {
      return { allowed: false, reason: 'SPA date cannot be before IMFPA date' }
    }
  }

  return { allowed: true, nextStage: targetStage }
}

// Helper to get next allowed stages from current stage
export function getAllowedNextStages(deal: DealData): DealStage[] {
  return VALID_TRANSITIONS[deal.stage as DealStage] || []
}

// Helper to check if a stage is terminal
export function isTerminalStage(stage: DealStage): boolean {
  return stage === 'closed_won' || stage === 'closed_lost'
}
