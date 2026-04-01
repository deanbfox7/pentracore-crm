'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { STAGES } from '@/lib/utils'

interface Props {
  leads: any[]
  activities: any[]
  appointments: any[]
}

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function AnalyticsClient({ leads, activities, appointments }: Props) {
  // Pipeline data
  const pipelineData = STAGES.map(s => ({
    name: s.label,
    count: leads.filter(l => l.stage === s.id).length,
    value: leads.filter(l => l.stage === s.id).reduce((sum: number, l: any) => sum + (l.estimated_deal_value || 0), 0)
  }))

  // Source breakdown
  const sourceCounts: Record<string, number> = {}
  leads.forEach(l => { const src = l.source || 'manual'; sourceCounts[src] = (sourceCounts[src] || 0) + 1 })
  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }))

  // Activity breakdown (last 30 days)
  const activityCounts: Record<string, number> = {}
  activities.forEach(a => { activityCounts[a.type] = (activityCounts[a.type] || 0) + 1 })
  const activityData = Object.entries(activityCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })).sort((a, b) => b.value - a.value).slice(0, 8)

  // Top countries
  const countryCounts: Record<string, number> = {}
  leads.forEach(l => { countryCounts[l.country] = (countryCounts[l.country] || 0) + 1 })
  const countryData = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }))

  // Score distribution
  const scoreDist = [
    { name: 'High (75-100)', count: leads.filter(l => l.lead_score >= 75).length },
    { name: 'Medium (50-74)', count: leads.filter(l => l.lead_score >= 50 && l.lead_score < 75).length },
    { name: 'Low (25-49)', count: leads.filter(l => l.lead_score >= 25 && l.lead_score < 50).length },
    { name: 'Unscored (0-24)', count: leads.filter(l => l.lead_score < 25).length },
  ]

  const totalPipeline = leads.filter(l => l.stage !== 'closed_lost').reduce((s: number, l: any) => s + (l.estimated_deal_value || 0), 0)
  const wonValue = leads.filter(l => l.stage === 'closed_won').reduce((s: number, l: any) => s + (l.estimated_deal_value || 0), 0)
  const convRate = leads.length ? Math.round((leads.filter(l => l.stage === 'closed_won').length / leads.length) * 100) : 0

  const tooltipStyle = { backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-xl font-semibold text-white mb-5">Analytics</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: leads.length },
          { label: 'Pipeline Value', value: `$${(totalPipeline / 1000).toFixed(0)}k` },
          { label: 'Won Value', value: `$${(wonValue / 1000).toFixed(0)}k` },
          { label: 'Win Rate', value: `${convRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">{label}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Pipeline by Stage */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white mb-4">Leads by Pipeline Stage</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineData} barSize={20}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Distribution */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white mb-4">Activity (Last 30 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Lead Sources */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white mb-4">Lead Sources</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={2}>
                {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {sourceData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="text-slate-400 capitalize">{s.name.replace(/_/g, ' ')}</span></div>
                <span className="text-slate-500">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white mb-4">Top Countries</h2>
          <div className="space-y-2">
            {countryData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-5 text-slate-600 text-xs">{i + 1}</div>
                <div className="flex-1 text-slate-300 text-sm truncate">{c.name}</div>
                <div className="bg-[#1e293b] rounded-full h-1.5 w-20">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${countryData[0] ? (c.value / countryData[0].value) * 100 : 0}%` }} />
                </div>
                <div className="text-slate-500 text-xs w-6 text-right">{c.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white mb-4">Lead Score Distribution</h2>
          <div className="space-y-3">
            {scoreDist.map(({ name, count }, i) => (
              <div key={name}>
                <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{name}</span><span>{count}</span></div>
                <div className="bg-[#1e293b] rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${leads.length ? (count / leads.length) * 100 : 0}%`, background: COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
