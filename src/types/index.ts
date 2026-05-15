export type LeadStage = 'new' | 'contacted' | 'interested' | 'negotiating' | 'closed_won' | 'closed_lost'
export type LeadSource = 'manual' | 'csv_import' | 'linkedin' | 'web_scrape' | 'referral'
export type CompanySize = 'small' | 'medium' | 'large' | 'enterprise'

export interface Lead {
  id: string
  owner_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  linkedin_url?: string
  company_name: string
  company_website?: string
  industry?: string
  company_size?: CompanySize
  country: string
  city?: string
  region?: string
  commodities_of_interest: string[]
  estimated_volume?: string
  stage: LeadStage
  lead_score: number
  score_reasoning?: string
  scored_at?: string
  source?: LeadSource
  source_detail?: string
  notes?: string
  tags: string[]
  estimated_deal_value?: number
  currency: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  lead_id: string
  user_id?: string
  type: 'email_sent' | 'email_opened' | 'email_replied' | 'email_clicked' | 'email_bounced' |
        'sms_sent' | 'sms_replied' | 'call' | 'note' | 'stage_change' | 'meeting_booked' | 'meeting_completed'
  subject?: string
  body?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Campaign {
  id: string
  owner_id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  created_at: string
  updated_at: string
  steps?: CampaignStep[]
}

export interface CampaignStep {
  id: string
  campaign_id: string
  step_order: number
  channel: 'email' | 'sms'
  subject_template?: string
  body_template: string
  delay_days: number
  delay_hours: number
  use_ai_personalization: boolean
  created_at: string
}

export interface CampaignEnrollment {
  id: string
  campaign_id: string
  lead_id: string
  status: 'active' | 'paused' | 'completed' | 'replied' | 'bounced' | 'unsubscribed'
  current_step: number
  enrolled_at: string
  last_step_at?: string
  next_step_at?: string
  completed_at?: string
  lead?: Lead
}

export interface EmailTemplate {
  id: string
  owner_id: string
  name: string
  subject: string
  body: string
  category?: 'introduction' | 'follow_up' | 'proposal' | 'closing'
  commodity_focus: string[]
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  lead_id: string
  owner_id: string
  title: string
  type: 'phone_call' | 'video_call' | 'in_person'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  start_time: string
  end_time: string
  location?: string
  meeting_link?: string
  notes?: string
  reminder_sent: boolean
  created_at: string
  lead?: Lead
}

export interface BookingLink {
  id: string
  owner_id: string
  slug: string
  title: string
  description?: string
  duration_minutes: number
  buffer_minutes: number
  available_days: number[]
  start_hour: number
  end_hour: number
  timezone: string
  meeting_type: 'phone_call' | 'video_call' | 'in_person'
  meeting_link?: string
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  company_name: string
  role: 'admin' | 'sales_rep' | 'viewer'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Shareholder {
  id: string
  name: string
  email: string
  role: string
  portfolio_deal_ids: string[]
  created_at?: string
  updated_at?: string
}

export interface CrmLead {
  id: string
  commodity_type: string
  volume: string
  country_of_origin: string
  role: 'buyer' | 'seller'
  contact_info: string
  conversation_history: Record<string, unknown>[]
  source: string
  status: string
  created_at: string
  updated_at: string
}

export type CompanyType = 'buyer' | 'supplier' | 'broker'

export interface Company {
  id: string
  owner_id: string
  name: string
  type: CompanyType
  website?: string
  country?: string
  region?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  owner_id: string
  company_id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  title?: string
  influence_level?: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

export type OpportunityStage = 'qualified' | 'rfq' | 'negotiation' | 'contract' | 'closed_won' | 'closed_lost'

export interface Opportunity {
  id: string
  owner_id: string
  lead_id?: string
  company_id?: string
  primary_contact_id?: string
  title: string
  stage: OpportunityStage
  commodity: string
  incoterm?: string
  quantity?: number
  unit?: string
  target_price?: number
  estimated_margin?: number
  expected_close_date?: string
  status: 'open' | 'won' | 'lost'
  notes?: string
  closed_reason?: string
  created_at: string
  updated_at: string
}

export interface RFQ {
  id: string
  owner_id: string
  opportunity_id: string
  buyer_requirements: string
  specification?: Record<string, unknown>
  deadline_date?: string
  status: 'draft' | 'sent' | 'closed'
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  owner_id: string
  rfq_id: string
  price: number
  currency: string
  terms?: string
  valid_until?: string
  status: 'sent' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  updated_at: string
}

export interface SalesContract {
  id: string
  owner_id: string
  opportunity_id: string
  quote_id?: string
  counterparty: string
  value: number
  currency: string
  lifecycle_status: 'draft' | 'review' | 'signed' | 'cancelled'
  signed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  owner_id: string
  lead_id?: string
  opportunity_id?: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
}
