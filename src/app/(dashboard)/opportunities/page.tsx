import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OPPORTUNITY_STAGES } from '@/lib/crm/stageRules'
// Using inferred Supabase types instead of Opportunity

export default async function OpportunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, stage, commodity, target_price, expected_close_date, estimated_margin')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  const rows = opportunities || []

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-white">Opportunities</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track deals from qualification through contract close</p>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1420] text-slate-400">
            <tr>
              <th className="text-left font-medium px-4 py-3">Title</th>
              <th className="text-left font-medium px-4 py-3">Commodity</th>
              <th className="text-left font-medium px-4 py-3">Stage</th>
              <th className="text-left font-medium px-4 py-3">Target Price</th>
              <th className="text-left font-medium px-4 py-3">Expected Close</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="px-4 py-8 text-slate-500" colSpan={5}>No opportunities yet.</td></tr>
            )}
            {rows.map((opp) => (
              <tr key={opp.id} className="border-t border-[#1e293b]">
                <td className="px-4 py-3 text-slate-100">{opp.title}</td>
                <td className="px-4 py-3 text-slate-300">{opp.commodity}</td>
                <td className="px-4 py-3 text-indigo-300 capitalize">{opp.stage.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-slate-300">{opp.target_price ? `$${opp.target_price}` : '-'}</td>
                <td className="px-4 py-3 text-slate-300">{opp.expected_close_date || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Valid stages: {OPPORTUNITY_STAGES.join(' -> ')}
      </div>
    </div>
  )
}
