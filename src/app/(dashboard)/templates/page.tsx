import { createClient } from '@/lib/supabase/server'
import TemplatesClient from './TemplatesClient'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: templates } = await supabase.from('email_templates').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false })

  return <TemplatesClient templates={templates || []} />
}
