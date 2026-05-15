'use client'

import { useState } from 'react'
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function DocumentUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<string>('NCNDA')
  const [name, setName] = useState<string>('')
  const [linkedDealCode, setLinkedDealCode] = useState<string>('')
  const [visibilityStageIndex, setVisibilityStageIndex] = useState<number>(2)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setError('Please choose a file.')
    setError(null)
    setStatus('uploading')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('docType', docType)
    formData.append('name', name)
    formData.append('linkedDealCode', linkedDealCode)
    formData.append('visibilityStageIndex', String(visibilityStageIndex))

    const res = await fetch('/api/pentracore/documents/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data?.error || 'Upload failed')
      setStatus('idle')
      return
    }

    setStatus('done')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-2 bg-[#111827] border border-[#1e293b] rounded-xl px-3 py-2 cursor-pointer hover:border-slate-500 transition-colors">
          <Upload size={16} className="text-slate-400" />
          <span className="text-slate-300 text-sm">{file ? file.name : 'Choose file'}</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-slate-400">Doc type</div>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            {['NCNDA', 'IMFPA', 'LOI', 'SCO', 'FCO', 'ICPO', 'POF', 'BCL', 'Assay', 'COA', 'BL', 'EUC', 'SPA', 'Other'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-400">Visibility unlock stage (min stage_index)</div>
          <input
            type="number"
            min={1}
            max={11}
            value={visibilityStageIndex}
            onChange={(e) => setVisibilityStageIndex(Number(e.target.value))}
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-slate-400">Display name (optional)</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., RB3 lab report 17.03.2026"
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-400">Linked deal code (optional)</div>
          <input
            value={linkedDealCode}
            onChange={(e) => setLinkedDealCode(e.target.value)}
            placeholder="e.g., CHR-CONC-12M-001"
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/20 rounded-lg p-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {status === 'uploading' ? (
        <button
          type="button"
          className="w-full bg-indigo-500/70 cursor-not-allowed text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Loader2 size={16} className="animate-spin" /> Uploading…
        </button>
      ) : status === 'done' ? (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-400" />
          <div>
            <div className="text-white font-medium">Upload complete</div>
            <div className="text-slate-500 text-sm">Document is stored and linked in your Deal Intelligence schema.</div>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
        >
          Upload document →
        </button>
      )}
    </form>
  )
}

