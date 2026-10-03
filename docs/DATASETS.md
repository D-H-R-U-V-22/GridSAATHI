# GridSaathi — Datasets & Data Adapters (India-First)

This document specifies the data sources, access models, and roadmap for transitioning GridSaathi from the current simulated/live prototype to the machine learning and backend ingestion phases.

---

## 1. Dataset Matrix

| Data Need | Source (India) | Access / Protocol | Prototype Usage (Frontend Now) | ML Training Phase | Production Backend Phase |
|---|---|---|---|---|---|
| **Live Weather Forecast** | **Open-Meteo Forecast API** | Free, Keyless REST API (non-commercial) | Live per area coordinates via `src/lib/data/openMeteo.ts` (cached 15m) | Feature vectors for solar/wind models | Hourly cron ingestion + Redis cache |
| **Official Weather Warnings** | **IMD** (India Meteorological Dept) District Warnings & **NDMA Sachet CAP Feed** | Public RSS/XML / Web Scraper | Simulated alerts with realistic IMD nowcast payloads | Ground-truth labels for weather risk model | Ingestion pipeline parsing CAP feeds |
| **Historical Meteorological Series** | **NASA POWER** & **ERA5** via Open-Meteo Historical | Free REST APIs | Not needed in frontend | 10-year training set (DNI, GHI, wind at 10m/50m/100m) | Baseline climatology tables |
| **Renewable Resource Atlases** | **Global Solar Atlas (World Bank)**, **NIWE** (National Institute of Wind Energy) | Public GIS GeoTIFFs & Open downloads | Sample priors per demo area in `areas.json` | Prior distributions for generation models | Static GIS layers |
| **Actual Grid Generation & Demand** | **Grid-India (POSOCO)** Daily PSP Reports, **CEA** Daily Generation Reports, **State SLDC** Dashboards | Public PDF/Excel & HTML tables | Synthetic load curves matching daily Indian demand shapes | Supervised training for regional load forecasts | Daily automated scraping |
| **Feeder & Household Load Shapes** | **BEE Star-Label Data**, **NFHS-5** Household Amenities, **CEA EPS** (Electric Power Survey) | Public Survey Data | Disaggregated appliance wattages & deferral profiles | Non-Intrusive Load Monitoring (NILM) model | Smart meter (AMI) MQTT feeds |
| **Grid Emission Factors** | **CEA CO₂ Baseline Database for the Indian Power Sector** | Annual public publication (v19) | Constant `0.716 kg CO₂/kWh` in `src/lib/carbon.ts` | Carbon abatement objective functions | Annual config update via CEA releases |
| **Substation Boundaries & Administrative Codes** | **LGD (Local Government Directory)** & OpenStreetMap | Public Open Data | Polygons & coordinates in `src/data/areas.json` | Spatial joins for regional models | DISCOM GIS boundary synchronization |
| **Gazetted Holidays & Festivals** | Ministry of Personnel / State Gazettes | Curated static table | In-memory calendar for demand peaks (Diwali, Holi, summer heatwave) | Seasonal holiday dummy variables | National holiday API |
| **Battery Energy Storage Specs** | **SECI / MNRE BESS Tender Specifications** | Public Tender Docs | LFP chemistry profiles (88% round-trip efficiency, 0.5C rate) | BESS degradation & dispatch optimization | Battery Management System (BMS) telemetry |

---

## 2. Transition Plan

1. **Frontend Phase (Current):**
   - Direct client fetch to Open-Meteo for real-time solar irradiance, cloud cover, and wind vectors.
   - Deterministic multi-area simulator for 11kV feeder telemetry and community battery states.
   - Clean typed interfaces: `PredictionProvider`, `RealtimeClient`, `NotificationService`, `ReverseGeocoder`.

2. **ML Phase (Next):**
   - Train Temporal Fusion Transformer (TFT) on 5-year ERA5 and Grid-India time series.
   - Physics-Informed Neural Network (PINN) enforcing the Betz aerodynamic limit ($16/27 = 59.3\%$) and PV temperature derating ($-0.38\%/^\circ\text{C}$).
   - Replace `MockPredictionProvider` with `HttpPredictionProvider` calling the Python ML inference microservice.

3. **Backend Phase (Final):**
   - Node.js / Express backend with PostgreSQL (Cloud SQL) or Firestore.
   - Server-side JWT authentication with distinct `POWER_HOUSE` and `RESIDENT` roles.
   - Real SMS dispatch via TRAI DLT approved gateway (Fast2SMS / MSG91) and WhatsApp Business Cloud API.
