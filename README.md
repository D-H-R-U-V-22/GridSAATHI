# GridSaathi — Grid Reliability & Renewable Intermittency Management

Making clean power dependable, neighbourhood by neighbourhood.

GridSaathi is a full-featured, frontend-only distribution grid management platform that bridges renewable energy intermittency (solar, wind) through automated forecasting, smart load management, demand response, and shared community batteries.

---

## 1. How to Run

```bash
# Install dependencies
npm install

# Start the Vite development server on port 3000
npm run dev

# Build for production
npm run build
```

---

## 2. Grid Architecture & Hierarchy

```
Power House (220/66/11kV Substation)
 └─ Area / Zone (e.g. North Sector, Central Zone)
     └─ 11kV Feeder Line (e.g. Kisan Nagar, Shanti Vihar)
         └─ Colony Micro-Cluster (e.g. Shanti Vihar Colony) ── Community Battery Bank
             └─ Household (with appliance breakdown & load-shifting)
```

The app is divided into two connected portals:
1. **Power House Portal (`/powerhouse`)**: For substation dispatchers and DISCOM operators.
   - **Dashboard**: Interactive SVG grid schematic, live 24h Supply Ribbon, real-time demand-supply balance chart.
   - **ML Wind/Solar Predictor (`/powerhouse/predictor`)**: Real-time satellite optical vectors, INSAT cloud motion tracking, 10m/50m/100m wind shear vector fields, Physics-Informed Neural Network (PINN) + TFT generation forecasts, and an interactive **Recharts Visualization Dashboard** featuring dual-axis power generation area curves and dynamic trend lines for wind aerodynamic efficiency ($C_p$ %) and solar PV conversion performance ratio (PR %).
   - **Forecasting (`/powerhouse/forecast`)**: Multi-horizon predictions (6h, 24h, 7d) with p10–p90 confidence bands and automated shortfall window detection.
   - **Waste & Load Control (`/powerhouse/load-control`)**: Consumption baseline benchmarking (units/day), abnormal wastage surge detection (+18% to +35%), unmetered pump identification, and Volt-VAR Optimization (VVO) throttlers.
   - **Technical Loss & Asset Health (`/powerhouse/technical-loss`)**: Predictive transformer and 11kV cable maintenance, winding core temperature telemetry, insulation resistance ($M\Omega$), dissolved gas analysis (DGA), remaining useful life (RUL), and work order dispatching.
   - **Alerts**: Auto-drafted weather and high-load advisories, AlertComposer with "What Residents Will See" live preview.
   - **Smart Load Management**: Feeder status matrix, capacity utilisation heat-maps, soft shedding limits, and house load ranking.
   - **Demand Response**: Dispatch voluntary appliance postponement requests and monitor real-time response curves.
   - **Shared Storage Permissions**: Community battery health, emergency backup approvals, and pre-cut blackout countdowns.
   - **Settings**: Autonomous threshold triggers and Hindi/English templates.

2. **Public & Colony Portal (`/colony`)**: Mobile-first for residents and RWA committees.
   - **Home**: Plain-language status headline, 24h Supply Ribbon (status only), battery runtime.
   - **Forecast**: Supply outlook status and colony usage curve (today vs usual) with "Best hours for heavy appliances".
   - **Alerts & Messages (`/colony/messages`)**: Public feed and phone SMS thread inbox.
   - **Recommended Solutions & Action Plan (`/colony/recommendations`)**: Live citizen solutions and practical checklists generated from active Power House grid alerts, thunderstorm/weather vectors, peak demand response curtailment requests, and pre-cut blackout notifications.
   - **Backup & Outage (`/colony/storage`)**: Battery SoC gauge, blackout emergency backup requests, outage ETA log, and pre-cut consent.
   - **House Sub-portal (`/colony/houses/:houseId`)**: Household live draw, appliance breakdown donut, and demand-response checklist with "Done" checkboxes.

---

## 3. Real-Time Simulation Engine

- **Engine (`src/data/mock/simulator.ts`)**: Ticks every 2 seconds, advancing the simulated clock and computing telemetry for the entire topology.
- **Demand Curves (`src/data/mock/profiles.ts`)**: Follows realistic residential daily patterns: morning surge (6–9 am), midday dip, and sharp evening peak (6–10 pm).
- **Solar & Wind Generation**: Bell-shaped solar curve attenuated by simulated cloud cover (up to 85% drop), and wind speed power curve (cut-in 3 m/s, rated 12 m/s).
- **Scenario Lab (Shift+L or ?lab=1)**: Floating demo drawer allowing immediate testing of:
  - Dense Cloud Cover (solar -70%)
  - Wind Generation Lull (<2.2 m/s)
  - Heatwave Peak (+12°C, evening demand x1.25)
  - Feeder Fault (Shanti Vihar trip, 45m ETA)
  - Planned Pre-Cut Maintenance (pre-cut countdown)
  - Simulation Speed (1x, 10x, 60x)

---

## 4. Swapping MockDataSource with ApiDataSource

All pages and stores read from the abstract `DataSource` interface (`src/data/DataSource.ts`). To connect to a live backend (Node/Express, FastAPI, or Go):

1. Implement `ApiDataSource` in `src/data/api/ApiDataSource.ts`:
   ```ts
   export class ApiDataSource implements DataSource {
     async getTopology(): Promise<Topology> {
       const res = await fetch('/api/v1/topology');
       return res.json();
     }
     subscribe<T>(topic: Topic, cb: (payload: T) => void): () => void {
       const ws = new WebSocket(`${WS_URL}/topics/${topic}`);
       ws.onmessage = (e) => cb(JSON.parse(e.data));
       return () => ws.close();
     }
     async publishAlert(alert): Promise<Alert> {
       const res = await fetch('/api/v1/alerts', { method: 'POST', body: JSON.stringify(alert) });
       return res.json();
     }
     // ...implement other DataSource methods
   }
   ```
2. Replace `export const dataSource = new MockDataSource()` with `new ApiDataSource()` in `src/data/mock/MockDataSource.ts` (or dependency injection). No component code changes required.

---

## 5. Mapping ForecastProvider to Future ML Models

The `ForecastProvider` interface (`src/data/ForecastProvider.ts`) defines four methods:
1. `demand(scope, horizonH, nowTs)`: Maps to **ML Model 1 (Hierarchical Load Forecaster)** — e.g. Temporal Fusion Transformer (TFT) or XGBoost predicting load mean, p10, and p90.
2. `renewable(scope, horizonH, nowTs)`: Maps to **ML Model 2 (Solar & Wind Generation Forecaster)** — physical PV irradiance models combined with numerical weather prediction (NWP) wind vectors.
3. `shortfalls(scope, horizonH, nowTs)`: Maps to **ML Model 3 (Intermittency Shortfall Classifier & Risk Scorer)** — flags contiguous intervals where expected generation falls below required reserves.
4. `houseUsage(houseId, horizonH, nowTs)`: Maps to **ML Model 4 (Disaggregated Household Load Model)** — Non-Intrusive Load Monitoring (NILM) for appliance-level optimization.
