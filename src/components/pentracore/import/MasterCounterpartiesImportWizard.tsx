'use client'

import { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Upload, AlertCircle } from 'lucide-react'

type Step = 'upload' | 'preview' | 'importing' | 'done'

export default function MasterCounterpartiesImportWizard() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [filename, setFilename] = useState<string>('')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ inserted?: number; filename?: string | null } | null>(null)

  const headerPreview = useMemo(() => Object.keys(rows[0] || {}), [rows])

  function parseFile(file: File) {
    setError(null)
    setFilename(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[]
        setRows(data)
        setStep('preview')
      },
      error: (e) => setError(e.message),
    })
  }

  async function startImport() {
    setStep('importing')
    setResult(null)
    const res = await fetch('/api/pentracore/import/master-counterparties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, filename }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error || 'Import failed')
      setStep('preview')
      return
    }
    setResult({ inserted: data.inserted, filename: data.filename })
    setStep('done')
  }

  return (
    <div className="space-y-4">
      {step === 'upload' && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#1e293b] rounded-xl p-10 text-center cursor-pointer bg-[#111827] hover:border-slate-500 transition-colors"
        >
          <Upload size={32} className="mx-auto text-slate-500 mb-3" />
          <div className="text-white font-semibold mb-1">Upload `MASTER_COUNTERPARTIES.csv`</div>
          <div className="text-slate-500 text-sm">We’ll map each row into `companies` (stage/ACL ready).</div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
          />
        </div>
      )}

      {step === 'preview' && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-white font-medium">{filename || 'Imported file'}</div>
              <div className="text-slate-500 text-sm mt-0.5">{rows.length} rows detected</div>
            </div>
            <button
              className="text-indigo-300 text-xs hover:text-indigo-200"
              onClick={() => { setStep('upload'); setRows([]); setFilename(''); }}
            >
              Change file
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Headers: {headerPreview.length ? headerPreview.slice(0, 10).join(', ') + (headerPreview.length > 10 ? '…' : '') : '—'}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/20 rounded-lg p-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            onClick={startImport}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
            disabled={rows.length === 0}
          >
            Import {rows.length} counterparties →
          </button>
        </div>
      )}

      {step === 'importing' && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-10 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white font-medium mb-1">Importing…</div>
          <div className="text-slate-500 text-sm">This may take a moment.</div>
        </div>
      )}

      {step === 'done' && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-8 text-center">
          <CheckCircle2 size={42} className="text-green-400 mx-auto mb-3" />
          <div className="text-white font-semibold text-lg mb-1">Import complete</div>
          <div className="text-slate-500 text-sm">
            Inserted {result?.inserted ?? 0} companies.
          </div>
          <button
            className="mt-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
            onClick={() => router.push('/pentracore/executive')}
          >
            View executive dashboard →
          </button>
        </div>
      )}
    </div>
  )
}

