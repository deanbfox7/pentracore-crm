// ============================================
// UTILITIES: Formatting, validation, calculations
// ============================================

import { DealStage } from '@/lib/types'

// Formatting
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatDate = (date: string | Date): string => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Deal stage helpers
export const stageOrder: Record<DealStage, number> = {
  inquiry: 1,
  ncnda: 2,
  kyc: 3,
  imfpa: 4,
  spa: 5,
  settlement: 6,
}

export const stageLabel: Record<DealStage, string> = {
  inquiry: 'Inquiry',
  ncnda: 'NCNDA',
  kyc: 'KYC',
  imfpa: 'IMFPA',
  spa: 'SPA',
  settlement: 'Settlement',
}

export const stageColor: Record<DealStage, string> = {
  inquiry: '#f39c12',
  ncnda: '#9b59b6',
  kyc: '#3498db',
  imfpa: '#e67e22',
  spa: '#27ae60',
  settlement: '#2ecc71',
}

export const getNextStage = (current: DealStage): DealStage | null => {
  const stages: DealStage[] = ['inquiry', 'ncnda', 'kyc', 'imfpa', 'spa', 'settlement']
  const currentIndex = stages.indexOf(current)
  return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null
}

// Validation
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  return /^\+?[\d\s\-()]{10,}$/.test(phone)
}

export const isValidCurrency = (value: any): boolean => {
  const num = parseFloat(value)
  return !isNaN(num) && num >= 0
}

// Commission calculations
export const calculateCommission = (dealValue: number, percentage: number = 2.5): number => {
  return dealValue * (percentage / 100)
}

export const calculateSplit = (commission: number, split: number = 50): number => {
  return commission * (split / 100)
}

export const calculateTotalValue = (tonnage: number, pricePerUnit: number): number => {
  return tonnage * pricePerUnit
}

// KYC Status
export const kycStatusBadge = (status: string): { color: string; label: string } => {
  const badges: Record<string, { color: string; label: string }> = {
    pending: { color: '#95a5a6', label: 'Pending' },
    in_progress: { color: '#f39c12', label: 'In Progress' },
    approved: { color: '#27ae60', label: 'Approved' },
    rejected: { color: '#e74c3c', label: 'Rejected' },
  }
  return badges[status] || badges.pending
}

// Lead status
export const leadStatusBadge = (status: string): { color: string; label: string } => {
  const badges: Record<string, { color: string; label: string }> = {
    new: { color: '#3498db', label: 'New' },
    contacted: { color: '#f39c12', label: 'Contacted' },
    qualified: { color: '#9b59b6', label: 'Qualified' },
    proposal: { color: '#2980b9', label: 'Proposal' },
    closed: { color: '#27ae60', label: 'Closed' },
    lost: { color: '#e74c3c', label: 'Lost' },
  }
  return badges[status] || badges.new
}

// Deal metrics
export const calculateDaysToClose = (createdAt: string, closedAt?: string): number => {
  const start = new Date(createdAt)
  const end = closedAt ? new Date(closedAt) : new Date()
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export const calculateProgress = (stage: DealStage): number => {
  return (stageOrder[stage] / 6) * 100
}

// String utilities
export const truncate = (str: string, length: number = 50): string => {
  return str.length > length ? `${str.substring(0, length)}...` : str
}

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
}

// Array utilities
export const groupBy = <T extends Record<string, any>>(arr: T[], key: keyof T) => {
  return arr.reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<any, T[]>)
}

export const sortBy = <T extends Record<string, any>>(arr: T[], key: keyof T, desc = false) => {
  return [...arr].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })
}

// Data validation
export interface ValidationError {
  field: string
  message: string
}

export const validateDealData = (data: any): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.commodity || data.commodity.trim() === '') {
    errors.push({ field: 'commodity', message: 'Commodity is required' })
  }

  if (!data.tonnage || data.tonnage <= 0) {
    errors.push({ field: 'tonnage', message: 'Tonnage must be greater than 0' })
  }

  if (!data.price_per_unit || data.price_per_unit <= 0) {
    errors.push({ field: 'price_per_unit', message: 'Price must be greater than 0' })
  }

  if (!data.total_value || data.total_value <= 0) {
    errors.push({ field: 'total_value', message: 'Total value must be greater than 0' })
  }

  return errors
}

export const validateLeadData = (data: any): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.first_name || data.first_name.trim() === '') {
    errors.push({ field: 'first_name', message: 'First name is required' })
  }

  if (!data.last_name || data.last_name.trim() === '') {
    errors.push({ field: 'last_name', message: 'Last name is required' })
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }

  return errors
}

// Export helpers
export const downloadJSON = (data: any, filename: string) => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] || '')).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
