import { createClient } from '@/lib/supabase/server'
import CampaignsClient from './CampaignsClient'

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, steps:campaign_steps(count), enrollments:campaign_enrollments(count)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  return <CampaignsClient campaigns={campaigns || []} />
}
