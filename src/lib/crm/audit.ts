import { createClient } from '@/lib/supabase/server'

type AuditEvent = {
  ownerId: string
  actorId?: string
  entityType: string
  entityId?: string
  action: string
  payload?: Record<string, unknown>
}

export async function logAuditEvent(event: AuditEvent) {
  const supabase = await createClient()
  await supabase.from('audit_logs').insert({
    owner_id: event.ownerId,
    actor_id: event.actorId || event.ownerId,
    entity_type: event.entityType,
    entity_id: event.entityId || null,
    action: event.action,
    payload: event.payload || {},
  })
}
