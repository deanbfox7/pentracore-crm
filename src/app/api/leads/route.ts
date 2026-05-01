import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeLeadScore } from '@/lib/crm/scoring'
import { logAuditEvent } from '@/lib/crm/audit'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  let query = supabase.from('leads').select('*').eq('owner_id', user.id)

  const stage = searchParams.get('stage')
  const search = searchParams.get('search')
  if (stage) query = query.eq('stage', stage)
  if (search) query = query.or(`company_name.ilike.%${search}%,first_name.ilike.%${search}%`)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const score = computeLeadScore({
    hasEmail: !!body.email,
    hasPhone: !!body.phone,
    hasLinkedIn: !!body.linkedin_url,
    hasWebsite: !!body.company_website,
    commodityCount: (body.commodities_of_interest || []).length,
    estimatedDealValue: body.estimated_deal_value,
    hasNotes: !!body.notes,
  })
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...body,
      owner_id: user.id,
      lead_score: score.score,
      score_reasoning: score.reason,
      scored_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAuditEvent({
    ownerId: user.id,
    entityType: 'lead',
    entityId: data.id,
    action: 'created',
    payload: { score: data.lead_score, stage: data.stage },
  })
  return NextResponse.json(data, { status: 201 })
}
