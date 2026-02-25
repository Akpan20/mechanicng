# 📢 MechanicNG Advertising System

## Overview

MechanicNG runs a **two-tier advertising system** designed to maximise both revenue and user experience:

```
┌─────────────────────────────────────────────┐
│  Ad Slot (any page)                         │
│                                             │
│  1️⃣  Direct/Native Ad (from our database)   │ ← Best revenue
│       ↓ (if none available)                  │
│  2️⃣  Google AdSense (programmatic)          │ ← Fills unsold inventory
│       ↓ (if AdSense also unavailable)        │
│  3️⃣  House Ad (MechanicNG own promotion)    │ ← Never empty
└─────────────────────────────────────────────┘
```

---

## Direct / Native Ads

Businesses in the Nigerian automotive ecosystem buy ad placements directly from MechanicNG.

### Who can advertise
- Auto parts & accessories shops
- Fuel stations
- Car insurance companies
- Driving schools
- Car wash & detailing
- Towing services
- Car dealerships
- Tyre & rim shops
- Auto financing companies

### How it works
1. Advertiser visits `/advertise`
2. Fills out business info + campaign details
3. Picks a placement, sets dates
4. Pays via Paystack (NGN, no FX needed)
5. Admin reviews and activates within 24 hours
6. Ad runs and tracks impressions/clicks automatically

### Ad Placements

| Placement          | Slug               | Page    | Size     | Price/Day |
|--------------------|--------------------|---------|----------|-----------|
| Homepage Hero      | home-hero          | Home    | 970×250  | ₦15,000   |
| Homepage Featured  | home-featured      | Home    | 300×250  | ₦8,000    |
| Search Top Banner  | search-top         | Search  | 728×90   | ₦10,000   |
| Search Sidebar     | search-sidebar     | Search  | 300×600  | ₦7,000    |
| Search Inline      | search-inline      | Search  | 300×250  | ₦9,000    |
| Profile Sidebar    | profile-sidebar    | Profile | 300×250  | ₦6,000    |
| Profile Bottom     | profile-bottom     | Profile | 728×90   | ₦5,000    |
| Sitewide Bottom    | sitewide-bottom    | All     | 728×90   | ₦4,000    |

### Revenue potential
- All 8 slots × 30 days × average ₦8,000/day = **₦1,920,000/month** at full inventory
- With Google AdSense filling ~40% unsold = additional revenue

---

## Google AdSense

### Setup Steps
1. Go to [google.com/adsense](https://google.com/adsense) and create an account
2. Add your site: `mechanicng.com`
3. Wait for site verification and approval (1–14 days)
4. Once approved, create **Ad Units** for each placement size
5. Copy each Ad Unit's **slot ID** into `src/components/ads/AdSlot.tsx`:

```typescript
const ADSENSE_SLOTS: Record<string, string> = {
  'home-hero':        '1234567890',   // ← paste your slot IDs here
  'search-top':       '3456789012',
  // ...
}
```

6. Replace `ca-pub-XXXXXXXXXXXXXXXX` with your publisher ID (same file + `AdSenseLoader.tsx`)

### AdSense Account Requirements
- Site must have original, quality content
- Site must comply with AdSense policies
- Must be live (not localhost) for approval
- Nigerian publishers ARE eligible for AdSense

### Important Notes
- AdSense only loads in **production** (not during local dev)
- AdSlot component uses IntersectionObserver — only charges impressions when actually visible
- Direct ads always take priority; AdSense is fallback only

---

## Using `<AdSlot>` in Pages

```tsx
import AdSlot from '@/components/ads/AdSlot'

// Basic usage — auto waterfall (direct → AdSense → house)
<AdSlot placement="search-sidebar" />

// With city targeting (shows ads targeted at that city)
<AdSlot placement="search-inline" city="Lagos" page="search" />

// Disable AdSense fallback (only direct ads or house ads)
<AdSlot placement="profile-sidebar" fallbackToGoogle={false} />

// Disable house ads too (nothing shown if no paid ad)
<AdSlot placement="home-hero" showHouseAd={false} />
```

### Recommended placement in pages

```
HomePage:
  - <AdSlot placement="home-hero" />          (hero section)
  - <AdSlot placement="home-featured" />      (between service grid and featured)

SearchPage:
  - <AdSlot placement="search-top" />         (above results)
  - <AdSlot placement="search-inline" />      (every 6th result card)
  - <AdSlot placement="search-sidebar" />     (sidebar on desktop)

MechanicProfilePage:
  - <AdSlot placement="profile-sidebar" />    (right sidebar)
  - <AdSlot placement="profile-bottom" />     (below contact buttons)
```

---

## Admin: Reviewing Ad Campaigns

1. Log in as admin at `/login`
2. Go to `/admin` → click **📢 Advertising** tab
3. Review pending campaigns — check headline, URL, creative, dates
4. Click **✓ Approve & Activate** or **✗ Reject**
5. Rejected campaigns: add admin notes explaining why

---

## Impression & Click Tracking

Tracking is automatic:
- **Impressions**: Recorded via `IntersectionObserver` when ≥50% of ad is visible for >0ms
- **Clicks**: Recorded before opening destination URL
- **Analytics**: Available in `/admin` ads tab (7-day chart) and `/advertiser/dashboard`

All tracking goes through Supabase RPC functions (`record_ad_impression`, `record_ad_click`).

---

## Revenue Reporting

Admin sees in the Ads tab:
- Revenue this month
- Total impressions & clicks across all campaigns
- Active campaign count
- Pending approvals
- 7-day impressions/clicks chart

Advertisers see in `/advertiser/dashboard`:
- Per-campaign impressions, clicks, CTR
- Total spend
- 7-day performance chart
- Campaign status and admin notes (if rejected)
