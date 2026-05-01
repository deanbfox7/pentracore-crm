import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/crm/audit'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const overdueOnly = searchParams.get('overdue') === '1'

  let query = supabase.from('tasks').select('*').eq('owner_id', user.id)
  if (overdueOnly) {
    query = query
      .neq('status', 'done')
      .lt('due_date', new Date().toISOString())
  }

  const { data, error } = await query.order('due_date', { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...body, owner_id: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAuditEvent({
    ownerId: user.id,
    entityType: 'task',
    entityId: data.id,
    action: 'created',
    payload: { due_date: data.due_date, priority: data.priority },
  })
  return NextResponse.json(data, { status: 201 })
}
