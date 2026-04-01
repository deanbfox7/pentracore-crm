import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('campaigns').select('*, steps:campaign_steps(*)').eq('owner_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, steps } = await req.json()

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({ name, description, status: 'draft', owner_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (steps?.length) {
    const stepRows = steps.map((s: any) => ({ ...s, campaign_id: campaign.id }))
    await supabase.from('campaign_steps').insert(stepRows)
  }

  return NextResponse.json(campaign, { status: 201 })
}
