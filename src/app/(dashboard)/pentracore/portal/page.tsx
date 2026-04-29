import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StakeholderPortalClient from '@/components/pentracore/portal/StakeholderPortalClient'

export default async function StakeholderPortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const profileRole = profile?.role || 'viewer'

  const [
    { data: deals },
    { data: participants },
    { data: tasks },
  ] = await Promise.all([
    supabase
      .from('deals')
      .select('id, deal_code, stage_index, stage, commodity, volume, estimated_gmv, estimated_commission, probability, next_action, blocker, origin_region')
      .eq('owner_id', user.id)
      .order('stage_index', { ascending: true }),

    supabase
      .from('deal_participants')
      .select('role, deal:deals(id, deal_code, stage_index, probability), company:companies(name)')
      .eq('owner_id', user.id),

    supabase
      .from('deal_tasks')
      .select('id, title, due_at, priority, status, deal:deals(deal_code)')
      .eq('owner_id', user.id),
  ])

  return (
    <StakeholderPortalClient
      profileRole={profileRole}
      deals={(deals || []) as any}
      participants={(participants || []).map((p: any) => ({
        deal_code: p.deal?.deal_code,
        deal_id: p.deal?.id,
        role: p.role,
        company_name: p.company?.name,
        stage_index: p.deal?.stage_index,
        probability: p.deal?.probability,
      })) as any}
      tasks={(tasks || []) as any}
    />
  )
}

