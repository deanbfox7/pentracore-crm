-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  company_name TEXT DEFAULT 'Pentracore International',
  role TEXT DEFAULT 'sales_rep',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''), new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- LEADS
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  company_name TEXT NOT NULL,
  company_website TEXT,
  industry TEXT,
  company_size TEXT,
  country TEXT NOT NULL,
  city TEXT,
  region TEXT,
  commodities_of_interest TEXT[] DEFAULT '{}',
  estimated_volume TEXT,
  stage TEXT NOT NULL DEFAULT 'new',
  lead_score INTEGER DEFAULT 0,
  score_reasoning TEXT,
  scored_at TIMESTAMPTZ,
  source TEXT DEFAULT 'manual',
  source_detail TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  estimated_deal_value NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_owner ON leads(owner_id);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_commodities ON leads USING GIN(commodities_of_interest);

-- ============================================
-- ACTIVITIES
-- ============================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

-- ============================================
-- CAMPAIGNS
-- ============================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  subject_template TEXT,
  body_template TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  use_ai_personalization BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  current_step INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  last_step_at TIMESTAMPTZ,
  next_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(campaign_id, lead_id)
);

CREATE INDEX idx_enrollments_next_step ON campaign_enrollments(next_step_at)
  WHERE status = 'active';

-- ============================================
-- EMAIL TEMPLATES
-- ============================================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  commodity_focus TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video_call',
  status TEXT DEFAULT 'scheduled',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  meeting_link TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appointments_owner ON appointments(owner_id);
CREATE INDEX idx_appointments_start ON appointments(start_time);

-- ============================================
-- BOOKING LINKS
-- ============================================
CREATE TABLE booking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Book a Meeting',
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 10,
  available_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  start_hour INTEGER DEFAULT 9,
  end_hour INTEGER DEFAULT 17,
  timezone TEXT DEFAULT 'UTC',
  meeting_type TEXT DEFAULT 'video_call',
  meeting_link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_links ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (id = auth.uid());

-- Leads: users manage own
CREATE POLICY "Users manage own leads" ON leads FOR ALL USING (owner_id = auth.uid());

-- Activities: users manage own via leads
CREATE POLICY "Users manage own activities" ON activities FOR ALL USING (
  lead_id IN (SELECT id FROM leads WHERE owner_id = auth.uid())
);

-- Campaigns
CREATE POLICY "Users manage own campaigns" ON campaigns FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Users manage own campaign_steps" ON campaign_steps FOR ALL USING (
  campaign_id IN (SELECT id FROM campaigns WHERE owner_id = auth.uid())
);
CREATE POLICY "Users manage own enrollments" ON campaign_enrollments FOR ALL USING (
  campaign_id IN (SELECT id FROM campaigns WHERE owner_id = auth.uid())
);

-- Templates
CREATE POLICY "Users manage own templates" ON email_templates FOR ALL USING (owner_id = auth.uid());

-- Appointments
CREATE POLICY "Users manage own appointments" ON appointments FOR ALL USING (owner_id = auth.uid());

-- Booking links
CREATE POLICY "Users manage own booking_links" ON booking_links FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Public can read active booking_links" ON booking_links FOR SELECT USING (is_active = true);
