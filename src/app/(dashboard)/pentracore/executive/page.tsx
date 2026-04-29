import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExecutiveDashboardClient from '@/components/pentracore/executive/ExecutiveDashboardClient'

export default async function PentraCoreExecutivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deals } = await supabase
    .from('deals')
    .select(`
      deal_code,
      stage,
      stage_index,
      commodity,
      volume,
      estimated_gmv,
      estimated_commission,
      probability,
      next_action,
      blocker,
      origin_region,
      origin_country
    `)
    .eq('owner_id', user.id)
    .order('stage_index', { ascending: true })

  const { data: tasks } = await supabase
    .from('deal_tasks')
    .select(`
      id,
      title,
      due_at,
      priority,
      status,
      deal:deals(deal_code)
    `)
    .eq('owner_id', user.id)
    .order('due_at', { ascending: true, nullsFirst: false })

  const { data: investorRows } = await supabase
    .from('deal_participants')
    .select(`
      deal:deals(deal_code, commodity, estimated_gmv, estimated_commission, probability, stage_index),
      investor_company:companies(name)
    `)
    .eq('owner_id', user.id)
    .eq('role', 'investor')

  return (
    <ExecutiveDashboardClient
      deals={(deals || []) as any}
      tasks={(tasks || []) as any}
      investorRows={(investorRows || []) as any}
    />
  )
}

