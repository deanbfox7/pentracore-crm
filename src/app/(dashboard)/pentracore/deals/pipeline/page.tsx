import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DealKanbanBoard from '@/components/pentracore/deals/DealKanbanBoard'

export default async function DealPipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deals } = await supabase
    .from('deals')
    .select('id, deal_code, stage, stage_index, commodity, grade_spec, next_action, blocker, probability, volume')
    .eq('owner_id', user.id)
    .order('stage_index', { ascending: true })

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Deal Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">
            Drag deals between pipeline stages. Stage moves are enforced server-side (no skipping).
          </p>
        </div>
      </div>

      <DealKanbanBoard initialDeals={(deals || []) as any} />
    </div>
  )
}

