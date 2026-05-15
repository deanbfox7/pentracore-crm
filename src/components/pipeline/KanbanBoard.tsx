'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lead } from '@/types'
import { STAGES, stageColor, scoreColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={cn('bg-[#0d1420] border border-[#1e293b] rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow select-none',
        isDragging && 'opacity-50')}>
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{lead.first_name} {lead.last_name}</p>
          <p className="text-slate-500 text-xs truncate">{lead.company_name}</p>
        </div>
        {lead.lead_score > 0 && (
          <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ml-2', scoreColor(lead.lead_score))}>{lead.lead_score}</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-500 text-xs">{lead.country}</span>
        {(lead.commodities_of_interest || []).slice(0, 1).map(c => (
          <span key={c} className="bg-indigo-500/10 text-indigo-300 text-xs px-1.5 py-0.5 rounded">{c}</span>
        ))}
        {lead.estimated_deal_value && (
          <span className="text-green-400 text-xs ml-auto">${(lead.estimated_deal_value / 1000).toFixed(0)}k</span>
        )}
      </div>
      <Link href={`/leads/${lead.id}`} className="block mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors" onClick={e => e.stopPropagation()}>
        View →
      </Link>
    </div>
  )
}

export default function KanbanBoard({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const supabase = createClient()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const byStage = (stageId: string) => leads.filter(l => l.stage === stageId)

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string) }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return
    const overId = over.id as string
    const overStage = STAGES.find(s => s.id === overId)?.id || leads.find(l => l.id === overId)?.stage
    if (!overStage) return
    const activeLead = leads.find(l => l.id === active.id)
    if (!activeLead || activeLead.stage === overStage) return
    setLeads(prev => prev.map(l => l.id === active.id ? { ...l, stage: overStage as Lead['stage'] } : l))
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active } = e
    setActiveId(null)
    const lead = leads.find(l => l.id === active.id)
    if (!lead) return
    const original = initialLeads.find(l => l.id === active.id)
    if (original && original.stage !== lead.stage) {
      await supabase.from('leads').update({ stage: lead.stage }).eq('id', lead.id)
      await supabase.from('activities').insert({
        lead_id: lead.id, type: 'stage_change',
        subject: 'Stage changed', body: `${original.stage} → ${lead.stage}`
      })
    }
  }

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageLeads = byStage(stage.id)
          return (
            <div key={stage.id} className="flex-shrink-0 w-56" id={stage.id}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', stageColor(stage.id))}>{stage.label}</span>
                <span className="text-slate-600 text-xs ml-auto">{stageLeads.length}</span>
              </div>
              <SortableContext items={stageLeads.map(l => l.id)} strategy={verticalListSortingStrategy} id={stage.id}>
                <div className="bg-[#0a0f1a] border border-[#1e293b] rounded-xl p-2 min-h-32 space-y-2">
                  {stageLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} isDragging={lead.id === activeId} />
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="text-center py-8 text-slate-700 text-xs">Drop here</div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} />}
      </DragOverlay>
    </DndContext>
  )
}
