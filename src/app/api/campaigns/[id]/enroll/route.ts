import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_ids } = await req.json()

  // Get first step delay
  const { data: firstStep } = await supabase.from('campaign_steps').select('*').eq('campaign_id', campaignId).eq('step_order', 1).single()
  const firstDelay = firstStep ? (firstStep.delay_days * 86400000) + (firstStep.delay_hours * 3600000) : 0
  const nextStepAt = new Date(Date.now() + firstDelay).toISOString()

  let enrolled = 0, skipped = 0
  for (const leadId of lead_ids) {
    const { error } = await supabase.from('campaign_enrollments').insert({
      campaign_id: campaignId, lead_id: leadId,
      status: 'active', current_step: 0, next_step_at: nextStepAt
    })
    if (error?.code === '23505') skipped++ // unique constraint = already enrolled
    else if (!error) enrolled++
  }

  // Activate campaign if draft
  await supabase.from('campaigns').update({ status: 'active' }).eq('id', campaignId).eq('status', 'draft')

  return NextResponse.json({ enrolled, skipped_duplicates: skipped })
}
