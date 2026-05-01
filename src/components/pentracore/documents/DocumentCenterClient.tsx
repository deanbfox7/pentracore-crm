'use client'

import { useMemo, useState } from 'react'
import { Search, FileText, Tag, Upload, ShieldCheck } from 'lucide-react'

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

type ReviewResult = {
  compliance_status: 'pass' | 'fail' | 'warn'
  missing_fields: string[]
  signature_gaps: string[]
  compliance_notes: string
}

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
  const [reviewType, setReviewType] = useState('NCNDA')
  const [reviewFile, setReviewFile] = useState<File | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)

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

  async function reviewDocument() {
    if (!reviewFile || reviewing) return
    setReviewing(true)
    setReviewError('')
    setReviewResult(null)

    try {
      const documentText = await reviewFile.text()
      const res = await fetch('/api/pentracore/documents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_text: documentText,
          document_type: reviewType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Review failed')
      setReviewResult(data)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setReviewing(false)
    }
  }

  const statusClass =
    reviewResult?.compliance_status === 'pass'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      : reviewResult?.compliance_status === 'fail'
        ? 'border-red-500/20 bg-red-500/10 text-red-300'
        : 'border-amber-500/20 bg-amber-500/10 text-amber-300'

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

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-white font-semibold">
              <ShieldCheck size={18} className="text-indigo-300" />
              AI compliance review
            </div>
            <div className="text-slate-500 text-sm mt-1">Check NCNDA, KYC, IMFPA, SPA sequencing, signatures, and party separation.</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={reviewType}
              onChange={(e) => setReviewType(e.target.value)}
              className="bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              {DEFAULT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1a] px-3 py-2 text-sm text-slate-300 hover:bg-[#1e293b]">
              <Upload size={16} />
              {reviewFile ? reviewFile.name : 'Upload PDF/DOCX/TXT'}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => setReviewFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              onClick={reviewDocument}
              disabled={!reviewFile || reviewing}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              {reviewing ? 'Reviewing...' : 'Review'}
            </button>
          </div>
        </div>

        {reviewError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{reviewError}</div>
        )}

        {reviewResult && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className={`rounded-lg border px-4 py-3 ${statusClass}`}>
              <div className="text-xs uppercase tracking-wider opacity-80">Status</div>
              <div className="mt-1 text-lg font-semibold uppercase">{reviewResult.compliance_status}</div>
            </div>
            <div className="rounded-lg border border-[#1e293b] bg-[#0a0f1a] px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-slate-500">Missing fields</div>
              <div className="mt-2 space-y-1 text-sm text-slate-300">
                {reviewResult.missing_fields.length ? reviewResult.missing_fields.map(item => <div key={item}>{item}</div>) : <div>None</div>}
              </div>
            </div>
            <div className="rounded-lg border border-[#1e293b] bg-[#0a0f1a] px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-slate-500">Signature gaps</div>
              <div className="mt-2 space-y-1 text-sm text-slate-300">
                {reviewResult.signature_gaps.length ? reviewResult.signature_gaps.map(item => <div key={item}>{item}</div>) : <div>None</div>}
              </div>
            </div>
            <div className="rounded-lg border border-[#1e293b] bg-[#0a0f1a] px-4 py-3 lg:col-span-3">
              <div className="text-xs uppercase tracking-wider text-slate-500">Compliance notes</div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">{reviewResult.compliance_notes}</div>
            </div>
          </div>
        )}
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
