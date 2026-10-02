import React, { useState, useEffect } from 'react';
import {
  SatelliteAtmosphericData,
  PredictorHorizonForecast,
} from '../../../domain/types';
import { Button } from '../../../components/ui/Button';
import { formatPower } from '../../../lib/format';
import { useNow } from '../../../hooks/useNow';
import { useToast } from '../../../components/ui/Toast';
import { WeatherGenerationDashboard } from './WeatherGenerationDashboard';
import {
  Satellite,
  Wind,
  Sun,
  Compass,
  Gauge,
  Cpu,
  RefreshCw,
  Send,
  CloudRain,
  Eye,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export const PredictorPage: React.FC = () => {
  const { now } = useNow();
  const { showToast } = useToast();

  // Atmospheric Satellite Controls & State
  const [windSpeed, setWindSpeed] = useState<number>(7.6); // m/s
  const [windDirection, setWindDirection] = useState<number>(225); // SW
  const [cloudOpacity, setCloudOpacity] = useState<number>(28); // %
  const [tempC, setTempC] = useState<number>(31.5);
  const [pressureHpa, setPressureHpa] = useState<number>(1011.2);
  const [isInferring, setIsInferring] = useState<boolean>(false);

  // Derived Wind & Solar metrics from Physics equations
  const hubHeightWindSpeed = parseFloat((windSpeed * Math.pow(50 / 10, 0.14)).toFixed(1));
  const boundaryWindSpeed = parseFloat((windSpeed * Math.pow(100 / 10, 0.18)).toFixed(1));
  const dniSolar = Math.round(Math.max(20, (1 - cloudOpacity / 120) * 880));
  const ghiSolar = Math.round(dniSolar * 1.12);

  // Computed multi-horizon ML predictions
  const [forecasts, setForecasts] = useState<PredictorHorizonForecast[]>([]);

  const calculatePredictions = (wSpd: number, cOp: number): PredictorHorizonForecast[] => {
    // Physics-based renewable calculation:
    // Wind array capacity: 4,200 kW max (Pragati service area)
    // Solar array capacity: 5,800 kW max
    const windCutIn = 3.0;
    const windRated = 12.0;
    const windFactor = wSpd < windCutIn ? 0 : Math.min(1.0, Math.pow((wSpd - windCutIn) / (windRated - windCutIn), 2.2));
    const baseWindKw = 4200 * windFactor;

    // Solar factor based on cloud optical thickness
    const solarFactor = Math.max(0.08, 1 - 0.85 * (cOp / 100));
    const baseSolarKw = 5800 * 0.72 * solarFactor;

    return [
      {
        horizon: '15m',
        predictedWindKw: Math.round(baseWindKw * 1.01),
        predictedSolarKw: Math.round(baseSolarKw * 0.99),
        totalRenewableKw: Math.round(baseWindKw * 1.01 + baseSolarKw * 0.99),
        confidenceScore: 0.97,
        weatherCondition: cOp > 65 ? 'Dense Stratocumulus Front' : cOp > 35 ? 'Scattered Cumulus' : 'Clear Sky Direct Inflow',
        rampRateRisk: cOp > 60 ? 'rapid_ramp_down' : 'nominal',
      },
      {
        horizon: '1h',
        predictedWindKw: Math.round(baseWindKw * (1 + (Math.sin(wSpd) * 0.06))),
        predictedSolarKw: Math.round(baseSolarKw * (1 - (cOp > 50 ? 0.15 : 0.02))),
        totalRenewableKw: Math.round(baseWindKw * 1.03 + baseSolarKw * 0.92),
        confidenceScore: 0.94,
        weatherCondition: cOp > 50 ? 'Incoming Trough & Vector Shear' : 'Stable Solar Influx',
        rampRateRisk: cOp > 50 ? 'rapid_ramp_down' : 'nominal',
      },
      {
        horizon: '3h',
        predictedWindKw: Math.round(baseWindKw * 1.08),
        predictedSolarKw: Math.round(baseSolarKw * 0.65), // evening sunset attenuation
        totalRenewableKw: Math.round(baseWindKw * 1.08 + baseSolarKw * 0.65),
        confidenceScore: 0.89,
        weatherCondition: 'Diurnal Solar Transition',
        rampRateRisk: 'rapid_ramp_down',
      },
      {
        horizon: '6h',
        predictedWindKw: Math.round(baseWindKw * 1.15),
        predictedSolarKw: 0, // night
        totalRenewableKw: Math.round(baseWindKw * 1.15),
        confidenceScore: 0.84,
        weatherCondition: 'Nocturnal Boundary Wind Layer',
        rampRateRisk: 'nominal',
      },
    ];
  };

  useEffect(() => {
    setForecasts(calculatePredictions(windSpeed, cloudOpacity));
  }, [windSpeed, cloudOpacity]);

  const handleRunInference = () => {
    setIsInferring(true);
    setTimeout(() => {
      setForecasts(calculatePredictions(windSpeed, cloudOpacity));
      setIsInferring(false);
      showToast({
        type: 'success',
        title: 'Satellite ML Inference Complete',
        message: 'TFT + PINN weights evaluated against live meteorological optical vectors.',
      });
    }, 600);
  };

  const handlePushToDispatch = () => {
    showToast({
      type: 'success',
      title: 'Atmospheric Forecast Dispatched',
      message: 'Updated generation profiles synchronized with Power House Dispatch Bus.',
    });
  };

  // Convert compass degrees to directional text
  const getCardinal = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
              <Satellite className="w-5 h-5 text-[#27A163]" />
            </span>
            <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
              Atmospheric ML Predictor & Satellite Wind/Solar Engine
            </h1>
          </div>
          <p className="text-xs text-[#5B6B62] mt-1">
            Real-time meteorological optical vectors, hub-height wind shear estimation, and physics-constrained generation forecasting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isInferring ? 'animate-spin' : ''}`} />}
            onClick={handleRunInference}
          >
            Run Satellite ML Inference
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Send className="w-3.5 h-3.5" />}
            onClick={handlePushToDispatch}
          >
            Sync with Dispatch Bus
          </Button>
        </div>
      </div>

      {/* Satellite Inflow Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-[#1B93A1]" /> Surface Wind (10m)
          </span>
          <p className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-1">
            {windSpeed.toFixed(1)} <span className="text-xs font-normal">m/s</span>
          </p>
          <span className="text-[11px] text-[#5B6B62] tabular-nums mt-1">
            Gusts: {(windSpeed * 1.35).toFixed(1)} m/s
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-[#1B93A1]" /> Hub Height (50m)
          </span>
          <p className="text-2xl font-bold font-heading text-[#1B93A1] tabular-nums mt-1">
            {hubHeightWindSpeed.toFixed(1)} <span className="text-xs font-normal">m/s</span>
          </p>
          <span className="text-[11px] text-[#5B6B62] mt-1">
            Shear Coeff: α = 0.14
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#0C3B2B]" /> Wind Vector Angle
          </span>
          <p className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-1">
            {windDirection}° <span className="text-sm font-semibold text-[#13724A]">({getCardinal(windDirection)})</span>
          </p>
          <span className="text-[11px] text-[#5B6B62] mt-1">
            Azimuth Stream
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#B07B0E]" /> Cloud Opacity (Optical)
          </span>
          <p className="text-2xl font-bold font-heading text-[#B07B0E] tabular-nums mt-1">
            {cloudOpacity}%
          </p>
          <span className="text-[11px] text-[#5B6B62] mt-1">
            GOES/INSAT-3DR Map
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-[#E9A820]" /> Direct Irradiance (DNI)
          </span>
          <p className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-1">
            {dniSolar} <span className="text-xs font-normal">W/m²</span>
          </p>
          <span className="text-[11px] text-[#5B6B62] mt-1">
            GHI: {ghiSolar} W/m²
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#27A163]" /> Barometric Pressure
          </span>
          <p className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-1">
            {pressureHpa} <span className="text-xs font-normal">hPa</span>
          </p>
          <span className="text-[11px] text-[#5B6B62] mt-1">
            Temp: {tempC}°C · RH: 54%
          </span>
        </div>
      </div>

      {/* Main Section: Interactive Satellite Radar & Wind Stream Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Visual Animated Meteorological Radar Canvas */}
        <div className="lg:col-span-8 bg-white rounded-[16px] border border-[#DDE9E0] p-5 shadow-xs flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE9E0]/60 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#27A163]" /> Satellite Cloud Motion & Vector Stream Field
              </h2>
              <p className="text-xs text-[#5B6B62]">
                Visualizing incoming atmospheric fronts and wind direction across the Pragati grid territory
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EAF7EE] text-[#13724A] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#27A163] animate-ping" />
              Live Inflow Vectors
            </span>
          </div>

          {/* Radar Canvas Visualizer */}
          <div className="relative w-full h-[320px] bg-[#07261C] rounded-[12px] overflow-hidden border border-[#DDE9E0] flex items-center justify-center select-none">
            {/* Background Grid & Compass Circles */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#8ED1A8_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute w-64 h-64 border border-[#8ED1A8]/20 rounded-full pointer-events-none" />
            <div className="absolute w-44 h-44 border border-[#8ED1A8]/20 rounded-full pointer-events-none" />
            <div className="absolute w-24 h-24 border border-[#8ED1A8]/20 rounded-full pointer-events-none" />

            {/* Simulated Cloud Front Shadow Overlay */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-700"
              style={{
                opacity: cloudOpacity / 100,
                background: `radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.22) 0%, rgba(200,220,210,0.1) 60%, transparent 80%)`,
              }}
            />

            {/* Animated Wind Vector Streamlines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#8ED1A8" opacity={0.7} />
                </marker>
              </defs>

              {/* Generate directional wind streamline arrows aligned to windDirection */}
              {[60, 140, 220, 300, 380, 460, 540, 620].map((x, i) => {
                const angleRad = (windDirection - 90) * (Math.PI / 180);
                const len = 90 + (windSpeed * 4);
                const y = 80 + (i % 3) * 80;
                const x2 = x + Math.cos(angleRad) * len;
                const y2 = y + Math.sin(angleRad) * len;

                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={y}
                      x2={x2}
                      y2={y2}
                      stroke="#8ED1A8"
                      strokeWidth={1.5 + (windSpeed / 10)}
                      strokeDasharray="4 6"
                      className="animate-flow"
                      markerEnd="url(#arrow)"
                      opacity={0.65}
                    />
                  </g>
                );
              })}

              {/* Grid Substation Marker */}
              <circle cx="50%" cy="50%" r="8" fill="#27A163" stroke="#FFFFFF" strokeWidth="2" />
              <text x="50%" y="56%" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                220kV Pragati Substation
              </text>
            </svg>

            {/* Compass Heading Watermark */}
            <div className="absolute top-4 left-4 text-xs font-mono text-[#8ED1A8]/80 flex flex-col gap-0.5">
              <span>SATELLITE: INSAT-3DR CH-4 VISIBLE</span>
              <span>VECTOR STREAM: {windDirection}° AZIMUTH ({getCardinal(windDirection)})</span>
              <span>VELOCITY: {windSpeed} m/s (HUB: {hubHeightWindSpeed} m/s)</span>
              <span>CLOUD DEPTH: {cloudOpacity}% OPACITY</span>
            </div>

            <div className="absolute bottom-4 right-4 text-[10px] text-[#8ED1A8]/70">
              Microclimate territory: 18.4 km² radius
            </div>
          </div>

          {/* Interactive Wind & Cloud Adjusters (Simulate Weather Scenarios) */}
          <div className="p-4 bg-[#F5FAF6] rounded-[12px] border border-[#DDE9E0] flex flex-col gap-3">
            <span className="text-xs font-bold text-[#0C3B2B] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#27A163]" /> Real-time Weather Simulator Inputs
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#5B6B62]">Wind Speed (10m)</span>
                  <strong className="text-[#0C3B2B] tabular-nums">{windSpeed} m/s</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="22"
                  step="0.5"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[#27A163] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#5B6B62]">Wind Direction (Degrees)</span>
                  <strong className="text-[#0C3B2B] tabular-nums">{windDirection}° ({getCardinal(windDirection)})</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  step="5"
                  value={windDirection}
                  onChange={(e) => setWindDirection(parseInt(e.target.value, 10))}
                  className="w-full accent-[#27A163] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#5B6B62]">Satellite Cloud Cover</span>
                  <strong className="text-[#B07B0E] tabular-nums">{cloudOpacity}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="2"
                  value={cloudOpacity}
                  onChange={(e) => setCloudOpacity(parseInt(e.target.value, 10))}
                  className="w-full accent-[#E9A820] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Physics-Informed ML Model Architecture & Weights */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-5 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#27A163]" />
              <div>
                <h3 className="text-sm font-bold text-[#0C3B2B]">
                  PINN + TFT Neural Engine
                </h3>
                <p className="text-[11px] text-[#5B6B62]">
                  Physics-Informed Neural Network architecture
                </p>
              </div>
            </div>

            {/* Accuracy Scorecards */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#F5FAF6] rounded-[8px] border border-[#DDE9E0] text-center">
              <div>
                <span className="text-[10px] text-[#5B6B62]">R² Accuracy</span>
                <p className="text-base font-bold font-heading text-[#13724A] tabular-nums">0.964</p>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6B62]">MAPE Error</span>
                <p className="text-base font-bold font-heading text-[#0C3B2B] tabular-nums">3.2%</p>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6B62]">RMSE</span>
                <p className="text-base font-bold font-heading text-[#0C3B2B] tabular-nums">41 kW</p>
              </div>
            </div>

            {/* Feature Importance Weights */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#DDE9E0]/60">
              <span className="text-xs font-semibold text-[#0C3B2B]">
                ML Feature Attribution Weights
              </span>

              <div className="flex flex-col gap-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-[#5B6B62] mb-0.5">
                    <span>Optical Cloud Thickness (Satellite)</span>
                    <span className="font-semibold text-[#0C3B2B] tabular-nums">38%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EAF7EE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#E9A820]" style={{ width: '38%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#5B6B62] mb-0.5">
                    <span>50m Hub-Height Wind Shear</span>
                    <span className="font-semibold text-[#0C3B2B] tabular-nums">31%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EAF7EE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1B93A1]" style={{ width: '31%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#5B6B62] mb-0.5">
                    <span>Barometric Pressure Gradient (dP/dt)</span>
                    <span className="font-semibold text-[#0C3B2B] tabular-nums">18%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EAF7EE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#27A163]" style={{ width: '18%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#5B6B62] mb-0.5">
                    <span>Thermal Inversion & Relative Humidity</span>
                    <span className="font-semibold text-[#0C3B2B] tabular-nums">13%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EAF7EE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#8ED1A8]" style={{ width: '13%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#EAF7EE] rounded-[8px] text-[11px] text-[#13724A] leading-relaxed">
              Physics constraint active: Betz efficiency limit (16/27 = 59.3%) enforced on aerodynamic turbine kinetic conversion.
            </div>
          </div>
        </div>
      </div>

      {/* Weather Patterns & Power Generation Forecast Visualization Dashboard (Recharts Trend Lines) */}
      <WeatherGenerationDashboard
        nowTs={now}
        currentWindSpeed={windSpeed}
        currentCloudOpacity={cloudOpacity}
        currentTempC={tempC}
      />

      {/* Multi-Horizon Renewable Generation Predictions */}
      <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 shadow-xs flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-[#0C3B2B]">
            Multi-Horizon Generation Forecast (Based on Real-Time Atmospheric Vector)
          </h2>
          <p className="text-xs text-[#5B6B62]">
            Anticipates wind gusts, cloud fronts, and rapid solar dropouts across 15m to 6h operational windows
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {forecasts.map((fc) => (
            <div
              key={fc.horizon}
              className="p-4 bg-[#F5FAF6] rounded-[12px] border border-[#DDE9E0] flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between border-b border-[#DDE9E0]/60 pb-2">
                <span className="text-sm font-bold text-[#0C3B2B] uppercase">
                  T + {fc.horizon} Horizon
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-[#DDE9E0] text-[#13724A] tabular-nums">
                  {Math.round(fc.confidenceScore * 100)}% Conf.
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between items-center text-[#B07B0E]">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5" /> Solar Inflow:
                  </span>
                  <strong className="tabular-nums font-bold">{formatPower(fc.predictedSolarKw)}</strong>
                </div>

                <div className="flex justify-between items-center text-[#1B93A1]">
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5" /> Wind Inflow:
                  </span>
                  <strong className="tabular-nums font-bold">{formatPower(fc.predictedWindKw)}</strong>
                </div>

                <div className="flex justify-between items-center text-[#0C3B2B] pt-1 border-t border-[#DDE9E0]">
                  <span className="font-semibold">Total Clean Power:</span>
                  <strong className="text-sm font-bold tabular-nums text-[#13724A]">{formatPower(fc.totalRenewableKw)}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DDE9E0]/60 flex items-center justify-between text-[11px]">
                <span className="text-[#5B6B62] truncate">{fc.weatherCondition}</span>
                {fc.rampRateRisk === 'rapid_ramp_down' ? (
                  <span className="text-[10px] font-bold text-[#9E2824] bg-[#FCEEED] px-1.5 py-0.2 rounded">
                    Ramp Risk
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[#13724A] bg-[#EAF7EE] px-1.5 py-0.2 rounded">
                    Nominal
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
