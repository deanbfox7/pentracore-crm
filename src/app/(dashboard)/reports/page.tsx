import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
// Using inferred Supabase types instead of Opportunity

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nowIso = new Date().toISOString()
  const [oppsResult, overdueResult] = await Promise.all([
    supabase.from('opportunities').select('id, stage, commodity').eq('owner_id', user.id),
    supabase.from('tasks').select('id').eq('owner_id', user.id).neq('status', 'done').lt('due_date', nowIso),
  ])

  const opportunities = oppsResult.data || []
  const overdue = overdueResult.data || []

  const won = opportunities.filter((op) => op.stage === 'closed_won').length
  const lost = opportunities.filter((op) => op.stage === 'closed_lost').length
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0

  const commodityCounts = opportunities.reduce((acc: Record<string, number>, op) => {
    acc[op.commodity] = (acc[op.commodity] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Reports & Reminders</h1>
        <p className="text-slate-500 text-sm mt-0.5">Conversion, win/loss trends, and overdue follow-up monitoring</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <p className="text-slate-500 text-sm">Opportunity Count</p>
          <p className="text-2xl text-white font-semibold mt-2">{opportunities.length}</p>
        </div>
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <p className="text-slate-500 text-sm">Win Rate</p>
          <p className="text-2xl text-white font-semibold mt-2">{winRate}%</p>
        </div>
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <p className="text-slate-500 text-sm">Overdue Follow-ups</p>
          <p className="text-2xl text-red-300 font-semibold mt-2">{overdue.length}</p>
        </div>
      </div>

      <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
        <h2 className="text-white font-medium mb-3">Commodity Distribution</h2>
        <div className="space-y-2">
          {Object.entries(commodityCounts).map(([commodity, count]) => (
            <div key={commodity} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{commodity}</span>
              <span className="text-indigo-300">{count}</span>
            </div>
          ))}
          {Object.keys(commodityCounts).length === 0 && <p className="text-slate-500 text-sm">No commodities tracked yet.</p>}
        </div>
      </section>

      <div className="text-xs text-slate-500">
        Need raw overdue tasks payload? Use <Link className="text-indigo-300" href="/api/cron/notify-overdue-tasks">`/api/cron/notify-overdue-tasks`</Link>.
      </div>
    </div>
  )
}
