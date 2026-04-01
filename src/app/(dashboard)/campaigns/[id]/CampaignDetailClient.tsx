'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Campaign, Lead } from '@/types'
import { cn, formatDateTime } from '@/lib/utils'
import { Mail, MessageSquare, Users, Play, Pause, Plus, Check, Zap } from 'lucide-react'

const enrollStatusColor: Record<string, string> = {
  active: 'text-blue-300', completed: 'text-green-300', replied: 'text-yellow-300',
  bounced: 'text-red-300', paused: 'text-slate-400', unsubscribed: 'text-slate-500'
}

interface Props {
  campaign: Campaign & { steps?: any[]; enrollments?: any[] }
  leads: Pick<Lead, 'id' | 'first_name' | 'last_name' | 'company_name' | 'email'>[]
}

export default function CampaignDetailClient({ campaign, leads }: Props) {
  const router = useRouter()
  const [enrolling, setEnrolling] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const enrolledIds = new Set(campaign.enrollments?.map((e: any) => e.lead_id))
  const filteredLeads = leads.filter(l =>
    !enrolledIds.has(l.id) &&
    (search === '' || `${l.first_name} ${l.last_name} ${l.company_name}`.toLowerCase().includes(search.toLowerCase()))
  )

  async function enrollLeads() {
    setLoading(true)
    await fetch(`/api/campaigns/${campaign.id}/enroll`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: Array.from(selectedLeads) })
    })
    setLoading(false)
    setShowEnrollModal(false)
    setSelectedLeads(new Set())
    router.refresh()
  }

  async function toggleStatus() {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    router.refresh()
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-white">{campaign.name}</h1>
          {campaign.description && <p className="text-slate-500 text-sm mt-0.5">{campaign.description}</p>}
          <span className={cn('inline-block mt-1 text-xs px-2 py-0.5 rounded-full capitalize', {
            'text-slate-400 bg-slate-400/10': campaign.status === 'draft',
            'text-green-400 bg-green-400/10': campaign.status === 'active',
            'text-yellow-400 bg-yellow-400/10': campaign.status === 'paused',
            'text-blue-400 bg-blue-400/10': campaign.status === 'completed',
          })}>{campaign.status}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
            <Plus size={14} /> Enroll Leads
          </button>
          {campaign.status !== 'draft' && (
            <button onClick={toggleStatus}
              className="flex items-center gap-1.5 bg-[#111827] border border-[#1e293b] text-slate-300 hover:bg-[#1e293b] rounded-lg px-3 py-2 text-sm transition-colors">
              {campaign.status === 'active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{campaign.steps?.length || 0}</div>
          <div className="text-slate-500 text-sm">Sequence steps</div>
        </div>
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{campaign.enrollments?.length || 0}</div>
          <div className="text-slate-500 text-sm">Total enrolled</div>
        </div>
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{campaign.enrollments?.filter((e: any) => e.status === 'replied').length || 0}</div>
          <div className="text-slate-500 text-sm">Replies received</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Steps */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white mb-3">Sequence</h2>
          <div className="space-y-2">
            {(campaign.steps || []).sort((a: any, b: any) => a.step_order - b.step_order).map((step: any) => (
              <div key={step.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0a0f1a]">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs shrink-0 mt-0.5">{step.step_order}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {step.channel === 'email' ? <Mail size={11} className="text-slate-500" /> : <MessageSquare size={11} className="text-slate-500" />}
                    <span className="text-slate-300 text-xs">{step.channel === 'email' ? step.subject_template : 'SMS'}</span>
                    {step.use_ai_personalization && <span title="AI personalized"><Zap size={10} className="text-purple-400" /></span>}
                  </div>
                  {step.step_order > 1 && <p className="text-slate-600 text-xs">after {step.delay_days}d {step.delay_hours}h</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enrollments */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white mb-3">Enrolled Leads</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(campaign.enrollments || []).length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">No leads enrolled yet</p>
            ) : (campaign.enrollments || []).map((enrollment: any) => (
              <div key={enrollment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0a0f1a] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-xs">{enrollment.lead?.first_name} {enrollment.lead?.last_name}</p>
                  <p className="text-slate-600 text-xs truncate">{enrollment.lead?.company_name}</p>
                </div>
                <div className="text-right">
                  <span className={cn('text-xs capitalize', enrollStatusColor[enrollment.status])}>{enrollment.status}</span>
                  <p className="text-slate-700 text-xs">Step {enrollment.current_step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white font-medium mb-4">Enroll Leads in &quot;{campaign.name}&quot;</h2>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
              className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 mb-3" />
            <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
              {filteredLeads.map(lead => (
                <label key={lead.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0a0f1a] cursor-pointer">
                  <input type="checkbox" checked={selectedLeads.has(lead.id)}
                    onChange={e => setSelectedLeads(prev => { const n = new Set(prev); e.target.checked ? n.add(lead.id) : n.delete(lead.id); return n })}
                    className="rounded border-slate-600" />
                  <div>
                    <p className="text-slate-300 text-sm">{lead.first_name} {lead.last_name}</p>
                    <p className="text-slate-600 text-xs">{lead.company_name} · {lead.email}</p>
                  </div>
                </label>
              ))}
              {filteredLeads.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No leads available to enroll</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={enrollLeads} disabled={loading || selectedLeads.size === 0}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                {loading ? 'Enrolling...' : `Enroll ${selectedLeads.size} leads`}
              </button>
              <button onClick={() => { setShowEnrollModal(false); setSelectedLeads(new Set()) }}
                className="bg-[#0a0f1a] border border-[#1e293b] text-slate-400 rounded-lg px-4 py-2 text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
