import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canMoveStage, OpportunityStage } from '@/lib/crm/stageRules'
import { logAuditEvent } from '@/lib/crm/audit'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')

  let query = supabase
    .from('opportunities')
    .select('*, company:companies(id, name, type), contact:contacts(id, first_name, last_name)')
    .eq('owner_id', user.id)

  if (stage) query = query.eq('stage', stage)

  const { data, error } = await query.order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const nextStage = (body.stage || 'qualified') as OpportunityStage
  if (!['qualified', 'rfq', 'negotiation', 'contract', 'closed_won', 'closed_lost'].includes(nextStage)) {
    return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert({ ...body, owner_id: user.id, stage: nextStage })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAuditEvent({
    ownerId: user.id,
    entityType: 'opportunity',
    entityId: data.id,
    action: 'created',
    payload: { title: data.title, stage: data.stage },
  })

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, stage, ...rest } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (stage) {
    const { data: existing, error: fetchError } = await supabase
      .from('opportunities')
      .select('id, stage')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    if (!canMoveStage(existing.stage as OpportunityStage, stage as OpportunityStage)) {
      return NextResponse.json({ error: 'Invalid stage transition' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('opportunities')
    .update({ ...rest, ...(stage ? { stage } : {}) })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAuditEvent({
    ownerId: user.id,
    entityType: 'opportunity',
    entityId: data.id,
    action: 'updated',
    payload: { stage: data.stage },
  })

  return NextResponse.json(data)
}
