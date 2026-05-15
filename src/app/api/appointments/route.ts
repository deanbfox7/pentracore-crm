import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('appointments')
    .select('*, lead:leads(first_name, last_name, company_name, email, phone)')
    .eq('owner_id', user.id)
    .order('start_time', { ascending: true })

  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...body, owner_id: user.id, reminder_sent: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  await supabase.from('activities').insert({
    lead_id: body.lead_id, user_id: user.id,
    type: 'meeting_booked',
    subject: body.title,
    body: `Meeting scheduled for ${new Date(body.start_time).toLocaleString()}`,
  })

  return NextResponse.json(data, { status: 201 })
}
