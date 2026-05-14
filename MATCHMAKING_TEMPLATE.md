# PentraCore Matchmaking Template

**Purpose:** Replace deal-first with match-first workflow. Track buyers, sellers, commodities, and explicit matches.

**Setup:** Copy each section into a separate Google Sheets tab. Headers are row 1. Data starts row 2.

---

## TAB 1: BUYERS

**Sheet name:** `Buyers`

| buyer_id | company_name | country | contact_person | email | phone | kyc_status | commodities_of_interest | typical_volumes | price_range_notes | created_at | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Nippon Steel Trading | Japan | Hiroshi Tanaka | h.tanaka@nippon.jp | +81-90-1234-5678 | approved | iron ore, chrome | 1000-2000T per month | $55-65/tonne FOB | 2026-03-15 | Long-term buyer, repeat orders |
| 2 | China Metals Corp | China | Wei Liu | wei.liu@chinametals.cn | +86-10-5555-1234 | approved | copper cathode, cobalt | 500-1000T per shipment | $8,000-9,500/tonne | 2026-03-20 | Prefers monthly shipments |
| 3 | Johannesburg Minerals | South Africa | Thabo Nkosi | thabo@jburg-minerals.co.za | +27-11-555-9876 | pending | lithium concentrate | 200-500T | $12,000-14,000/tonne | 2026-04-01 | Battery supply chain partner |
| 4 | Tokyo Trading House | Japan | Kenji Sato | k.sato@tokyotrading.jp | +81-90-8888-9999 | approved | gold, aluminium | 50-200T (Au), 500-1500T (Al) | Gold: $65/g, Al: $2,800-3,200/T | 2026-02-28 | Specialty metals focus |
| 5 | Dalian Commodity Exchange | China | Feng Zhang | f.zhang@dalian-exchange.cn | +86-411-8765-4321 | in_progress | coal, iron ore | 2000-5000T per shipment | $80-120/tonne (coal), $50-60 (ore) | 2026-04-10 | Large volume buyer |

---

## TAB 2: SELLERS

**Sheet name:** `Sellers`

| seller_id | company_name | country | contact_person | email | phone | kyc_status | commodities_of_interest | typical_volumes | price_range_notes | created_at | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | FGMS Resources | South Africa | John Mkhize | john@fgms.co.za | +27-12-555-1234 | approved | iron ore, chrome, cobalt | 500-2000T per shipment | $55-65/tonne FOB | 2026-03-01 | Major regional supplier |
| 11 | Orathu Mining Co | South Africa | Sipho Dlamini | sipho@orathu.co.za | +27-21-555-5678 | approved | manganese, chrome, PGM | 100-800T | Spot + contract rates | 2026-02-15 | Reliable mid-sized producer |
| 12 | Shatadi Minerals | Botswana | Kabelo Setlhokwane | kabelo@shatadi.bw | +267-72-555-9999 | pending | diamonds, copper, lithium | 50-300T (diamonds), 200-1000T (metals) | Premium pricing, spot available | 2026-04-05 | Specialty commodities |
| 13 | Eastern Gold Mining | Zimbabwe | Grace Mlambo | grace@eastgold.zw | +263-4-555-7777 | approved | gold, copper | 10-50T (Au), 200-600T (Cu) | $64-66/g (Au), $8,500-9,200/T (Cu) | 2026-03-10 | Artisanal + industrial blend |
| 14 | Pan-African Alum | Guinea | Mohamed Diallo | m.diallo@panafricanalum.gn | +224-613-555-2468 | in_progress | aluminium, bauxite | 1000-3000T per shipment | Bauxite: $40-50/T, Al: $2,900-3,300/T | 2026-04-08 | New supplier, first audit pending |

---

## TAB 3: COMMODITIES

**Sheet name:** `Commodities`

| commodity_name | category | unit | market_price_approx | typical_purity | notes |
|---|---|---|---|---|---|
| Iron Ore | Metals | tonne | $55-70/T FOB | 65% Fe | Benchmark: Dalian futures |
| Copper Cathode | Metals | tonne | $8,500-9,500/T | 99.99% Cu | LME traded |
| Cobalt | Specialty | tonne | $20,000-25,000/T | 99.8% Co | EV battery demand driven |
| Chromium Ore | Metals | tonne | $180-220/T | 46-48% Cr | Stainless steel feedstock |
| Lithium Concentrate | Specialty | tonne | $12,000-16,000/T | 6-7% Li2O | Battery supply chain critical |
| Gold | Precious | gram | $64-68/g | 99.99% Au | London AM/PM fix benchmark |
| Aluminium | Metals | tonne | $2,800-3,300/T | 99.7% Al | LME traded, high volume |
| Coal (Thermal) | Energy | tonne | $80-150/T | 25-30% ash | South African export standard |
| Manganese Ore | Metals | tonne | $5-8/T | 40-48% Mn | Commodity + specialty grades |
| Diamonds | Precious | carat | $3,000-15,000/ct | Variable clarity | Rough → polished premium |

---

## TAB 4: MATCHES

**Sheet name:** `Matches`

| match_id | buyer_id | buyer_name | seller_id | seller_name | commodity | approx_volume_tonnes | match_status | buyer_kyc | seller_kyc | price_alignment | volume_alignment | match_score | notes | created_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M001 | 1 | Nippon Steel Trading | 10 | FGMS Resources | iron ore | 1000 | qualified | approved | approved | ✓ Buyer $60-65, Seller $55-65 | ✓ Buyer 1000-2000T, Seller 500-2000T | 95 | Long-term partnership candidate | 2026-04-15 |
| M002 | 2 | China Metals Corp | 12 | Shatadi Minerals | copper | 500 | identified | approved | pending | ? Buyer $8,500-9,500, Seller TBD | ✓ Buyer 500-1000T, Seller 200-1000T | 72 | Awaiting Shatadi KYC approval | 2026-04-18 |
| M003 | 3 | Johannesburg Minerals | 12 | Shatadi Minerals | lithium_concentrate | 300 | qualified | pending | pending | ✓ Buyer $12-14K, Seller premium | ✓ Buyer 200-500T, Seller 200-1000T | 88 | Both in KYC; strong volume fit | 2026-04-10 |
| M004 | 4 | Tokyo Trading House | 13 | Eastern Gold Mining | gold | 25 | deal_created | approved | approved | ✓ Buyer $65/g, Seller $64-66/g | ✓ Buyer 50-200T, Seller 10-50T | 92 | Deal #D024 in LOI stage | 2026-03-25 |
| M005 | 5 | Dalian Commodity Exchange | 10 | FGMS Resources | iron_ore | 2000 | qualified | in_progress | approved | ✓ Buyer $50-60, Seller $55-65 | ✓ Buyer 2000-5000T, Seller 500-2000T | 85 | Awaiting buyer KYC final approval | 2026-04-12 |
| M006 | 1 | Nippon Steel Trading | 11 | Orathu Mining Co | chrome | 500 | identified | approved | approved | ✓ Buyer $60-70, Seller spot rates | ✓ Buyer 1000-2000T, Seller 100-800T | 78 | Lower volume availability; negotiate | 2026-04-20 |
| M007 | 2 | China Metals Corp | 13 | Eastern Gold Mining | copper | 400 | qualified | approved | approved | ✓ Buyer $8,500-9,200, Seller $8,500-9,200 | ✓ Buyer 500-1000T, Seller 200-600T | 91 | Ready for LOI; strong fit | 2026-04-05 |
| M008 | 5 | Dalian Commodity Exchange | 14 | Pan-African Alum | aluminium | 1500 | identified | in_progress | in_progress | ? Both in pricing discovery | ✓ Buyer 2000-5000T, Seller 1000-3000T | 65 | KYC & quality audit in progress | 2026-04-19 |

---

## CSV EXPORT TEMPLATES

### buyers.csv
```
buyer_id,company_name,country,contact_person,email,phone,kyc_status,commodities_of_interest,typical_volumes,price_range_notes,created_at,notes
1,Nippon Steel Trading,Japan,Hiroshi Tanaka,h.tanaka@nippon.jp,+81-90-1234-5678,approved,"iron ore, chrome",1000-2000T per month,$55-65/tonne FOB,2026-03-15,Long-term buyer repeat orders
2,China Metals Corp,China,Wei Liu,wei.liu@chinametals.cn,+86-10-5555-1234,approved,"copper cathode, cobalt",500-1000T per shipment,$8000-9500/tonne,2026-03-20,Prefers monthly shipments
```

### sellers.csv
```
seller_id,company_name,country,contact_person,email,phone,kyc_status,commodities_of_interest,typical_volumes,price_range_notes,created_at,notes
10,FGMS Resources,South Africa,John Mkhize,john@fgms.co.za,+27-12-555-1234,approved,"iron ore, chrome, cobalt",500-2000T per shipment,$55-65/tonne FOB,2026-03-01,Major regional supplier
11,Orathu Mining Co,South Africa,Sipho Dlamini,sipho@orathu.co.za,+27-21-555-5678,approved,"manganese, chrome, PGM",100-800T,Spot + contract rates,2026-02-15,Reliable mid-sized producer
```

### commodities.csv
```
commodity_name,category,unit,market_price_approx,typical_purity,notes
Iron Ore,Metals,tonne,$55-70/T FOB,65% Fe,Benchmark: Dalian futures
Copper Cathode,Metals,tonne,$8500-9500/T,99.99% Cu,LME traded
Cobalt,Specialty,tonne,$20000-25000/T,99.8% Co,EV battery demand driven
```

### matches.csv
```
match_id,buyer_id,buyer_name,seller_id,seller_name,commodity,approx_volume_tonnes,match_status,buyer_kyc,seller_kyc,price_alignment,volume_alignment,match_score,notes,created_at
M001,1,Nippon Steel Trading,10,FGMS Resources,iron ore,1000,qualified,approved,approved,✓ Buyer $60-65 Seller $55-65,✓ Buyer 1000-2000T Seller 500-2000T,95,Long-term partnership candidate,2026-04-15
M002,2,China Metals Corp,12,Shatadi Minerals,copper,500,identified,approved,pending,? Buyer $8500-9500 Seller TBD,✓ Buyer 500-1000T Seller 200-1000T,72,Awaiting Shatadi KYC approval,2026-04-18
```

---

## GOOGLE SHEETS INSTRUCTIONS

1. **Create new Google Sheet:** `PentraCore Matchmaking Tracker`

2. **Tab setup (bottom of screen):**
   - Right-click sheet tab → Rename → `Buyers`
   - Add sheet → Rename → `Sellers`
   - Add sheet → Rename → `Commodities`
   - Add sheet → Rename → `Matches`

3. **Format each tab:**
   - Row 1: Headers (bold, light blue background)
   - Data starts Row 2
   - Freeze Row 1 (View → Freeze → 1 row)

4. **Data validation (optional but recommended):**
   - `kyc_status` column: Data → Validation → Dropdown list: approved, pending, in_progress, rejected
   - `match_status` column: Data → Validation → Dropdown list: identified, qualified, deal_created, closed_won, dead
   - Column width: Auto-resize (Format → Column → Optimal width)

5. **Sharing:**
   - Share with Dean (deanbfox@gmail.com)
   - Permissions: Editor
   - Add note: "Update matches as deals progress. KYC approvals flow down from buyer/seller to match status."

---

## OPERATIONAL WORKFLOW

### Daily workflow for Dean:

1. **New buyer inquiry comes in**
   - Add row to Buyers tab (name, contact, commodities wanted, volume range, price expectations)
   - Set kyc_status = "pending"

2. **Review existing sellers for match**
   - Look at Sellers tab
   - Scan Commodities tab for current market prices
   - Ask: Do we have a seller for this commodity? Price alignment? Volume alignment?

3. **If match looks good → Add Match row**
   - Fill buyer_id, seller_id, commodity, approx volume
   - Set match_status = "identified"
   - Add match_score (0-100: higher = better alignment)
   - Add notes (e.g., "Buyer KYC pending approval")

4. **As match qualifies**
   - Both buyer and seller KYC → "approved"
   - Price expectations align → mark in price_alignment column
   - match_status → "qualified"

5. **Create Deal from Match**
   - In PentraCore CRM: POST `/api/crm/deals`
   - Include match_id (once DB supports it)
   - match_status → "deal_created"
   - Deal inherits buyer_id, seller_id from match

6. **Deal flows through signatures**
   - NCNDA → KYC → IMFPA → SPA
   - Track in CRM via Phase 2 fields (owner, probability, bottleneck, next_action)
   - Update match_status → "closed_won" when deal closes

---

## REAL-WORLD NOTES FOR PENTRACORE

- **Match Score interpretation:**
  - 90-100: Excellent fit. Create deal immediately.
  - 75-89: Good fit. Check one or two things (price, KYC timeline).
  - 60-74: Possible fit. Needs buyer/seller conversation or price negotiation.
  - <60: Weak fit. Low priority; park for later.

- **Price alignment checkmark:**
  - ✓ = overlap in ranges (buyer willing to pay X, seller willing to accept X)
  - ? = needs negotiation or more data
  - ✗ = no overlap; deprioritize

- **KYC as gating factor:**
  - Match can be "identified" even if KYC is pending
  - Move to "qualified" once both buyer and seller are approved
  - Some matches will stall on KYC (e.g., M002: Shatadi still pending)

- **Volume alignment:**
  - Check buyer's typical_volumes against seller's typical_volumes
  - M006: Nippon wants 1000-2000T/month, Orathu only does 100-800T. Negotiate or skip.

- **Commodity pricing:**
  - Refer to Commodities tab for current market benchmarks
  - Update monthly as prices shift (coal, iron ore, lithium most volatile)

---

## DATA ENTRY TIPS

- **Phone:** Use full international format (+XX-AAA-BBB-CCCC)
- **Email:** Verify before adding (test one message)
- **Volumes:** Always as "X-Y tonnes" or "X tonnes"
- **Dates:** YYYY-MM-DD format only
- **Price notes:** Include $/unit, transportation terms (FOB, CIF, landed), any conditions
- **Match notes:** Be specific ("Awaiting Shatadi Q3 production schedule", "Price gap $2K/T, needs renegotiation")

---

## LINK TO CRMS

Once deployed to Supabase:
- Buyers & Sellers auto-sync to `dean_crm.counterparties`
- Matches auto-sync to `dean_crm.matches`
- Deals created from matches link `deal.match_id` to `matches.id`
- Google Sheets used as operational tracker; CRM is system of record

**Until then:** Use Sheets as single source of truth. Manually create deals in CRM when ready.
