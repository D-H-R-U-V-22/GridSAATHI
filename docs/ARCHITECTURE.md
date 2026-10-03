# GridSaathi — Architecture & Technical Specifications

GridSaathi is an India-first distribution grid flexibility and renewable intermittency management platform.

---

## 1. System Topology & Regional Hierarchy

```
State (e.g. Uttar Pradesh, Rajasthan, Tamil Nadu)
 └─ District (e.g. Lucknow, Jaipur, Chennai)
     └─ PowerHouseArea (Substation Service Area with GeoJSON Polygon)
         ├─ 11kV Feeders (Capacity 2,000–3,100 kW)
         │   └─ Colony Clusters (Centroid + GeoJSON Polygon)
         │       ├─ Community Battery Energy Storage (50–120 kWh LFP)
         │       └─ Households (Appliance profiles, deferral readiness)
```

Static registry is defined in `src/data/areas.json` with 5 microclimatic zones (Subtropical Gangetic plain, Semi-arid solar desert, Coastal tropical, Western Ghats wind corridor, Eastern humid hills).

---

## 2. Geolocation & Area Resolution Flow

1. **Detection:** User browser coordinates queried via `navigator.geolocation.getCurrentPosition()`.
2. **Boundary Testing:** Ray-casting Point-in-Polygon (`src/lib/geo/pointInPolygon.ts`) tests `[lng, lat]` against Area and Colony polygons.
3. **Fallback:** If coordinates fall outside all known service boundaries, the nearest substation centroid is resolved via Haversine great-circle distance.
4. **Manual Selector:** State $\rightarrow$ Substation $\rightarrow$ Colony cascading picker.
5. **Persistence:** Saved in `localStorage` under `gs.location.v1`. Changing location re-scopes all telemetry, alerts, and forecasts across both portals instantly.

---

## 3. Realtime Alert Pipeline (PH → Public)

- **Transport (`src/lib/realtime/RealtimeClient.ts`):** `BroadcastChannel` with `storage` event fallback.
- **Publishing:** Operator in Power House publishes alert or approves an ML recommendation.
- **Delivery:** Immediate (< 1s) delivery to all browser tabs open to the Public portal of the matching area.
- **Scoping:** Alerts are tagged with `scope.level` and `scope.ids`. Public residents only receive notices relevant to their local feeder and substation.

---

## 4. Access Control & Security Boundaries

- **Roles:** `operator` (`POWER_HOUSE`) and `public` (`PUBLIC` resident).
- **Public $\rightarrow$ PH:** Strictly prohibited in UI. All links and navigation references to Power House are removed from the Public Shell. Route guard (`src/guards/RequireRole.tsx`) redirects unauthorized URL hits to `/colony`.
- **PH $\rightarrow$ Public Preview:** Operators can click "View as Public" to inspect the citizen experience for their area. A persistent amber banner reminds them they are in preview mode with an instant "Back to Power House" return action.
- *Security Note:* Client-side guards provide interface isolation. Real enforcement in production requires server-side JWT verification, role claims, and Row-Level Security (RLS). No API secrets or tokens are stored in the client codebase.

---

## 5. Phone Notifications & Escalation Architecture

- **Escalation Policy:**
  - `info` / `advisory` $\rightarrow$ In-App + Web Push
  - `warning` $\rightarrow$ Push + WhatsApp Cloud / Telegram Bot
  - `critical` (Grid Outage, Emergency Cut) $\rightarrow$ Push + WhatsApp + **TRAI DLT Approved SMS**
- **TRAI DLT Compliance:** SMS templates (`src/data/smsTemplates.ts`) adhere to Indian regulatory character limits (≤ 160 characters) and pre-approved sender ID formats.
- **Privacy (DPDP Act 2023):** Explicit consent checkbox, masked phone numbers (`+91 98*** ***12`), mock OTP verification, and single-click unsubscribe.

---

## 6. Carbon Accounting Standards

- **Formula:**
  $$\text{Emissions Today (kg CO}_2) = \text{Grid Import (kWh)} \times 0.716\text{ kg CO}_2/\text{kWh}$$
  $$\text{Avoided Emissions Today (kg CO}_2) = (\text{Solar + Wind + Battery Discharge (kWh)}) \times 0.716\text{ kg CO}_2/\text{kWh}$$
- **Emission Factor:** Sourced from Central Electricity Authority (CEA) Baseline Database for the Indian Power Sector, User Guide v19 (weighted average national grid factor).
- **Ecology Metric:** 1 mature tree absorbs $\approx 0.0596\text{ kg CO}_2/\text{day}$ (ICAR / UNFCCC forestry standards).
