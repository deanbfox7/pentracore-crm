'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Shield } from 'lucide-react'

type Deal = {
  id: string
  deal_code: string
  stage: string
  stage_index: number
  commodity: string
  grade_spec?: string | null
  next_action?: string | null
  blocker?: string | null
  probability?: number | null
  volume?: number | null
}

const STAGES: { index: number; label: string; color: string; bg: string }[] = [
  { index: 1, label: 'Inquiry', color: 'text-slate-300', bg: 'bg-slate-500/20' },
  { index: 2, label: 'NCNDA', color: 'text-indigo-300', bg: 'bg-indigo-500/20' },
  { index: 3, label: 'KYC+Sanctions', color: 'text-yellow-300', bg: 'bg-yellow-500/20' },
  { index: 4, label: 'Soft Offer', color: 'text-purple-300', bg: 'bg-purple-500/20' },
  { index: 5, label: 'Hard Offer', color: 'text-cyan-300', bg: 'bg-cyan-500/20' },
  { index: 6, label: 'SPA', color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
  { index: 7, label: 'Banking', color: 'text-indigo-200', bg: 'bg-indigo-500/20' },
  { index: 8, label: 'Inspection', color: 'text-indigo-300', bg: 'bg-indigo-500/20' },
  { index: 9, label: 'Logistics', color: 'text-orange-300', bg: 'bg-orange-500/20' },
  { index: 10, label: 'Payment', color: 'text-green-300', bg: 'bg-green-500/20' },
  { index: 11, label: 'Nurture', color: 'text-slate-300', bg: 'bg-slate-500/20' },
]

function stageByIndex(stageIndex: number) {
  return STAGES.find(s => s.index === stageIndex) || STAGES[0]
}

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const stage = stageByIndex(deal.stage_index)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-[#0b1220] border border-[#1e293b] rounded-xl p-3 cursor-grab active:cursor-grabbing transition-shadow select-none',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="text-white text-sm font-medium truncate">{deal.deal_code}</div>
          <div className="text-slate-500 text-xs mt-1 truncate">{deal.commodity}</div>
        </div>
        <div className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0', stage.bg, stage.color)}>
          {deal.stage_index}
        </div>
      </div>

      {deal.grade_spec && (
        <div className="text-slate-400 text-xs mb-2 line-clamp-1">{deal.grade_spec}</div>
      )}

      {deal.blocker ? (
        <div className="text-red-300 text-xs flex items-center gap-1">
          <AlertTriangle size={14} /> {deal.blocker}
        </div>
      ) : deal.next_action ? (
        <div className="text-slate-300 text-xs flex items-center gap-1">
          <Shield size={14} className="text-indigo-200" /> {deal.next_action}
        </div>
      ) : (
        <div className="text-slate-600 text-xs">No next action set.</div>
      )}

      <div className="mt-3">
        <Link
          href={`/pentracore/deals/${deal.id}`}
          className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 text-xs transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          View <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

export default function DealKanbanBoard({ initialDeals }: { initialDeals: Deal[] }) {
  const [deals, setDeals] = useState(initialDeals)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const dealsByStage = useMemo(() => {
    const map: Record<number, Deal[]> = {}
    STAGES.forEach(s => (map[s.index] = []))
    deals.forEach(d => {
      const idx = Number(d.stage_index || 1)
      ;(map[idx] ||= []).push(d)
    })
    return map
  }, [deals])

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string)
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return

    const overId = String(over.id)
    const matchStage = STAGES.find(s => String(s.index) === overId)
    if (!matchStage) return

    setDeals(prev =>
      prev.map(d => (d.id === active.id ? { ...d, stage_index: matchStage.index, stage: d.stage } : d))
    )
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    if (!over) return

    const activeDeal = deals.find(d => d.id === active.id)
    const originalDeal = initialDeals.find(d => d.id === active.id)
    if (!activeDeal || !originalDeal) return

    const overId = String(over.id)
    const targetStage = STAGES.find(s => String(s.index) === overId)
    if (!targetStage) return

    const currentIndex = Number(originalDeal.stage_index || 1)
    const newIndex = targetStage.index
    if (newIndex === currentIndex) return

    const res = await fetch(`/api/pentracore/deals/${activeDeal.id}/move-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStageIndex: newIndex }),
    })

    if (!res.ok) {
      // Revert UI if server rejected the stage move
      setDeals(initialDeals)
      return
    }

    const data = await res.json()
    const updated = data?.deal as Deal | undefined
    if (updated) {
      setDeals(prev => prev.map(d => (d.id === updated.id ? { ...d, ...updated } : d)))
    }
  }

  const activeDeal = activeId ? deals.find(d => d.id === activeId) || null : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageDeals = dealsByStage[stage.index] || []
          return (
            <div key={stage.index} className="flex-shrink-0 w-72" id={String(stage.index)}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', stage.bg, stage.color)}>{stage.label}</span>
                <span className="text-slate-600 text-xs ml-auto">{stageDeals.length}</span>
              </div>
              <SortableContext items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy} id={String(stage.index)}>
                <div className="bg-[#0a0f1a] border border-[#1e293b] rounded-xl p-2 min-h-40">
                  {stageDeals.length === 0 ? (
                    <div className="text-center py-8 text-slate-700 text-xs">Drop here</div>
                  ) : (
                    <div className="space-y-2">
                      {stageDeals.map(d => (
                        <DealCard key={d.id} deal={d} isDragging={d.id === activeId} />
                      ))}
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
      <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}</DragOverlay>
    </DndContext>
  )
}

