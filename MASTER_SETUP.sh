#!/bin/bash

# ============================================
# PENTRACORE CRM: COMPLETE SETUP AUTOMATION
# Orchestrates full deployment from 0 to production
# ============================================

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         PENTRACORE CRM: COMPLETE SETUP AUTOMATION              ║"
echo "║              Ready in ~15 minutes with your help               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Step 1: Prerequisites
echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js ${NC}$(node --version)"

if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ npm not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ npm $(npm --version)${NC}"
echo ""

# Step 2: Check environment
echo -e "${BLUE}[2/7] Setting up environment...${NC}"

if [ ! -f ".env.local" ]; then
  echo -e "${RED}✗ .env.local not found${NC}"
  echo ""
  echo "Please create .env.local with your Supabase credentials:"
  echo ""
  cat > .env.local.template << 'EOF'
# Get these from https://supabase.com/dashboard
# 1. Create a new project named "pentracore-crm"
# 2. Go to Settings → API
# 3. Copy these 3 values:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF

  echo "Template created: .env.local.template"
  echo "Edit it with your Supabase values, then run this script again."
  exit 1
fi

source .env.local

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}✗ Missing Supabase credentials in .env.local${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Environment configured${NC}"
echo "  URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Step 3: Install dependencies
echo -e "${BLUE}[3/7] Installing dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 4: Database migration prompt
echo -e "${BLUE}[4/7] Database migrations${NC}"
echo ""
echo "You must run the SQL migrations in Supabase manually:"
echo ""
echo "1. Go to: $NEXT_PUBLIC_SUPABASE_URL/project/_/sql/new"
echo "2. Click 'New Query'"
echo "3. Copy-paste these 3 files in order:"
echo "   → supabase/migrations/001_init_schemas.sql"
echo "   → supabase/migrations/002_rls_policies.sql"
echo "   → supabase/migrations/003_pentracore_seed_data.sql"
echo "4. Click 'Run' for each"
echo ""
echo -e "${GREEN}Press ENTER when migrations are complete...${NC}"
read

# Step 5: RLS Policy update prompt
echo -e "${BLUE}[5/7] Updating RLS policies with your User ID${NC}"
echo ""
echo "Do this now in Supabase Dashboard:"
echo ""
echo "1. Go to: $NEXT_PUBLIC_SUPABASE_URL/project/_/auth/users"
echo "2. Complete your first login (if needed):"
echo "   - Visit: http://localhost:3000"
echo "   - Click 'Send Magic Link'"
echo "   - Enter: deanbfox@gmail.com"
echo "   - Check email for link"
echo "   - Click link"
echo "3. Go back to Supabase Dashboard → Authentication → Users"
echo "4. Copy your UUID from the list"
echo "5. Go to SQL Editor → New Query"
echo "6. Run this (replace YOUR_UUID):"
echo ""
echo "   -- Update RLS policies"
echo "   DROP POLICY IF EXISTS crm_dean_all ON dean_crm.leads;"
echo "   CREATE POLICY crm_dean_all ON dean_crm.leads USING (auth.uid() = 'YOUR_UUID');"
echo ""
echo "   -- (Repeat for all dean_crm tables)"
echo ""
echo -e "${GREEN}Press ENTER when RLS policies are updated...${NC}"
read

# Step 6: Build
echo ""
echo -e "${BLUE}[6/7] Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 7: Success
echo -e "${BLUE}[7/7] Setup complete!${NC}"
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    NEXT STEPS                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "1. Start dev server:"
echo "   npm run dev"
echo ""
echo "2. Open browser:"
echo "   http://localhost:3000"
echo ""
echo "3. Sign in with:"
echo "   Email: deanbfox@gmail.com"
echo "   (Magic link will be sent)"
echo ""
echo "4. Explore:"
echo "   /knowledge  (public knowledge base)"
echo "   /crm        (your private dashboard)"
echo "   /crm/deals  (deal pipeline)"
echo ""
echo "5. Deploy to production:"
echo "   vercel login"
echo "   vercel deploy --prod"
echo ""
echo -e "${GREEN}Happy trading! 🚀${NC}"
echo ""
