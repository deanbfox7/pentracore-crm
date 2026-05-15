# PentraCore Suite — Deployment Guide

## What's Built

### Shareholder Systems (Private)
- **Personalized Chatbots** — each shareholder sees only their deals
- **Document Compiler** — auto-tag & organize deal docs
- **Document Reviewer** — AI compliance checking (NCNDA, KYC, IMFPA)
- **Desktop App** — Electron wrapper at `~/Desktop/pentracore-shareholder-desktop/`

### Dean's Systems (Public + Private)
- **CRM Dashboard** — pipeline, opportunities, accounts, contacts
- **Lead Qualification Chat** — web chatbot converts inbound prospects
- **Voice Bot** — inbound Twilio voice qualification (5-stage flow)
- **Sales Bot** — outbound AI-generated emails/WhatsApp/SMS to prospects
- **Voice Outbound** — follow-up calls to high-value leads (optional)

---

## Deployment Steps

### 1. **Vercel (CRM + Shareholder App)**

```bash
cd ~/Desktop/Pentacore/pentracore-crm
git add .
git commit -m "Add shareholder tools, CRM, sales bot, voice bot"
git push origin main
```

Then on Vercel:
- Connect repo
- Set env vars:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  NEXT_PUBLIC_SUPABASE_URL=https://...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  SENDGRID_API_KEY=SG...
  SENDGRID_FROM_EMAIL=dean@pentracore.com
  TWILIO_ACCOUNT_SID=AC...
  TWILIO_AUTH_TOKEN=...
  TWILIO_PHONE_NUMBER=+1234567890
  ```
- Deploy
- Run migrations: `supabase migration up`

### 2. **Electron Desktop App**

```bash
cd ~/Desktop/pentracore-shareholder-desktop
npm install
npm run build
# Creates Mac .dmg and Windows installers
```

### 3. **Configure Twilio**

For **inbound voice**:
- Twilio phone number → Webhook: `https://yourdomain.com/api/voice/inbound` (POST)

For **outbound voice**:
- Enable TwiML binning
- Set callback: `https://yourdomain.com/api/voice/outbound-twiml`

---

## API Endpoints

### Shareholder Chat
```
POST /api/chat
Body: { messages: [], shareholder_id: "uuid" }
Returns: { reply, shareholder, portfolio }
```

### Cold Lead Chat
```
POST /api/lead-chat
Body: { messages: [] }
Returns: { reply, qualified: bool }
```

### Sales Outreach
```
POST /api/sales/outreach
Body: { lead_id: "uuid", channel: "email|whatsapp|sms" }
Returns: { success, message, sentTo }
```

### Voice Inbound (Twilio webhook)
```
POST /api/voice/inbound
Twilio sends: CallSid, From, Digits, SpeechResult
Returns: TwiML XML
```

### Voice Outbound
```
POST /api/voice/outbound
Body: { lead_id: "uuid" }
Returns: { success, callSid, script }
```

---

## Costs & Optimization

- **Claude Haiku 4.5** everywhere (~$0.001 per 1K input tokens)
- **Prompt caching** on all system prompts (25% savings after first request)
- **5-message history** — keeps context window small
- **Twilio voice** — ~$0.025/min inbound, $0.05/min outbound
- **SendGrid** — $20/mo (up to 40K emails)
- **Supabase** — free tier covers dev, $25/mo for prod

**Monthly estimate (100 leads/month):**
- Claude: $5
- Twilio: $50
- SendGrid: $20
- Supabase: $25
- **Total: ~$100/month**

---

## Testing Before Go-Live

1. **Shareholder chat** — test with a shareholder_id, verify isolation
2. **Cold lead chat** — complete qualification, check crm_leads table
3. **Voice inbound** — test Twilio call, verify TwiML parsing
4. **Sales outreach** — send test email/WhatsApp/SMS
5. **Document reviewer** — upload NCNDA, verify compliance check

---

## Monitoring

- Supabase dashboard: leads, outreach history, voice sessions
- SendGrid: email delivery rates
- Twilio: call duration, recording transcripts
- Vercel: API logs, errors

---

## Notes

- All shareholder data is isolated (SQL queries filter by shareholder_id)
- Hard rules enforced: NCNDA-first, KYC gate, IMFPA before SPA, buyer/seller separation
- Voice sessions auto-create CRM leads on completion
- Outreach tracking prevents duplicate messages
- Call recordings stored in Twilio (retrieve via API)
