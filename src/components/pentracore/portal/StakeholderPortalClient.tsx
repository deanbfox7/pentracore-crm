'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Building2, Users, Briefcase, Truck, ShieldCheck } from 'lucide-react'
import type { ComponentType } from 'react'

type Deal = {
  id: string
  deal_code: string
  stage_index: number
  stage: string
  commodity: string
  volume: number | null
  estimated_gmv: number | null
  estimated_commission: number | null
  probability: number | null
  next_action: string | null
  blocker: string | null
  origin_region: string | null
}

type ParticipantRow = {
  deal_code: string
  deal_id: string
  role: string
  company_name?: string | null
  stage_index?: number | null
  probability?: number | null
}

type TaskRow = {
  id: string
  title: string
  due_at: string | null
  priority: string
  status: string
  deal?: { deal_code?: string } | null
}

type Props = {
  profileRole: string
  deals: Deal[]
  participants: ParticipantRow[]
  tasks: TaskRow[]
  nowMs: number
}

type IconProps = { size?: number; className?: string }
const TABS: { id: string; label: string; icon: ComponentType<IconProps>; allowed: (role: string) => boolean }[] = [
  { id: 'executives', label: 'Executives', icon: ShieldCheck, allowed: () => true },
  { id: 'investors', label: 'Investors', icon: Briefcase, allowed: (r) => r === 'admin' || r === 'sales_manager' },
  { id: 'buyers', label: 'Buyers', icon: Users, allowed: (r) => r === 'admin' || r === 'sales_manager' },
  { id: 'sellers', label: 'Sellers', icon: Building2, allowed: (r) => r === 'admin' || r === 'sales_manager' },
  { id: 'operators', label: 'Operators', icon: Truck, allowed: (r) => r === 'admin' || r === 'sales_manager' || r === 'sales_rep' || r === 'viewer' },
]

export default function StakeholderPortalClient({ profileRole, deals, participants, tasks, nowMs }: Props) {
  const [tab, setTab] = useState<string>(() => (
    profileRole === 'admin' || profileRole === 'sales_manager' ? 'executives' : 'operators'
  ))

  const visibleTabs = useMemo(() => TABS.filter(t => t.allowed(profileRole)), [profileRole])

  const urgentTasks = useMemo(() => {
    const now = nowMs
    const week = 7 * 24 * 60 * 60 * 1000
    return tasks
      .filter(t => t.status === 'open')
      .filter(t => t.due_at ? new Date(t.due_at).getTime() <= now + week : false)
      .slice(0, 10)
  }, [tasks, nowMs])

  const tabDeals = useMemo(() => {
    if (tab === 'executives') return deals.slice(0, 10)
    if (tab === 'operators') return deals.slice(0, 10)

    // Buyer/seller/investor tabs filter by participants
    const wantedRole = tab === 'buyers' ? 'buyer' : tab === 'sellers' ? 'seller' : 'investor'
    const dealCodes = new Set(participants.filter(p => p.role === wantedRole).map(p => p.deal_code))
    return deals.filter(d => dealCodes.has(d.deal_code)).slice(0, 10)
  }, [tab, deals, participants])

  const tabParticipants = useMemo(() => {
    if (tab === 'executives' || tab === 'operators') return []
    const wantedRole = tab === 'buyers' ? 'buyer' : tab === 'sellers' ? 'seller' : 'investor'
    return participants.filter(p => p.role === wantedRole).slice(0, 30)
  }, [tab, participants])

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/5 text-yellow-300 text-xs">
          <ShieldCheck size={14} /> Stakeholder Portal
        </div>
        <h1 className="text-2xl font-semibold text-white mt-3">PentraCore Deal Intelligence Platform</h1>
        <p className="text-slate-500 text-sm mt-1">Role-based view with confidentiality gates. Your RLS policies hide counterparties before required pipeline stages.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTabs.map(t => {
          const active = t.id === tab
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors border',
                active ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200' : 'bg-[#111827] border-[#1e293b] text-slate-300 hover:border-slate-500',
              ].join(' ')}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'executives' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-medium">Executive Overview</div>
                <div className="text-slate-500 text-xs mt-1">{deals.length} deals loaded</div>
              </div>
              {urgentTasks.length > 0 && (
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-red-200 text-xs">
                  <AlertTriangle size={14} />
                  {urgentTasks.length} urgent
                </div>
              )}
            </div>

            <div className="space-y-2">
              {tabDeals.map(d => (
                <div key={d.id} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate">{d.deal_code}</div>
                      <div className="text-slate-500 text-xs mt-1 truncate">{d.commodity} • Stage {d.stage_index}</div>
                    </div>
                    {d.blocker ? (
                      <div className="text-red-200 text-xs font-medium">Blocked</div>
                    ) : (
                      <div className="text-yellow-200 text-xs font-medium">{d.probability != null ? `${Math.round(d.probability)}%` : '—'}</div>
                    )}
                  </div>
                  <div className="text-slate-400 text-xs mt-2 line-clamp-2">{d.next_action || d.blocker || 'No next action set.'}</div>
                </div>
              ))}
              {tabDeals.length === 0 && <div className="text-slate-500 text-sm">No executive deals to display.</div>}
            </div>
          </section>

          <aside className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
            <div className="text-white font-medium">Urgent Action Items</div>
            {urgentTasks.length === 0 ? (
              <div className="text-slate-500 text-sm">No urgent items within 7 days.</div>
            ) : (
              urgentTasks.map(t => (
                <div key={t.id} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="text-white text-sm font-medium">{t.title}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    Due {t.due_at ? new Date(t.due_at).toLocaleDateString() : '—'} • {t.priority}
                    {t.deal?.deal_code ? ` • ${t.deal.deal_code}` : ''}
                  </div>
                </div>
              ))
            )}
          </aside>
        </div>
      )}

      {tab === 'operators' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 lg:col-span-2 space-y-3">
            <div className="text-white font-medium">Operator Queue</div>
            <div className="text-slate-500 text-xs">Tasks and execution blockers for the active pipeline.</div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-slate-500 text-sm">No tasks found.</div>
              ) : (
                tasks.slice(0, 16).map(t => (
                  <div key={t.id} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium truncate">{t.title}</div>
                        <div className="text-slate-500 text-xs mt-1">
                          {t.deal?.deal_code ? `Deal ${t.deal.deal_code} • ` : ''}
                          Due {t.due_at ? new Date(t.due_at).toLocaleDateString() : '—'} • {t.priority}
                        </div>
                      </div>
                      <div className="text-slate-400 text-xs">{t.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
            <div className="text-white font-medium">Blocked Deals</div>
            <div className="text-slate-500 text-xs">Quick list to unblock next milestones.</div>
            <div className="space-y-2">
              {deals.filter(d => d.blocker).slice(0, 10).map(d => (
                <div key={d.id} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="text-white text-sm font-medium">{d.deal_code}</div>
                  <div className="text-slate-500 text-xs mt-1">Stage {d.stage_index} • {d.commodity}</div>
                  <div className="text-red-200/90 text-xs mt-2 line-clamp-2">{d.blocker}</div>
                </div>
              ))}
              {deals.filter(d => d.blocker).length === 0 && (
                <div className="text-slate-500 text-sm">No blocked deals right now.</div>
              )}
            </div>
          </aside>
        </div>
      )}

      {(tab === 'buyers' || tab === 'sellers' || tab === 'investors') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 lg:col-span-2 space-y-3">
            <div className="text-white font-medium">
              {tab === 'buyers' ? 'Buyer-Aligned Opportunities' : tab === 'sellers' ? 'Seller-Aligned Opportunities' : 'Investor Opportunities'}
            </div>
            <div className="text-slate-500 text-xs">Deals where counterparties are attached at the current stage visibility.</div>

            <div className="space-y-2">
              {tabDeals.length === 0 ? (
                <div className="text-slate-500 text-sm">No deals available for this role yet.</div>
              ) : (
                tabDeals.map(d => (
                  <div key={d.id} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium truncate">{d.deal_code}</div>
                        <div className="text-slate-500 text-xs mt-1 truncate">{d.commodity} • Stage {d.stage_index}</div>
                      </div>
                      <div className="text-yellow-200 text-sm font-semibold">{d.probability != null ? `${Math.round(d.probability)}%` : '—'}</div>
                    </div>
                    <div className="text-slate-400 text-xs mt-2 line-clamp-2">{d.next_action || d.blocker || '—'}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
            <div className="text-white font-medium">Counterparties</div>
            <div className="text-slate-500 text-xs">Attached companies for this stakeholder view.</div>
            <div className="space-y-2">
              {tabParticipants.length === 0 ? (
                <div className="text-slate-500 text-sm">No counterparties are attached/visible.</div>
              ) : (
                tabParticipants.map(p => (
                  <div key={`${p.deal_id}-${p.role}-${p.company_name || 'x'}`} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-3">
                    <div className="text-white text-sm font-medium truncate">{p.company_name || '—'}</div>
                    <div className="text-slate-500 text-xs mt-1">Deal {p.deal_code} • {p.role}</div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

