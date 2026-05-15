'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { Upload, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'

const DB_FIELDS = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'last_name', label: 'Last Name', required: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company_name', label: 'Company Name', required: true },
  { key: 'company_website', label: 'Company Website' },
  { key: 'industry', label: 'Industry' },
  { key: 'company_size', label: 'Company Size' },
  { key: 'country', label: 'Country', required: true },
  { key: 'city', label: 'City' },
  { key: 'commodities_of_interest', label: 'Commodities (comma-separated)' },
  { key: 'estimated_volume', label: 'Estimated Volume' },
  { key: 'estimated_deal_value', label: 'Deal Value' },
  { key: 'notes', label: 'Notes' },
  { key: 'linkedin_url', label: 'LinkedIn URL' },
]

type Step = 'upload' | 'map' | 'importing' | 'done'

export default function ImportWizard() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [filename, setFilename] = useState('')
  const [result, setResult] = useState({ imported: 0, duplicates: 0, failed: 0 })
  const [dragging, setDragging] = useState(false)

  function processFile(file: File) {
    setFilename(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[]
        const h = Object.keys(data[0] || {})
        setHeaders(h)
        setRows(data)
        // Auto-map common LinkedIn/Apollo column names
        const autoMap: Record<string, string> = {}
        h.forEach(header => {
          const lower = header.toLowerCase()
          if (lower.includes('first') && lower.includes('name')) autoMap['first_name'] = header
          else if (lower.includes('last') && lower.includes('name')) autoMap['last_name'] = header
          else if (lower.includes('email')) autoMap['email'] = header
          else if (lower.includes('phone') || lower.includes('mobile')) autoMap['phone'] = header
          else if (lower.includes('company') && !lower.includes('size') && !lower.includes('website')) autoMap['company_name'] = header
          else if (lower.includes('website') || lower.includes('url') && lower.includes('company')) autoMap['company_website'] = header
          else if (lower.includes('industry')) autoMap['industry'] = header
          else if (lower.includes('country') || lower.includes('location')) autoMap['country'] = header
          else if (lower.includes('city')) autoMap['city'] = header
          else if (lower.includes('linkedin')) autoMap['linkedin_url'] = header
          else if (lower.includes('commodity') || lower.includes('commodit')) autoMap['commodities_of_interest'] = header
          else if (lower.includes('note')) autoMap['notes'] = header
        })
        setMapping(autoMap)
        setStep('map')
      }
    })
  }

  async function startImport() {
    setStep('importing')
    const res = await fetch('/api/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, mapping, filename })
    })
    const data = await res.json()
    setResult({ imported: data.imported || 0, duplicates: data.duplicates || 0, failed: data.failed || 0 })
    setStep('done')
  }

  return (
    <div>
      {/* Steps Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(['upload', 'map', 'importing', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              step === s ? 'bg-indigo-500 text-white' :
              ['upload', 'map', 'importing', 'done'].indexOf(step) > i ? 'bg-green-500/20 text-green-400' :
              'bg-[#1e293b] text-slate-500'
            }`}>{i + 1}</div>
            <span className={`text-sm capitalize ${step === s ? 'text-white' : 'text-slate-500'}`}>{s === 'map' ? 'Map Columns' : s.charAt(0).toUpperCase() + s.slice(1)}</span>
            {i < 3 && <ChevronRight size={14} className="text-slate-600" />}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-[#1e293b] hover:border-slate-500 bg-[#111827]'
          }`}
        >
          <Upload size={32} className="mx-auto text-slate-500 mb-3" />
          <p className="text-white font-medium mb-1">Drop your CSV or Excel file here</p>
          <p className="text-slate-500 text-sm">Supports LinkedIn Sales Navigator exports, Apollo.io exports, and any CSV</p>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
        </div>
      )}

      {step === 'map' && (
        <div>
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 mb-4">
            <p className="text-slate-400 text-sm mb-1">File: <span className="text-white">{filename}</span></p>
            <p className="text-slate-400 text-sm">{rows.length} rows detected</p>
          </div>

          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 mb-4">
            <h2 className="text-sm font-medium text-white mb-4">Map your CSV columns to CRM fields</h2>
            <div className="grid grid-cols-2 gap-3">
              {DB_FIELDS.map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-40 shrink-0">
                    <span className="text-sm text-slate-300">{field.label}</span>
                    {field.required && <span className="text-red-400 ml-1 text-xs">*</span>}
                  </div>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="flex-1 bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Skip --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 mb-4 overflow-x-auto">
            <h2 className="text-sm font-medium text-white mb-3">Preview (first 3 rows)</h2>
            <table className="text-xs w-full">
              <thead><tr>{headers.map(h => <th key={h} className="text-left text-slate-500 py-1 pr-4">{h}</th>)}</tr></thead>
              <tbody>{rows.slice(0, 3).map((row, i) => (
                <tr key={i}>{headers.map(h => <td key={h} className="text-slate-400 py-1 pr-4 max-w-32 truncate">{row[h]}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>

          <button onClick={startImport}
            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors">
            Import {rows.length} Leads →
          </button>
        </div>
      )}

      {step === 'importing' && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-12 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Importing {rows.length} leads...</p>
          <p className="text-slate-500 text-sm mt-1">This may take a moment</p>
        </div>
      )}

      {step === 'done' && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-8 text-center">
          <CheckCircle2 size={40} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-white font-semibold text-lg mb-4">Import Complete</h2>
          <div className="flex justify-center gap-6 mb-6">
            <div><div className="text-2xl font-bold text-green-400">{result.imported}</div><div className="text-slate-500 text-sm">Imported</div></div>
            <div><div className="text-2xl font-bold text-yellow-400">{result.duplicates}</div><div className="text-slate-500 text-sm">Duplicates skipped</div></div>
            <div><div className="text-2xl font-bold text-red-400">{result.failed}</div><div className="text-slate-500 text-sm">Failed</div></div>
          </div>
          <button onClick={() => router.push('/leads')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors">
            View Leads
          </button>
        </div>
      )}
    </div>
  )
}
