# Kalyani Restaurant — Codebase Audit Report

**Date:** March 12, 2026  
**Scope:** All pages, dashboards, contexts, and components  
**Focus:** Hardcoded/mock data, missing backend integration, credential leaks, security issues

---

## 🔴 CRITICAL — Fix Immediately

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| 1 | `src/contexts/AdminContext.tsx` | L230 | **Twilio Account SID exposed in client-side JS:** `[REDACTED]` — anyone can view-source and steal it |
| 2 | `src/contexts/AdminContext.tsx` | L231 | **Twilio Auth Token exposed:** `[REDACTED]` — attackers can send SMS / rack up charges on your account |
| 3 | `src/contexts/AdminContext.tsx` | L232 | **Twilio phone number exposed:** `[REDACTED]` |
| 4 | `src/contexts/AdminContext.tsx` | L228–L240 | **Twilio API called directly from browser** — must move to a Supabase Edge Function |
| 5 | `src/components/Checkout.tsx` | L213–L260 | **No real payment gateway** — payment is faked with `setTimeout` after 2 seconds. Card numbers collected with zero PCI compliance |
| 6 | `src/components/Checkout.tsx` | L254 | **Card numbers handled in client without PCI DSS compliance** — no tokenization |
| 7 | `src/contexts/BillingContext.tsx` | L46–L49 | **Billing user PIN stored in plain text in localStorage** — anyone can read it from DevTools |
| 8 | `src/contexts/BillingContext.tsx` | L131 | **PINs stored unhashed in Supabase** — `.eq('pin', pin)` means plain-text comparison |

---

## 🟠 HIGH — Hardcoded / Mock Data Acting as Backend

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| 9 | `src/data/menuData.ts` | L1–L100 | **60+ menu items fully hardcoded** — used as fallback/default in AdminContext. If Supabase returns empty, these static items are shown. Items lack `productCode`, `tax`, `qty`, `offer` fields that billing needs |
| 10 | `src/contexts/CartContext.tsx` | Entire file | **Entire cart is in-memory only** — zero Supabase calls, zero localStorage. Page refresh = cart completely lost |
| 11 | `src/contexts/OrderContext.tsx` | L68–L90 | **Fake rider GPS simulation** — linearly interpolates fake coordinates over 120 seconds (`totalSteps = 24`) and **writes fabricated GPS data to the DB** |
| 12 | `src/contexts/OrderContext.tsx` | L32–L39 | **Fetches ALL orders in the system** — `select('*')` with no user filter. Every user sees every order |
| 13 | `src/components/Checkout.tsx` | L224 | **Hardcoded rider name for every order:** `'Ramesh K.'` |
| 14 | `src/components/Checkout.tsx` | L225 | **Hardcoded rider phone:** `'9876543210'` |
| 15 | `src/components/Checkout.tsx` | L227 | **Hardcoded restaurant coordinates as rider start:** `{ lat: 12.900889, lng: 77.709021 }` |
| 16 | `src/components/Checkout.tsx` | L230 | **Hardcoded fallback customer coordinates:** `{ lat: 12.9100, lng: 77.7200 }` |
| 17 | `src/components/Checkout.tsx` | L231 | **Hardcoded 35-minute delivery estimate:** `new Date(Date.now() + 35 * 60000)` |
| 18 | `src/components/Checkout.tsx` | L214, L219, L228 | **Mock ID generation** — `'ORD' + Date.now()`, `'addr_' + Date.now()`, `'PAY' + Date.now()` instead of DB-generated IDs |
| 19 | `src/contexts/AuthContext.tsx` | L153 | **Fake user ID fallback** — `'u_' + Date.now()` generated when Supabase session is missing |
| 20 | `src/contexts/AuthContext.tsx` | L36–L53 | **User auth restored from localStorage** — not from `supabase.auth.getSession()`. Tampered localStorage = fake auth |
| 21 | `src/contexts/RiderContext.tsx` | L35–L42 | **Rider auth in localStorage only** — no Supabase session validation; manually-crafted localStorage grants rider access |
| 22 | `src/contexts/RiderContext.tsx` | L143–L148 | **Hardcoded fallback coordinates:** `{ lat: 12.900889, lng: 77.709021 }` used when rider location unavailable |
| 23 | `src/contexts/RiderContext.tsx` | L116–L121 | **Rider logout doesn't call `supabase.auth.signOut()`** — Supabase auth session persists after "logout" |

---

## 🟡 MEDIUM — Hardcoded Config Values (Should Be DB/Env Driven)

### Restaurant Info (repeated across files)

| Value | Files |
|-------|-------|
| `"Kalyani Restaurant"` | Header.tsx (L52), Footer.tsx (L13, L39), AboutUs.tsx (L10), BillingDashboard.tsx (L629, L672), BillingLogin.tsx (L28), RiderLogin.tsx (L51), AdminLogin.tsx (L30), OrderTracking.tsx (L284, L298), Hero.tsx (L22) |
| `"64, Sarjapur - Marathahalli Rd..."` (address) | Footer.tsx (L35), AboutUs.tsx (L51), BillingDashboard.tsx (L673) |
| `"+91 98765 43210"` (phone) | Footer.tsx (L34), BillingDashboard.tsx (L674) |
| `"contact@kalyanirestaurant.com"` (email) | Footer.tsx (L33) |
| `{ lat: 12.900889, lng: 77.709021 }` (coordinates) | AdminContext.tsx (L373, L382), Checkout.tsx (L227), RiderContext.tsx (L143–L148), AboutUs.tsx (L39–L41 in Maps embed URL) |

### Business Config

| Value | File | Line(s) |
|-------|------|---------|
| `DELIVERY_FEE = 30` (₹30 flat) | `src/contexts/CartContext.tsx` | L32 |
| `tax ?? 5` (5% fallback tax rate) | `src/contexts/CartContext.tsx` | L80 |
| `"Taxes (5%)"` label in UI | `src/components/Cart.tsx` | L58 |
| 35-minute delivery estimate | `src/components/Checkout.tsx` | L231 |
| Hardcoded SMS body text | `src/contexts/AdminContext.tsx` | L233 |
| Google Maps embed URL with coordinates | `src/components/AboutUs.tsx` | L39–L41 |

### Static Content

| Value | File | Line(s) |
|-------|------|---------|
| About-us description (3 paragraphs of marketing copy) | `src/components/AboutUs.tsx` | L10–L21 |
| Stat: "10+" years of service | `src/components/AboutUs.tsx` | L24 |
| Stat: "50+" dishes on menu | `src/components/AboutUs.tsx` | L28 |
| Stat: "10K+" happy customers | `src/components/AboutUs.tsx` | L32 |
| `"Authentic flavors, crafted with love."` tagline | `src/components/Footer.tsx` | L14 |
| Fallback category list (9 categories) | `src/components/FoodMenu.tsx` | L9–L12 |
| Non-functional legal links (`#privacy`, `#terms`, etc.) | `src/components/Footer.tsx` | L25–L28 |
| Fallback banner alt text and placeholder image | `src/components/Hero.tsx` | L22 |
| Receipt filename prefix `'Kalyani_Receipt_'` | `src/components/OrderTracking.tsx` | L261 |
| Receipt HTML with hardcoded restaurant name | `src/components/OrderTracking.tsx` | L284, L298 |

---

## 🟡 MEDIUM — Fire-and-Forget DB Writes (No Error Handling)

These optimistic updates modify local state first, then fire a Supabase call with no `await`, no error handling, and no rollback if it fails:

| File | Line(s) | Operation |
|------|---------|-----------|
| `src/contexts/AuthContext.tsx` | L153–L168 | `completeSignup` — upserts profile without checking response |
| `src/contexts/OrderContext.tsx` | L97–L104 | `placeOrder` — inserts order as fire-and-forget |
| `src/contexts/OrderContext.tsx` | L106–L114 | `updateOrderStatus` — updates order status with no await |
| `src/contexts/RiderContext.tsx` | L124–L127 | `toggleOnline` — updates rider online status |
| `src/contexts/RiderContext.tsx` | L130–L139 | `acceptDelivery` — updates order assignment |
| `src/contexts/RiderContext.tsx` | L142–L150 | `markPickedUp` — updates order status |
| `src/contexts/RiderContext.tsx` | L153–L163 | `markDelivered` — updates order status |

---

## 🔵 LOW — Missing Realtime Subscriptions

| Context | Missing Realtime On |
|---------|-------------------|
| `AuthContext.tsx` | `profiles` table — admin changes to user data not reflected until refresh |
| `BillingContext.tsx` | `credits` table — other billing users settling credits not visible |
| `BillingContext.tsx` | `menu_items` stock changes — after `saveBill` decrements qty, other billing terminals won't see reduced stock |

---

## ✅ What's Working Well

| Component | Status |
|-----------|--------|
| **AdminContext** — Menu, Banners, Offers, Categories CRUD | ✅ Full Supabase integration with realtime |
| **AdminContext** — Orders management | ✅ Realtime subscriptions |
| **AdminContext** — Riders, Billing Users, Account Heads CRUD | ✅ Full Supabase integration |
| **AdminLogin** — Phone + AccessKey + OTP | ✅ Uses `supabase.auth.signInWithOtp` and `verifyOtp` |
| **AuthContext** — OTP send/verify | ✅ Real Supabase auth |
| **RiderContext** — Real GPS tracking | ✅ `navigator.geolocation.watchPosition` pushing to Supabase |
| **RiderContext** — Realtime order updates | ✅ Subscribed to orders table |
| **BillingContext** — Bills, KOTs, Payments | ✅ Full Supabase persistence with realtime |
| **BillingContext** — Stock deduction on sale | ✅ Decrements `menu_items.qty` on bill save |
| **AdminDashboard** — All tabs | ✅ No hardcoded data; all from context |
| **RiderDashboard** | ✅ No hardcoded data; all from context |

---

## 📋 Recommended Priority Actions

### Priority 1 — Security (Do Now)

1. **Rotate Twilio credentials** — they are compromised in git history
2. **Move Twilio SMS** to a Supabase Edge Function; never call external APIs with secrets from the browser
3. **Hash billing PINs** server-side (use a Supabase DB function); stop storing plain-text PIN in localStorage
4. **Remove card number input** from Checkout until a PCI-compliant payment gateway (Razorpay/Stripe) is integrated

### Priority 2 — Core Functionality

5. **Integrate Razorpay or Stripe** for real payments in Checkout — replace the `setTimeout` mock
6. **Remove fake GPS simulation** in OrderContext (L68–L90) — real rider positions already come from RiderContext
7. **Scope OrderContext queries** to current user's orders using user ID filter
8. **Add localStorage persistence to CartContext** so page refresh doesn't lose the cart
9. **Remove hardcoded rider** (`'Ramesh K.'`) from Checkout — use the rider assigned by admin

### Priority 3 — Config Centralization

10. **Create a `restaurant_config` table** in Supabase with columns: `name`, `address`, `phone`, `email`, `lat`, `lng`, `delivery_fee`, `default_tax_rate`, `maps_embed_url`, `tagline`
11. **Create a React context** (`ConfigContext`) that fetches this config once at app init
12. **Replace all hardcoded values** across Header, Footer, AboutUs, Cart, Checkout, BillingDashboard print templates, OrderTracking receipts with config values

### Priority 4 — Data Integrity

13. **Remove `menuData.ts` hardcoded fallback** or make it empty (`[]`) so the app shows only DB data
14. **Add error handling** to all fire-and-forget Supabase calls — at minimum log errors and show toasts
15. **Validate auth from `supabase.auth.getSession()`** instead of trusting localStorage for user/rider sessions
16. **Add missing realtime subscriptions** for `credits` and `menu_items` stock in BillingContext
