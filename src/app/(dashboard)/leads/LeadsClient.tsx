'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Lead } from '@/types'
import { cn, stageColor, scoreColor, STAGES, COMMODITIES } from '@/lib/utils'
import { Plus, Upload, Search, SlidersHorizontal, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LeadsClient({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value); else p.delete(key)
    startTransition(() => router.push(`${pathname}?${p.toString()}`))
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selected.size} lead(s)?`)) return
    setDeleting(true)
    await supabase.from('leads').delete().in('id', Array.from(selected))
    setSelected(new Set())
    setDeleting(false)
    router.refresh()
  }

  const allChecked = leads.length > 0 && selected.size === leads.length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Leads</h1>
          <p className="text-slate-500 text-sm mt-0.5">{leads.length} total leads</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={deleteSelected} disabled={deleting}
              className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-2 text-sm transition-colors">
              <Trash2 size={14} />{deleting ? 'Deleting...' : `Delete (${selected.size})`}
            </button>
          )}
          <Link href="/leads/import" className="flex items-center gap-1.5 bg-[#111827] border border-[#1e293b] text-slate-300 hover:bg-[#1e293b] rounded-lg px-3 py-2 text-sm transition-colors">
            <Upload size={14} /> Import
          </Link>
          <Link href="/leads/new" className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
            <Plus size={14} /> Add Lead
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search leads..."
            defaultValue={searchParams.get('search') || ''}
            onChange={e => updateParam('search', e.target.value)}
            className="w-full bg-[#111827] border border-[#1e293b] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={searchParams.get('stage') || ''}
          onChange={e => updateParam('stage', e.target.value)}
          className="bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select
          value={searchParams.get('commodity') || ''}
          onChange={e => updateParam('commodity', e.target.value)}
          className="bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Commodities</option>
          {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={searchParams.get('sort') || ''}
          onChange={e => updateParam('sort', e.target.value)}
          className="bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="created_at">Newest First</option>
          <option value="lead_score">Highest Score</option>
          <option value="company_name">Company Name</option>
          <option value="updated_at">Recently Updated</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e293b]">
              <th className="p-3 w-10">
                <input type="checkbox" checked={allChecked} onChange={e => setSelected(e.target.checked ? new Set(leads.map(l => l.id)) : new Set())}
                  className="rounded border-slate-600 bg-transparent" />
              </th>
              {['Contact', 'Company', 'Country', 'Commodities', 'Stage', 'Score', 'Actions'].map(h => (
                <th key={h} className="p-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {leads.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-500">
                No leads yet. <Link href="/leads/new" className="text-indigo-400 hover:text-indigo-300">Add your first lead</Link> or <Link href="/leads/import" className="text-indigo-400 hover:text-indigo-300">import a CSV</Link>.
              </td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className="hover:bg-white/2 transition-colors group">
                <td className="p-3">
                  <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)}
                    className="rounded border-slate-600 bg-transparent" />
                </td>
                <td className="p-3">
                  <Link href={`/leads/${lead.id}`} className="block group-hover:text-indigo-300 transition-colors">
                    <div className="text-white text-sm font-medium">{lead.first_name} {lead.last_name}</div>
                    <div className="text-slate-500 text-xs">{lead.email}</div>
                  </Link>
                </td>
                <td className="p-3">
                  <div className="text-slate-300 text-sm">{lead.company_name}</div>
                  <div className="text-slate-500 text-xs">{lead.industry}</div>
                </td>
                <td className="p-3 text-slate-400 text-sm">{lead.country}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(lead.commodities_of_interest || []).slice(0, 2).map(c => (
                      <span key={c} className="bg-indigo-500/10 text-indigo-300 text-xs px-1.5 py-0.5 rounded">{c}</span>
                    ))}
                    {(lead.commodities_of_interest || []).length > 2 && (
                      <span className="text-slate-500 text-xs">+{lead.commodities_of_interest.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', stageColor(lead.stage))}>
                    {STAGES.find(s => s.id === lead.stage)?.label}
                  </span>
                </td>
                <td className="p-3">
                  {lead.lead_score > 0 && (
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded', scoreColor(lead.lead_score))}>
                      {lead.lead_score}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <Link href={`/leads/${lead.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
