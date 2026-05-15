'use client'

import { useState } from 'react'
import { Copy, MessageSquareText, X } from 'lucide-react'

type Prospect = {
  id: string
  name: string
  email: string
  phone: string
  commodity: string
  country: string
}

type Drafts = {
  email: string
  whatsapp: string
  sms: string
}

export default function SalesBotClient({ prospects }: { prospects: Prospect[] }) {
  const [selected, setSelected] = useState<Prospect | null>(null)
  const [drafts, setDrafts] = useState<Drafts | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function generateOutreach(prospect: Prospect) {
    setLoadingId(prospect.id)
    setError('')
    setSelected(prospect)
    setDrafts(null)

    try {
      const res = await fetch('/api/sales-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Outreach generation failed')
      setDrafts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Outreach generation failed')
    } finally {
      setLoadingId(null)
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Dean&apos;s Sales Bot</h1>
          <p className="mt-1 text-sm text-slate-500">Generate compliant first-touch copy from CRM leads.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0b1220] text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Prospect</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Commodity</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {prospects.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-slate-500" colSpan={5}>No CRM leads available.</td>
                </tr>
              ) : prospects.map((prospect) => (
                <tr key={prospect.id} className="text-slate-300">
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{prospect.name}</div>
                    <div className="text-xs text-slate-500">{prospect.id}</div>
                  </td>
                  <td className="px-4 py-4">{prospect.country || 'Unknown'}</td>
                  <td className="px-4 py-4">{prospect.commodity || 'Minerals'}</td>
                  <td className="px-4 py-4">
                    <div>{prospect.email || 'No email'}</div>
                    <div className="text-xs text-slate-500">{prospect.phone || 'No phone'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => generateOutreach(prospect)}
                      disabled={loadingId === prospect.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                    >
                      <MessageSquareText size={14} />
                      {loadingId === prospect.id ? 'Generating...' : 'Generate Outreach'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#1e293b] bg-[#111827] p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Outreach for {selected.name}</div>
                <div className="text-sm text-slate-500">{selected.commodity} • {selected.country}</div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-[#1e293b]">
                <X size={18} />
              </button>
            </div>

            {error && <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
            {!drafts && !error && <div className="text-sm text-slate-500">Generating drafts...</div>}

            {drafts && (
              <div className="space-y-3">
                {([
                  ['Email', drafts.email],
                  ['WhatsApp', drafts.whatsapp],
                  ['SMS', drafts.sms],
                ] as const).map(([label, text]) => (
                  <div key={label} className="rounded-lg border border-[#1e293b] bg-[#0a0f1a] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-white">{label}</div>
                      <button
                        type="button"
                        onClick={() => copyText(text)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#1e293b] px-2 py-1 text-xs text-slate-300 hover:bg-[#1e293b]"
                      >
                        <Copy size={13} />
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">{text}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
