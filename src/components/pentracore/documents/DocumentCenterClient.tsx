'use client'

import { useMemo, useState } from 'react'
import { Search, FileText, Tag } from 'lucide-react'

type DocRow = {
  id: string
  doc_type: string
  name: string
  status: string
  expiry_date: string | null
  linked_deal_id: string | null
  visibility_stage_index: number
  ai_extracted_summary: string | null
}

type Props = { docs: DocRow[] }

const DEFAULT_TYPES = [
  'NCNDA',
  'IMFPA',
  'LOI',
  'SCO',
  'FCO',
  'ICPO',
  'POF',
  'BCL',
  'Assay',
  'COA',
  'BL',
  'EUC',
  'SPA',
  'Other',
]

export default function DocumentCenterClient({ docs }: Props) {
  const [q, setQ] = useState('')
  const [type, setType] = useState<string>('All')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return (docs || []).filter(d => {
      const typeOk = type === 'All' ? true : (d.doc_type || '').toLowerCase() === type.toLowerCase()
      if (!typeOk) return false
      if (!query) return true
      const hay = `${d.doc_type} ${d.name} ${d.status} ${d.linked_deal_id || ''} ${d.ai_extracted_summary || ''}`.toLowerCase()
      return hay.includes(query)
    })
  }, [docs, q, type])

  const typeOptions = useMemo(() => {
    const set = new Set((docs || []).map(d => d.doc_type).filter(Boolean))
    const arr = Array.from(set)
    // Merge with defaults for consistent UX
    for (const d of DEFAULT_TYPES) if (!arr.includes(d)) arr.push(d)
    return arr.sort((a, b) => a.localeCompare(b))
  }, [docs])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-white font-semibold text-xl">Document Center</div>
          <div className="text-slate-500 text-sm mt-1">Search contracts, LOIs, assays, and other deal artifacts with AI-extracted summaries.</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl px-3 py-2 inline-flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search docs, deal IDs, summaries…"
              className="bg-transparent outline-none text-sm text-white w-64 max-w-[70vw]"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
          <Tag size={16} />
          Filter by type
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white outline-none"
        >
          <option value="All">All</option>
          {typeOptions.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-slate-500 text-sm bg-[#111827] border border-[#1e293b] rounded-xl p-6">
          No documents match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.slice(0, 120).map((d) => (
            <div key={d.id} className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-indigo-300" />
                    <div className="text-white text-sm font-medium truncate">{d.name}</div>
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    {d.doc_type} • visibility ≥ {d.visibility_stage_index} • status: {d.status}
                  </div>
                </div>
                <div className="text-slate-500 text-xs whitespace-nowrap">
                  {d.expiry_date ? `Exp ${new Date(d.expiry_date).toLocaleDateString()}` : ''}
                </div>
              </div>

              {d.ai_extracted_summary ? (
                <div className="text-slate-400 text-sm leading-relaxed line-clamp-4">
                  {d.ai_extracted_summary}
                </div>
              ) : (
                <div className="text-slate-600 text-sm">
                  No AI summary yet. Upload the document and connect extraction later.
                </div>
              )}

              {d.linked_deal_id && (
                <div className="text-slate-500 text-xs">
                  Linked deal: <span className="text-slate-300">{d.linked_deal_id}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

