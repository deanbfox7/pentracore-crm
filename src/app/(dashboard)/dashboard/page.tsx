import { createClient } from '@/lib/supabase/server'
import { Users, TrendingUp, Mail, Calendar, DollarSign, Target } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatDateTime, STAGES } from '@/lib/utils'
// Opportunity type not needed — using inferred Supabase types

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // if (!user) redirect('/login')

  const nowIso = new Date().toISOString()
  const [leadsResult, appointmentsResult, opportunitiesResult, overdueTasksResult] = await Promise.all([
    supabase.from('leads').select('id, stage, lead_score, estimated_deal_value, created_at').eq('owner_id', user?.id || 'demo-user'),
    supabase.from('appointments').select('id, title, start_time, type, status, lead:leads(first_name, last_name, company_name)').eq('owner_id', user?.id || 'demo-user').eq('status', 'scheduled').gte('start_time', new Date().toISOString()).order('start_time').limit(5),
    supabase.from('opportunities').select('id, stage, commodity, owner_id').eq('owner_id', user?.id || 'demo-user'),
    supabase.from('tasks').select('id').eq('owner_id', user?.id || 'demo-user').neq('status', 'done').lt('due_date', nowIso),
  ])

  const leads = leadsResult.data || []
  const appointments = appointmentsResult.data || []
  const opportunities = opportunitiesResult.data || []
  const overdueTasks = overdueTasksResult.data?.length || 0

  const totalLeads = leads.length
  const activeLeads = leads.filter(l => !['closed_won', 'closed_lost'].includes(l.stage)).length
  const closedWon = leads.filter(l => l.stage === 'closed_won').length
  const totalPipeline = leads
    .filter(l => l.stage !== 'closed_lost')
    .reduce((sum, l) => sum + (l.estimated_deal_value || 0), 0)
  const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + l.lead_score, 0) / leads.length) : 0
  const wins = opportunities.filter((op) => op.stage === 'closed_won').length
  const losses = opportunities.filter((op) => op.stage === 'closed_lost').length
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0

  const stageCounts: Record<string, number> = {}
  STAGES.forEach(s => { stageCounts[s.id] = leads.filter(l => l.stage === s.id).length })

  const stats = [
    { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Active Pipeline', value: activeLeads, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Deals Won', value: closedWon, icon: Target, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Pipeline Value', value: `$${(totalPipeline/1000).toFixed(0)}k`, icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Avg Lead Score', value: avgScore, icon: Mail, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Upcoming Meetings', value: appointments.length, icon: Calendar, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { label: 'Opportunity Win Rate', value: `${winRate}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Overdue Follow-ups', value: overdueTasks, icon: Calendar, color: 'text-red-400', bg: 'bg-red-400/10' },
  ]

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Welcome back — here&apos;s your sales overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">{label}</span>
              <div className={`${bg} ${color} p-2 rounded-lg`}><Icon size={16} /></div>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Pipeline Breakdown */}
        <div className="col-span-2 bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-white font-medium mb-4">Pipeline Breakdown</h2>
          <div className="space-y-2.5">
            {STAGES.map(stage => {
              const count = stageCounts[stage.id] || 0
              const pct = totalLeads ? (count / totalLeads) * 100 : 0
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-slate-400">{stage.label}</div>
                  <div className="flex-1 bg-[#1e293b] rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-8 text-sm text-slate-400 text-right">{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium">Upcoming Meetings</h2>
            <Link href="/appointments" className="text-indigo-400 text-xs hover:text-indigo-300">View all</Link>
          </div>
          {appointments.length === 0 ? (
            <div className="text-center py-6">
              <Calendar size={24} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No upcoming meetings</p>
              <Link href="/appointments" className="text-indigo-400 text-xs hover:text-indigo-300 mt-1 block">Schedule one</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{apt.title}</p>
                    <p className="text-slate-500 text-xs">{formatDateTime(apt.start_time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex gap-3">
        <Link href="/leads/new" className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          <Users size={14} /> Add Lead
        </Link>
        <Link href="/leads/import" className="flex items-center gap-2 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] text-slate-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          Import CSV
        </Link>
        <Link href="/campaigns/new" className="flex items-center gap-2 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] text-slate-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          <Mail size={14} /> New Campaign
        </Link>
      </div>
    </div>
  )
}
