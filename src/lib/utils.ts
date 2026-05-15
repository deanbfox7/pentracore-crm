import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-400 bg-green-400/10'
  if (score >= 50) return 'text-yellow-400 bg-yellow-400/10'
  if (score >= 25) return 'text-orange-400 bg-orange-400/10'
  return 'text-red-400 bg-red-400/10'
}

export function stageColor(stage: string): string {
  const map: Record<string, string> = {
    new: 'bg-slate-500/20 text-slate-300',
    contacted: 'bg-blue-500/20 text-blue-300',
    interested: 'bg-yellow-500/20 text-yellow-300',
    negotiating: 'bg-purple-500/20 text-purple-300',
    closed_won: 'bg-green-500/20 text-green-300',
    closed_lost: 'bg-red-500/20 text-red-300',
  }
  return map[stage] || 'bg-slate-500/20 text-slate-300'
}

export const STAGES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'interested', label: 'Interested' },
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'closed_won', label: 'Closed Won' },
  { id: 'closed_lost', label: 'Closed Lost' },
]

export const COMMODITIES = [
  'Manganese', 'Chrome', 'Iron Ore', 'Coal', 'Copper',
  'Gold', 'Platinum', 'Diamonds', 'Cobalt', 'Nickel',
  'Zinc', 'Lead', 'Bauxite', 'Titanium', 'Vanadium'
]

export const INDUSTRIES = [
  'Steel Manufacturing', 'Mining & Extraction', 'Construction',
  'Energy & Power', 'Chemical Processing', 'Trading & Brokerage',
  'Infrastructure Development', 'Automotive Manufacturing',
  'Electronics Manufacturing', 'Government / State Entity', 'Other'
]
