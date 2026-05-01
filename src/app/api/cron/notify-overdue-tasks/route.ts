import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from('tasks')
    .select('id, owner_id, title, due_date')
    .neq('status', 'done')
    .not('due_date', 'is', null)
    .lt('due_date', nowIso)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Placeholder response for reminder integrations (email/SMS/Slack).
  return NextResponse.json({
    checkedAt: nowIso,
    overdueCount: data?.length || 0,
    overdueTasks: data || [],
  })
}
