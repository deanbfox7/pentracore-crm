export const OPPORTUNITY_STAGES = [
  'qualified',
  'rfq',
  'negotiation',
  'contract',
  'closed_won',
  'closed_lost',
] as const

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number]

const validTransitions: Record<OpportunityStage, OpportunityStage[]> = {
  qualified: ['rfq', 'closed_lost'],
  rfq: ['negotiation', 'closed_lost'],
  negotiation: ['contract', 'closed_lost'],
  contract: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
}

export function canMoveStage(fromStage: OpportunityStage, toStage: OpportunityStage): boolean {
  if (fromStage === toStage) return true
  return validTransitions[fromStage]?.includes(toStage) ?? false
}
