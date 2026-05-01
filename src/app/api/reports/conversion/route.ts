import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('stage, commodity')
    .eq('owner_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const stageBreakdown = (opportunities || []).reduce((acc: Record<string, number>, row: { stage: string }) => {
    acc[row.stage] = (acc[row.stage] || 0) + 1
    return acc
  }, {})

  const commodityBreakdown = (opportunities || []).reduce((acc: Record<string, number>, row: { commodity: string }) => {
    acc[row.commodity] = (acc[row.commodity] || 0) + 1
    return acc
  }, {})

  const rows = [['category', 'key', 'count']]
  Object.entries(stageBreakdown).forEach(([key, count]) => rows.push(['stage', key, String(count)]))
  Object.entries(commodityBreakdown).forEach(([key, count]) => rows.push(['commodity', key, String(count)]))
  const csv = rows.map((row) => row.join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="conversion-report.csv"',
    },
  })
}
