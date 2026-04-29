'use client'

import { useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'
import { BarChart3, MapPin, AlertTriangle, ShieldCheck, DollarSign, TrendingUp } from 'lucide-react'

type Deal = {
  deal_code: string
  stage: string
  stage_index: number
  commodity: string
  volume: number | null
  estimated_gmv: number | null
  estimated_commission: number | null
  probability: number | null
  next_action: string | null
  blocker: string | null
  origin_region: string | null
  origin_country: string | null
}

type DealTask = {
  id: string
  title: string
  due_at: string | null
  priority: string
  status: string
  deal?: { deal_code?: string } | null
}

type InvestorRow = {
  deal?: {
    deal_code?: string
    commodity?: string
    estimated_gmv?: number | null
    estimated_commission?: number | null
    probability?: number | null
    stage_index?: number | null
  } | null
  investor_company?: { name?: string } | null
}

type Props = {
  deals: Deal[]
  tasks: DealTask[]
  investorRows: InvestorRow[]
}

const STAGES: { id: number; label: string }[] = [
  { id: 1, label: 'Inquiry' },
  { id: 2, label: 'NCNDA' },
  { id: 3, label: 'KYC+Sanctions' },
  { id: 4, label: 'Soft Offer' },
  { id: 5, label: 'Hard Offer' },
  { id: 6, label: 'SPA Drafted' },
  { id: 7, label: 'Banking' },
  { id: 8, label: 'Inspection' },
  { id: 9, label: 'Logistics' },
  { id: 10, label: 'Payment+Commission' },
  { id: 11, label: 'Repeat Nurture' },
]

const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#f97316', '#06b6d4', '#eab308', '#8b5cf6', '#ef4444']

function fmtMoneyZar(n: number) {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `ZAR ${(n / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `ZAR ${(n / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `ZAR ${(n / 1e3).toFixed(0)}k`
  return `ZAR ${Math.round(n)}`
}

function hashTo01(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619
  return (h >>> 0) / 2 ** 32
}

export default function ExecutiveDashboardClient({ deals, tasks, investorRows }: Props) {
  const [selectedCommodity, setSelectedCommodity] = useState<string>('All')

  const filteredDeals = useMemo(() => {
    if (selectedCommodity === 'All') return deals
    return deals.filter(d => (d.commodity || '').toLowerCase() === selectedCommodity.toLowerCase())
  }, [deals, selectedCommodity])

  const totals = useMemo(() => {
    const activeDeals = filteredDeals.length
    const totalGMV = filteredDeals.reduce((sum, d) => sum + (d.estimated_gmv || 0), 0)
    const totalCommission = filteredDeals.reduce((sum, d) => sum + (d.estimated_commission || 0), 0)
    const avgProb = filteredDeals.length ? filteredDeals.reduce((s, d) => s + (d.probability || 0), 0) / filteredDeals.length : 0
    return {
      activeDeals,
      totalGMV,
      totalCommission,
      avgProb,
    }
  }, [filteredDeals])

  const stageCounts = useMemo(() => {
    const map: Record<number, number> = {}
    STAGES.forEach(s => (map[s.id] = 0))
    filteredDeals.forEach(d => {
      const idx = Number(d.stage_index || 1)
      map[idx] = (map[idx] || 0) + 1
    })
    return STAGES.map(s => ({ stage: s.label, count: map[s.id] || 0 }))
  }, [filteredDeals])

  const commodityData = useMemo(() => {
    const map: Record<string, { commodity: string; volume: number; count: number; gmv: number }> = {}
    filteredDeals.forEach(d => {
      const c = d.commodity || 'Unspecified'
      if (!map[c]) map[c] = { commodity: c, volume: 0, count: 0, gmv: 0 }
      map[c].volume += Number(d.volume || 0)
      map[c].count += 1
      map[c].gmv += Number(d.estimated_gmv || 0)
    })
    return Object.values(map).sort((a, b) => b.gmv - a.gmv)
  }, [filteredDeals])

  const urgentTasks = useMemo(() => {
    const now = Date.now()
    const week = 7 * 24 * 60 * 60 * 1000
    return tasks
      .filter(t => t.status === 'open')
      .filter(t => t.due_at ? (new Date(t.due_at).getTime() <= now + week) : true)
      .slice(0, 8)
  }, [tasks])

  const bestDeals = useMemo(() => {
    return [...filteredDeals]
      .sort((a, b) => (b.probability || 0) - (a.probability || 0))
      .slice(0, 6)
  }, [filteredDeals])

  const highRiskDeals = useMemo(() => {
    // Heuristic: low probability OR has a blocker
    return [...filteredDeals]
      .filter(d => (d.probability || 0) < 40 || Boolean(d.blocker))
      .sort((a, b) => (a.probability || 0) - (b.probability || 0))
      .slice(0, 6)
  }, [filteredDeals])

  const investorOpportunities = useMemo(() => {
    const rows = investorRows || []
    const flattened = rows
      .map(r => ({
        deal_code: r.deal?.deal_code || '',
        commodity: r.deal?.commodity || '',
        probability: r.deal?.probability || 0,
        investor: r.investor_company?.name || 'Investor',
        stage_index: r.deal?.stage_index || 0,
        estimated_gmv: r.deal?.estimated_gmv ?? null,
        estimated_commission: r.deal?.estimated_commission ?? null,
      }))
      .filter(x => x.deal_code)

    // Sort by probability, take top 6 unique deals
    const seen = new Set<string>()
    const sorted = flattened.sort((a, b) => (b.probability || 0) - (a.probability || 0))
    const unique: typeof sorted = []
    for (const d of sorted) {
      if (seen.has(d.deal_code)) continue
      seen.add(d.deal_code)
      unique.push(d)
      if (unique.length >= 6) break
    }
    return unique
  }, [investorRows])

  const execTooltipStyle = { backgroundColor: '#0b1220', border: '1px solid #1e293b', borderRadius: 8 }

  const mapPoints = useMemo(() => {
    return filteredDeals.slice(0, 60).map(d => {
      const key = `${d.origin_country || ''}|${d.origin_region || ''}|${d.deal_code}`
      const r = d.origin_region || d.origin_country || 'Unknown region'
      const x = hashTo01(key) * 100
      const y = hashTo01(r + key) * 100
      return {
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        label: d.deal_code,
        commodity: d.commodity,
        stage_index: d.stage_index,
        region: r,
      }
    })
  }, [filteredDeals])

  const stageTooltip = (props: any) => {
    const payload = props?.payload || {}
    return (
      <div style={execTooltipStyle as any} className="p-2 text-xs text-slate-200">
        <div className="font-medium text-white">{payload.stage}</div>
        <div className="text-slate-400">{payload.count} deals</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/5 text-yellow-300 text-xs">
            <ShieldCheck size={14} /> PentraCore Deal Intelligence
          </div>
          <h1 className="text-2xl font-semibold text-white mt-3">Executive Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Premium overview of pipeline, demand, and execution risk.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl px-3 py-2">
            <div className="text-[11px] text-slate-500">Commodity filter</div>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="mt-1 bg-transparent text-white text-sm outline-none"
            >
              <option value="All">All</option>
              {commodityData.map(c => (
                <option key={c.commodity} value={c.commodity}>{c.commodity}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-400 text-sm">Total Active Deal Value</div>
              <DollarSign className="text-yellow-300" size={18} />
            </div>
            <div className="text-2xl font-bold text-white">{fmtMoneyZar(totals.totalGMV)}</div>
            <div className="text-slate-500 text-xs mt-1">{totals.activeDeals} deals in view</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-400 text-sm">Expected Commissions</div>
              <TrendingUp className="text-emerald-300" size={18} />
            </div>
            <div className="text-2xl font-bold text-white">{fmtMoneyZar(totals.totalCommission)}</div>
            <div className="text-slate-500 text-xs mt-1">Based on estimated commissions</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-400 text-sm">Avg. Probability</div>
              <BarChart3 className="text-indigo-300" size={18} />
            </div>
            <div className="text-2xl font-bold text-white">{Math.round(totals.avgProb)}%</div>
            <div className="text-slate-500 text-xs mt-1">Heuristic from your data</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-400 text-sm">Urgent Tasks</div>
              <AlertTriangle className="text-red-300" size={18} />
            </div>
            <div className="text-2xl font-bold text-white">{urgentTasks.length}</div>
            <div className="text-slate-500 text-xs mt-1">Due within 7 days</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <div className="text-white font-medium">Pipeline by Stage</div>
              <div className="text-slate-500 text-sm mt-0.5">Track mineral deal progression across hard gates.</div>
            </div>
          </div>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageCounts} barSize={20}>
                <XAxis dataKey="stage" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={stageTooltip} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="count" fill="#eab308" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="text-white font-medium mb-2">Commodity Demand Mix</div>
          <div className="text-slate-500 text-sm mb-3">GMV-weighted view from active deals.</div>
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commodityData.slice(0, 6).map(c => ({ name: c.commodity, value: c.gmv }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  paddingAngle={2}
                  labelLine={false}
                >
                  {commodityData.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={execTooltipStyle as any} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 space-y-2">
            {commodityData.slice(0, 5).map((c, i) => (
              <div key={c.commodity} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-300 truncate">{c.commodity}</span>
                </div>
                <span className="text-slate-500">{fmtMoneyZar(c.gmv)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deals quality & urgent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="text-white font-medium mb-3">Urgent Action Items</div>
          <div className="space-y-2">
            {urgentTasks.length === 0 ? (
              <div className="text-slate-500 text-sm">No urgent tasks yet.</div>
            ) : (
              urgentTasks.map(t => (
                <div key={t.id} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="text-white text-sm font-medium truncate">{t.title}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    {t.due_at ? `Due ${new Date(t.due_at).toLocaleDateString()}` : 'Due soon'}
                    {t.deal?.deal_code ? ` • ${t.deal.deal_code}` : ''}
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-red-400/10 text-red-300 text-[11px]">
                    {t.priority || 'medium'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="text-white font-medium mb-3">Likely-to-Close</div>
          <div className="space-y-2">
            {bestDeals.length === 0 ? (
              <div className="text-slate-500 text-sm">Import deals to see probability ranking.</div>
            ) : (
              bestDeals.map(d => (
                <div key={d.deal_code} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate">{d.deal_code}</div>
                      <div className="text-slate-500 text-xs mt-1 truncate">{d.commodity}</div>
                    </div>
                    <div className="text-yellow-200 text-sm font-semibold">{Math.round(d.probability || 0)}%</div>
                  </div>
                  {d.next_action && (
                    <div className="text-slate-400 text-xs mt-2 line-clamp-2">{d.next_action}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="text-white font-medium">Investor Opportunities</div>
            <div className="text-slate-500 text-xs">{investorOpportunities.length} deals</div>
          </div>
          <div className="space-y-2">
            {investorOpportunities.length === 0 ? (
              <div className="text-slate-500 text-sm">No investor-linked deals yet. Add investor participants to enable this view.</div>
            ) : (
              investorOpportunities.map(d => (
                <div key={d.deal_code} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate">{d.deal_code}</div>
                      <div className="text-slate-500 text-xs mt-1 truncate">{d.commodity}</div>
                      <div className="text-slate-400 text-[11px] mt-1 truncate">{d.investor}</div>
                    </div>
                    <div className="text-yellow-200 text-sm font-semibold">{Math.round(d.probability || 0)}%</div>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-2">
                    Stage {d.stage_index || 0}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Region map */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-white font-medium flex items-center gap-2">
              <MapPin size={16} /> Region Map of Active Deals
            </div>
            <div className="text-slate-500 text-sm mt-0.5">
              Prototype visualization (stage-weighted scatter). Origin labels come from your deal fields.
            </div>
          </div>
        </div>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <XAxis type="number" dataKey="x" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="y" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={execTooltipStyle as any}
                cursor={{ stroke: '#eab308', strokeWidth: 1, fill: 'rgba(234,179,8,0.05)' }}
                formatter={() => null}
                labelFormatter={() => null}
                content={(props: any) => {
                  const p = props?.payload?.[0]
                  if (!p) return null
                  return (
                    <div style={execTooltipStyle as any} className="p-2 text-xs text-slate-200">
                      <div className="text-white font-medium">{p.label}</div>
                      <div className="text-slate-400">{p.region}</div>
                      <div className="text-slate-400">{p.commodity}</div>
                      <div className="text-slate-400">Stage {p.stage_index}</div>
                    </div>
                  )
                }}
              />
              <Scatter data={mapPoints} fill="#eab308" shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400">
          {Array.from(new Set(filteredDeals.map(d => d.origin_region || d.origin_country).filter(Boolean) as string[])).slice(0, 10).map((r) => (
            <div key={r} className="rounded-lg border border-[#1e293b] bg-[#0b1220] px-3 py-2">
              <div className="text-slate-300">{r}</div>
              <div className="text-slate-500 mt-0.5">{filteredDeals.filter(d => (d.origin_region || d.origin_country) === r).length} deals</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

