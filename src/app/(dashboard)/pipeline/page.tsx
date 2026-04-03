import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/pipeline/KanbanBoard'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: leads } = await supabase
    .from('leads')
    .select('id, first_name, last_name, company_name, country, stage, lead_score, commodities_of_interest, estimated_deal_value, email')
    .eq('owner_id', user!.id)
    .order('lead_score', { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-white">Pipeline</h1>
        <p className="text-slate-500 text-sm mt-0.5">Drag leads between stages to update their status</p>
      </div>
      <KanbanBoard leads={(leads || []) as any} />
    </div>
  )
}
