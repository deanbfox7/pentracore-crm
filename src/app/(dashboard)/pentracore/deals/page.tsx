/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DealsIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deals } = await supabase
    .from('deals')
    .select('id, deal_code, stage_index, stage, commodity, grade_spec, volume, price_zar_per_mt, next_action, blocker, probability')
    .eq('owner_id', user.id)
    .order('stage_index', { ascending: true })
    .limit(80)

  return (
    <div className="p-6 max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Deals</h1>
        <p className="text-slate-500 text-sm mt-1">All deal cards with stage, pricing, and execution signals.</p>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs bg-[#0b1220]">
              <th className="py-3 px-4">Deal</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Commodity</th>
              <th className="py-3 px-4">Grade</th>
              <th className="py-3 px-4">Volume</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Next Action</th>
            </tr>
          </thead>
          <tbody>
            {(deals || []).length === 0 ? (
              <tr>
                <td className="py-10 px-4 text-slate-500" colSpan={7}>No deals yet. Import from `MASTER_DEAL_TRACKER.csv`.</td>
              </tr>
            ) : (
              (deals || []).map((d: any) => (
                <tr key={d.id} className="border-t border-[#1e293b]">
                  <td className="py-4 px-4">
                    <Link href={`/pentracore/deals/${d.id}`} className="text-indigo-300 hover:text-indigo-200 transition-colors">
                      {d.deal_code}
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    {d.stage_index} <span className="text-slate-600">•</span> {d.stage}
                  </td>
                  <td className="py-4 px-4 text-slate-300">{d.commodity}</td>
                  <td className="py-4 px-4 text-slate-400">{d.grade_spec || '—'}</td>
                  <td className="py-4 px-4 text-slate-400">{d.volume ?? '—'} MT</td>
                  <td className="py-4 px-4 text-slate-400">{d.price_zar_per_mt ? `ZAR ${d.price_zar_per_mt}/MT` : '—'}</td>
                  <td className="py-4 px-4 text-slate-400">{d.next_action || d.blocker || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

