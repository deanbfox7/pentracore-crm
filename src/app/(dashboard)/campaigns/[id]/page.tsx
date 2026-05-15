import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CampaignDetailClient from './CampaignDetailClient'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [campResult, leadsResult] = await Promise.all([
    supabase.from('campaigns').select('*, steps:campaign_steps(*), enrollments:campaign_enrollments(*, lead:leads(id, first_name, last_name, company_name, email, stage))').eq('id', id).eq('owner_id', user!.id).single(),
    supabase.from('leads').select('id, first_name, last_name, company_name, email').eq('owner_id', user!.id).order('company_name')
  ])

  if (!campResult.data) notFound()

  return <CampaignDetailClient campaign={campResult.data} leads={leadsResult.data || []} />
}
