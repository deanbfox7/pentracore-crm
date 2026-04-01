'use client'

import Link from 'next/link'
import { Campaign } from '@/types'
import { cn } from '@/lib/utils'
import { Plus, Mail, Users, Play, Pause, BarChart2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const statusColor: Record<string, string> = {
  draft: 'text-slate-400 bg-slate-400/10',
  active: 'text-green-400 bg-green-400/10',
  paused: 'text-yellow-400 bg-yellow-400/10',
  completed: 'text-blue-400 bg-blue-400/10',
}

export default function CampaignsClient({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter()

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === 'active' ? 'paused' : 'active'
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    router.refresh()
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Campaigns</h1>
          <p className="text-slate-500 text-sm mt-0.5">Automated email & SMS outreach sequences</p>
        </div>
        <Link href="/campaigns/new" className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus size={14} /> New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-[#111827] border border-[#1e293b] rounded-xl">
          <Mail size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No campaigns yet</p>
          <p className="text-slate-500 text-sm mb-4">Create your first automated outreach sequence</p>
          <Link href="/campaigns/new" className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign: any) => (
            <div key={campaign.id} className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                <Mail size={16} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-medium text-sm">{campaign.name}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', statusColor[campaign.status])}>
                    {campaign.status}
                  </span>
                </div>
                {campaign.description && <p className="text-slate-500 text-xs truncate">{campaign.description}</p>}
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail size={10} /> {campaign.steps?.[0]?.count || 0} steps
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Users size={10} /> {campaign.enrollments?.[0]?.count || 0} enrolled
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/campaigns/${campaign.id}`}
                  className="flex items-center gap-1.5 bg-[#0a0f1a] border border-[#1e293b] text-slate-400 hover:text-slate-200 rounded-lg px-3 py-1.5 text-xs transition-colors">
                  <BarChart2 size={12} /> View
                </Link>
                {campaign.status !== 'draft' && campaign.status !== 'completed' && (
                  <button onClick={() => toggleStatus(campaign.id, campaign.status)}
                    className="flex items-center gap-1.5 bg-[#0a0f1a] border border-[#1e293b] text-slate-400 hover:text-slate-200 rounded-lg px-3 py-1.5 text-xs transition-colors">
                    {campaign.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
