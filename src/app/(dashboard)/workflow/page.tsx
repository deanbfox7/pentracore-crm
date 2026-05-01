import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// Using inferred Supabase types

export default async function WorkflowPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [rfqResult, quoteResult, contractResult] = await Promise.all([
    supabase.from('rfqs').select('id, status, deadline_date, opportunity:opportunities(title)').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('quotes').select('id, price, currency, status, rfq:rfqs(id)').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('contracts').select('id, counterparty, value, currency, lifecycle_status').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  const rfqs = rfqResult.data || []
  const quotes = quoteResult.data || []
  const contracts = contractResult.data || []

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">RFQ / Quote / Contract Workflow</h1>
        <p className="text-slate-500 text-sm mt-0.5">Monitor commercial execution across commodities deals</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-white font-medium mb-3">RFQs ({rfqs.length})</h2>
          <div className="space-y-2 text-sm">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="rounded-lg bg-[#0d1420] border border-[#1e293b] px-3 py-2">
                <div className="text-slate-100">{((rfq.opportunity as unknown as { title?: string }[] | null)?.[0]?.title) || 'Opportunity'}</div>
                <div className="text-xs text-slate-400">Status: {rfq.status}</div>
              </div>
            ))}
            {rfqs.length === 0 && <p className="text-slate-500">No RFQs yet.</p>}
          </div>
        </section>

        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-white font-medium mb-3">Quotes ({quotes.length})</h2>
          <div className="space-y-2 text-sm">
            {quotes.map((quote) => (
              <div key={quote.id} className="rounded-lg bg-[#0d1420] border border-[#1e293b] px-3 py-2">
                <div className="text-slate-100">{quote.currency} {quote.price}</div>
                <div className="text-xs text-slate-400">Status: {quote.status}</div>
              </div>
            ))}
            {quotes.length === 0 && <p className="text-slate-500">No quotes yet.</p>}
          </div>
        </section>

        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-white font-medium mb-3">Contracts ({contracts.length})</h2>
          <div className="space-y-2 text-sm">
            {contracts.map((contract) => (
              <div key={contract.id} className="rounded-lg bg-[#0d1420] border border-[#1e293b] px-3 py-2">
                <div className="text-slate-100">{contract.counterparty}</div>
                <div className="text-xs text-slate-400">{contract.currency} {contract.value} · {contract.lifecycle_status}</div>
              </div>
            ))}
            {contracts.length === 0 && <p className="text-slate-500">No contracts yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
