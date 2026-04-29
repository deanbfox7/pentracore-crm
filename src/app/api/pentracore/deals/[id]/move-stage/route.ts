import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STAGE_BY_INDEX: Record<number, string> = {
  1: 'inquiry',
  2: 'ncn_da_exchanged',
  3: 'kyc_sanctions_cleared',
  4: 'soft_offer_aligned',
  5: 'hard_offer_proofs_exchanged',
  6: 'contract_drafted_spa',
  7: 'banking_in_motion',
  8: 'inspection_assay',
  9: 'shipment_logistics',
  10: 'payment_commission_settled',
  11: 'repeat_deal_nurture',
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dealId = params.id
  const body = await req.json()
  const newStageIndex = Number(body?.newStageIndex)
  if (!Number.isFinite(newStageIndex) || newStageIndex < 1 || newStageIndex > 11) {
    return NextResponse.json({ error: 'newStageIndex must be 1..11' }, { status: 400 })
  }

  const { data: deal, error: dealErr } = await supabase
    .from('deals')
    .select('id, deal_code, stage, stage_index, owner_id')
    .eq('owner_id', user.id)
    .eq('id', dealId)
    .maybeSingle()

  if (dealErr) return NextResponse.json({ error: dealErr.message }, { status: 500 })
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

  const currentIndex = Number(deal.stage_index || 1)
  if (newStageIndex === currentIndex) {
    return NextResponse.json({ ok: true, deal })
  }

  // Hard gate enforcement (start strict for safety):
  // - allow backward moves
  // - allow forward move only by 1 stage (no skipping)
  if (newStageIndex > currentIndex && newStageIndex - currentIndex > 1) {
    return NextResponse.json(
      { error: `Stage skip not allowed (current: ${currentIndex}, requested: ${newStageIndex}). Move step-by-step.` },
      { status: 409 }
    )
  }

  const newStage = STAGE_BY_INDEX[newStageIndex] || deal.stage

  const { data: updated, error: updateErr } = await supabase
    .from('deals')
    .update({
      stage: newStage,
      stage_index: newStageIndex,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', deal.id)
    .select('*')
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Minimal auto-task: milestone reached.
  await supabase.from('deal_tasks').insert({
    owner_id: user.id,
    deal_id: deal.id,
    title: `Milestone reached: Stage ${newStageIndex}`,
    description: `Stage moved for ${deal.deal_code} → ${newStage}`,
    priority: newStageIndex >= 4 ? 'high' : 'medium',
    status: 'open',
    due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })

  return NextResponse.json({ ok: true, deal: updated })
}

