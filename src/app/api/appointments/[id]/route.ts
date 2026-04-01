import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase.from('appointments').update(body).eq('id', id).eq('owner_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.status === 'completed') {
    await supabase.from('activities').insert({ lead_id: data.lead_id, user_id: user.id, type: 'meeting_completed', subject: data.title })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('appointments').delete().eq('id', id).eq('owner_id', user.id)
  return NextResponse.json({ success: true })
}
