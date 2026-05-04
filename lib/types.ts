// ============================================
// PENTRACORE CRM: TYPE DEFINITIONS
// Comprehensive TypeScript types for entire system
// ============================================

// Auth
export interface User {
  id: string
  email: string
  user_metadata?: Record<string, any>
}

export interface Session {
  access_token: string
  refresh_token?: string
  user: User
}

// Knowledge Base
export interface Product {
  id: number
  name: string
  category: string
  description: string
  specs?: Record<string, any>
  certifications?: string[]
  pricing_per_unit: number
  unit: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: number
  name: string
  description: string
  process_steps: string[]
  timeline_days: number
  created_at: string
  updated_at: string
}

export interface Process {
  id: number
  name: string
  stage_order: number
  description: string
  requirements: string[]
  timeline_days: number
  created_at: string
  updated_at: string
}

export interface Policy {
  id: number
  name: string
  category: string
  content: string
  version: number
  effective_date: string
  created_at: string
  updated_at: string
}

export interface FAQ {
  id: number
  question: string
  answer: string
  category: string
  audience: string
  created_at: string
  updated_at: string
}

// CRM
export interface Lead {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company?: string
  role?: string
  lead_source?: string
  lead_status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed' | 'lost'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: number
  lead_id: number
  title: string
  description?: string
  commodity: string
  tonnage: number
  stage: DealStage
  expected_value?: number
  expected_commission?: number
  probability_pct: number
  close_date?: string
  created_at: string
  updated_at: string
}

export type DealStage = 'inquiry' | 'loi_draft' | 'loi_sent' | 'ncnda_signed' | 'kyc_approved' | 'imfpa_signed' | 'spa_signed' | 'closed_won' | 'closed_lost'

export interface Counterparty {
  id: number
  name: string
  type: 'buyer' | 'seller' | 'broker' | 'logistics'
  country?: string
  contact_person?: string
  email?: string
  phone?: string
  kyc_status: 'pending' | 'in_progress' | 'approved' | 'rejected'
  kyc_verified_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: number
  opportunity_id?: number
  buyer_id: number
  seller_id: number
  commodity: string
  tonnage: number
  price_per_unit: number
  total_value: number
  stage: DealStage
  ncnda_signed_date?: string
  kyc_approved_date?: string
  imfpa_signed_date?: string
  spa_signed_date?: string
  expected_commission: number
  commission_received?: number
  commission_received_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface DealTimeline {
  id: number
  deal_id: number
  stage: DealStage
  status?: string
  notes?: string
  event_date: string
  created_at: string
}

export interface DealDocument {
  id: number
  deal_id: number
  document_type: 'ncnda' | 'kyc' | 'imfpa' | 'spa' | 'other'
  file_path: string
  signed_date?: string
  created_at: string
}

export interface ContactHistory {
  id: number
  lead_id: number
  contact_type: 'email' | 'phone' | 'meeting' | 'note'
  note?: string
  contact_date: string
  created_at: string
}

export interface TaskLog {
  id: number
  lead_id: number
  task_title: string
  due_date?: string
  completed: boolean
  completed_date?: string
  created_at: string
  updated_at: string
}

export interface Referral {
  id: number
  opportunity_id?: number
  referred_to: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  referral_date: string
  outcome?: string
  created_at: string
}

// API Request/Response Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  per_page: number
}

export interface CreateLeadRequest {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company?: string
  role?: string
  lead_source?: string
  notes?: string
}

export interface CreateOpportunityRequest {
  lead_id: number
  title: string
  description?: string
  commodity: string
  tonnage: number
  stage: DealStage
  expected_value?: number
  expected_commission?: number
  probability_pct?: number
  close_date?: string
}

export interface CreateDealRequest {
  opportunity_id?: number
  buyer_id: number
  seller_id: number
  commodity: string
  tonnage: number
  price_per_unit: number
  total_value: number
  stage?: DealStage
  expected_commission: number
  notes?: string
}

export interface CreateCounterpartyRequest {
  name: string
  type: 'buyer' | 'seller' | 'broker' | 'logistics'
  country?: string
  contact_person?: string
  email?: string
  phone?: string
  notes?: string
}

export interface UpdateDealRequest {
  stage?: DealStage
  ncnda_signed_date?: string
  kyc_approved_date?: string
  imfpa_signed_date?: string
  spa_signed_date?: string
  commission_received?: number
  commission_received_date?: string
  notes?: string
}

// Dashboard Metrics
export interface DealMetrics {
  total_deals: number
  active_deals: number
  closed_deals: number
  total_value: number
  total_commission: number
  average_deal_value: number
  avg_time_to_close: number
  win_rate: number
}

export interface LeadMetrics {
  total_leads: number
  new_leads: number
  contacted_leads: number
  qualified_leads: number
  conversion_rate: number
}

export interface KycMetrics {
  total_counterparties: number
  approved: number
  pending: number
  rejected: number
  approval_rate: number
}

// Error Handling
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// Form State
export interface FormState<T> {
  data: T
  errors: Record<keyof T, string>
  isSubmitting: boolean
}

// Notification
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}
