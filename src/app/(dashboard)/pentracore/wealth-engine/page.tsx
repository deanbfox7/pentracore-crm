import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, ClipboardCheck, Database, Handshake, LockKeyhole, TrendingUp } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type DailyAction = {
  id: string
  deal_code: string
  commodity: string
  stage_index: number
  processing_status: string
  action: string
  blocker: string
  estimated_gmv: number | null
  probability: number | null
  overdue_task_count: number
  priority_rank: number
}

type DealProcessing = {
  id: string
  deal_code: string
  commodity: string
  grade_spec: string | null
  volume: number | null
  uom: string | null
  estimated_gmv: number | null
  participant_count: number
  document_count: number
  assay_count: number
  open_task_count: number
  processing_status: string
  operating_instruction: string
}

type SupplyDemandMatch = {
  commodity: string
  grade_spec: string
  supply_volume_mt: number
  demand_volume_mt: number
  demand_gap_mt: number
  supply_deals: number
  demand_deals: number
}

function fmtNumber(value: number | null | undefined) {
  const n = Number(value || 0)
  return new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(n)
}

function fmtMoney(value: number | null | undefined) {
  const n = Number(value || 0)
  if (!n) return 'Not priced'
  if (Math.abs(n) >= 1_000_000_000) return `ZAR ${(n / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(n) >= 1_000_000) return `ZAR ${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `ZAR ${(n / 1_000).toFixed(0)}k`
  return `ZAR ${fmtNumber(n)}`
}

function statusClass(status: string) {
  switch (status) {
    case 'hot':
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
    case 'blocked':
      return 'border-red-400/20 bg-red-400/10 text-red-300'
    case 'overdue':
      return 'border-orange-400/20 bg-orange-400/10 text-orange-300'
    case 'compliance_gate':
      return 'border-yellow-400/20 bg-yellow-400/10 text-yellow-300'
    default:
      return 'border-slate-600/40 bg-slate-700/20 text-slate-300'
  }
}

function readableStatus(status: string) {
  return status.replace(/_/g, ' ')
}

export default async function WealthEnginePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Use service client for public view or if user is missing, to bypass RLS filters
  const dataClient = user ? supabase : await createServiceClient()
  
  let queryActions = dataClient.from('v_pentracore_daily_actions').select('*')
  let queryProcessing = dataClient.from('v_pentracore_deal_processing').select('*')
  let queryMatch = dataClient.from('v_pentracore_supply_demand_match').select('*')

  if (user) {
    queryActions = queryActions.eq('owner_id', user.id)
    queryProcessing = queryProcessing.eq('owner_id', user.id)
    queryMatch = queryMatch.eq('owner_id', user.id)
  }

  const [actionsResult, processingResult, matchResult] = await Promise.all([
    queryActions
      .order('priority_rank', { ascending: true })
      .order('estimated_gmv', { ascending: false, nullsFirst: false })
      .limit(12),
    queryProcessing
      .order('estimated_gmv', { ascending: false, nullsFirst: false })
      .limit(10),
    queryMatch
      .order('demand_gap_mt', { ascending: false })
      .limit(10),
  ])

  const actions = (actionsResult.data || []) as DailyAction[]
  const processing = (processingResult.data || []) as DealProcessing[]
  const matches = (matchResult.data || []) as SupplyDemandMatch[]

  const totalGMV = processing.reduce((sum, deal) => sum + Number(deal.estimated_gmv || 0), 0)
  const blockedCount = actions.filter(action => action.processing_status === 'blocked' || action.processing_status === 'overdue').length
  const complianceCount = actions.filter(action => action.processing_status === 'compliance_gate').length
  const hotCount = actions.filter(action => action.processing_status === 'hot').length

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/20 bg-emerald-400/5 text-emerald-300 text-xs">
            <Database size={14} /> PentraCore Wealth Engine
          </div>
          <h1 className="text-2xl font-semibold text-white mt-3">Commodity Operating Desk</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            A plain-English control room for turning documents, WhatsApps, mandates, and commodity offers into protected commercial action.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/pentracore/import" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm transition-colors">
            Import data <ArrowRight size={15} />
          </Link>
          <Link href="/pentracore/deals/pipeline" className="inline-flex items-center gap-2 border border-[#1e293b] bg-[#111827] hover:bg-white/5 text-slate-200 rounded-lg px-3 py-2 text-sm transition-colors">
            Pipeline <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Value in System</span>
            <TrendingUp size={18} className="text-emerald-300" />
          </div>
          <div className="text-white text-2xl font-semibold mt-2">{fmtMoney(totalGMV)}</div>
          <div className="text-slate-500 text-xs mt-1">From priced imported deals</div>
        </div>
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Hot Deals</span>
            <Handshake size={18} className="text-emerald-300" />
          </div>
          <div className="text-white text-2xl font-semibold mt-2">{hotCount}</div>
          <div className="text-slate-500 text-xs mt-1">High-probability action</div>
        </div>
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Compliance Gates</span>
            <LockKeyhole size={18} className="text-yellow-300" />
          </div>
          <div className="text-white text-2xl font-semibold mt-2">{complianceCount}</div>
          <div className="text-slate-500 text-xs mt-1">NCNDA / KYC before disclosure</div>
        </div>
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Blocked / Overdue</span>
            <AlertTriangle size={18} className="text-red-300" />
          </div>
          <div className="text-white text-2xl font-semibold mt-2">{blockedCount}</div>
          <div className="text-slate-500 text-xs mt-1">Needs human follow-up</div>
        </div>
      </div>

      <section className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-2 text-white font-medium">
            <ClipboardCheck size={18} className="text-indigo-300" /> Today&apos;s Money-Moving Actions
          </div>
          <p className="text-slate-500 text-sm mt-1">Give this list to the team. It says what to do next without needing to understand the database.</p>
        </div>
        <div className="divide-y divide-[#1e293b]">
          {actions.length === 0 ? (
            <div className="p-6 text-slate-500 text-sm">No actions yet. Import the master tracker and counterparties to activate the operating desk.</div>
          ) : actions.map((action) => (
            <div key={action.id} className="p-4 grid grid-cols-1 lg:grid-cols-[180px_1fr_150px] gap-3">
              <div>
                <Link href={`/pentracore/deals/${action.id}`} className="text-indigo-300 hover:text-indigo-200 text-sm font-medium">
                  {action.deal_code}
                </Link>
                <div className="text-slate-500 text-xs mt-1">{action.commodity || 'Commodity'} · Stage {action.stage_index}</div>
              </div>
              <div>
                <div className="text-slate-100 text-sm">{action.action}</div>
                {action.blocker && <div className="text-red-300 text-xs mt-1">Blocker: {action.blocker}</div>}
              </div>
              <div className="lg:text-right">
                <div className={`inline-flex border rounded-full px-2 py-0.5 text-[11px] capitalize ${statusClass(action.processing_status)}`}>
                  {readableStatus(action.processing_status)}
                </div>
                <div className="text-slate-500 text-xs mt-2">{fmtMoney(action.estimated_gmv)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#1e293b]">
            <h2 className="text-white font-medium">Supply / Demand Matching</h2>
            <p className="text-slate-500 text-sm mt-1">Positive gap means buyer demand is larger than captured supply.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-[#0b1220] text-slate-500 text-xs">
              <tr>
                <th className="text-left px-4 py-3">Commodity</th>
                <th className="text-right px-4 py-3">Supply MT</th>
                <th className="text-right px-4 py-3">Demand MT</th>
                <th className="text-right px-4 py-3">Gap MT</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={4}>No match data yet.</td></tr>
              ) : matches.map((row) => (
                <tr key={`${row.commodity}-${row.grade_spec}`} className="border-t border-[#1e293b]">
                  <td className="px-4 py-3">
                    <div className="text-slate-100">{row.commodity || 'Unspecified'}</div>
                    <div className="text-slate-500 text-xs truncate max-w-[260px]">{row.grade_spec}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">{fmtNumber(row.supply_volume_mt)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{fmtNumber(row.demand_volume_mt)}</td>
                  <td className={row.demand_gap_mt > 0 ? 'px-4 py-3 text-right text-yellow-300' : 'px-4 py-3 text-right text-emerald-300'}>
                    {fmtNumber(row.demand_gap_mt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#1e293b]">
            <h2 className="text-white font-medium">Database Quality Check</h2>
            <p className="text-slate-500 text-sm mt-1">The fastest way to create wealth is to remove uncertainty from each deal.</p>
          </div>
          <div className="divide-y divide-[#1e293b]">
            {processing.length === 0 ? (
              <div className="p-6 text-slate-500 text-sm">Import deals to see quality checks.</div>
            ) : processing.map((deal) => (
              <div key={deal.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/pentracore/deals/${deal.id}`} className="text-indigo-300 hover:text-indigo-200 text-sm font-medium">
                      {deal.deal_code}
                    </Link>
                    <div className="text-slate-500 text-xs mt-1">{deal.commodity} · {deal.grade_spec || 'No grade captured'}</div>
                  </div>
                  <span className={`border rounded-full px-2 py-0.5 text-[11px] capitalize ${statusClass(deal.processing_status)}`}>
                    {readableStatus(deal.processing_status)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                  <div className="rounded-lg bg-[#0b1220] border border-[#1e293b] p-2">
                    <div className="text-slate-500">People</div>
                    <div className="text-white mt-1">{deal.participant_count}</div>
                  </div>
                  <div className="rounded-lg bg-[#0b1220] border border-[#1e293b] p-2">
                    <div className="text-slate-500">Docs</div>
                    <div className="text-white mt-1">{deal.document_count}</div>
                  </div>
                  <div className="rounded-lg bg-[#0b1220] border border-[#1e293b] p-2">
                    <div className="text-slate-500">Assays</div>
                    <div className="text-white mt-1">{deal.assay_count}</div>
                  </div>
                  <div className="rounded-lg bg-[#0b1220] border border-[#1e293b] p-2">
                    <div className="text-slate-500">Tasks</div>
                    <div className="text-white mt-1">{deal.open_task_count}</div>
                  </div>
                </div>
                <div className="text-slate-400 text-xs mt-3">{deal.operating_instruction}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

