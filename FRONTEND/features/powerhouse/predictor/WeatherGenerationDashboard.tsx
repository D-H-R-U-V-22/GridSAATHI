import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { formatPower } from '../../../lib/format';
import { formatTime12h } from '../../../lib/time';
import {
  Sun,
  Wind,
  TrendingUp,
  Activity,
  Layers,
  Thermometer,
  Sparkles,
  Info,
  Sliders,
} from 'lucide-react';

export interface WeatherGenerationDataPoint {
  ts: number;
  timeLabel: string;
  isForecast: boolean;
  // Weather dynamics
  windSpeed10m: number;      // m/s
  hubWindSpeed50m: number;   // m/s
  cloudOpacityPct: number;   // %
  solarDniWsqm: number;      // W/m²
  ambientTempC: number;      // °C
  // Generation (kW)
  solarGenKw: number;
  windGenKw: number;
  totalGenKw: number;
  // Efficiency Trend Lines (%)
  solarEfficiencyPct: number; // PV performance ratio % (accounting for temp derate & clouds)
  windEfficiencyPct: number;  // Turbine aero efficiency Cp % (vs Betz limit)
  combinedEfficiencyPct: number; // Overall fleet conversion efficiency %
}

interface WeatherGenerationDashboardProps {
  nowTs: number;
  currentWindSpeed: number;
  currentCloudOpacity: number;
  currentTempC: number;
}

export const WeatherGenerationDashboard: React.FC<WeatherGenerationDashboardProps> = ({
  nowTs,
  currentWindSpeed,
  currentCloudOpacity,
  currentTempC,
}) => {
  const [horizonHours, setHorizonHours] = useState<number>(24);
  const [chartMode, setChartMode] = useState<'combined' | 'efficiency' | 'weather'>('combined');
  const [visibleSeries, setVisibleSeries] = useState({
    solarGen: true,
    windGen: true,
    solarEff: true,
    windEff: true,
    cloudOpacity: false,
    windSpeed: false,
  });

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate realistic 24-hour continuous series with past actuals + forecast horizon
  const seriesData = useMemo(() => {
    const points: WeatherGenerationDataPoint[] = [];
    const stepMinutes = horizonHours <= 6 ? 15 : horizonHours <= 12 ? 30 : 60;
    const totalSteps = (horizonHours * 60) / stepMinutes;
    // Show 25% past actuals, 75% future predictions
    const pastSteps = Math.round(totalSteps * 0.25);
    const startTs = nowTs - pastSteps * stepMinutes * 60 * 1000;

    for (let i = 0; i <= totalSteps; i++) {
      const pointTs = startTs + i * stepMinutes * 60 * 1000;
      const isForecast = pointTs > nowTs;
      const date = new Date(pointTs);
      const hourOfDay = date.getHours() + date.getMinutes() / 60;

      // Realistic diurnal solar curve (sunrise ~6:00, peak ~12:30, sunset ~18:30)
      const solarZenithAngle = Math.max(0, Math.sin(((hourOfDay - 6) / 12) * Math.PI));
      const isDaytime = hourOfDay >= 6.0 && hourOfDay <= 18.5;

      // Cloud opacity dynamics (slight temporal fluctuation)
      const cloudNoise = Math.sin(pointTs / (1000 * 3600 * 2)) * 12;
      const effectiveCloud = Math.min(100, Math.max(5, currentCloudOpacity + cloudNoise));

      // Irradiance calculation
      const dni = isDaytime ? Math.round(solarZenithAngle * 890 * (1 - effectiveCloud / 130)) : 0;

      // Ambient temperature diurnal swing
      const tempNoise = Math.sin(((hourOfDay - 9) / 24) * 2 * Math.PI) * 5;
      const temp = currentTempC + tempNoise;

      // Wind speed variations (often pick up in afternoon and nocturnal low-level jet)
      const windSwing = Math.sin(((hourOfDay - 14) / 24) * 2 * Math.PI) * 2.2;
      const wSpeed = Math.max(1.8, currentWindSpeed + windSwing);
      const hubWSpeed = parseFloat((wSpeed * Math.pow(50 / 10, 0.14)).toFixed(1));

      // 1. Solar Generation (Rated 5,800 kW)
      // Cell temperature derate: -0.38% / °C above 25°C
      const cellTemp = temp + (dni / 800) * 22;
      const tempDerateFactor = 1 - 0.0038 * Math.max(0, cellTemp - 25);
      const solarGen = isDaytime
        ? Math.round(5800 * (dni / 950) * tempDerateFactor * (1 - effectiveCloud / 200))
        : 0;

      // 2. Solar Efficiency (Performance Ratio PR %):
      // Nominal cell efficiency is ~20.5%. Effective PR scales between 64% and 86% based on temp & cloud
      const solarEff = isDaytime
        ? parseFloat((19.8 * tempDerateFactor * (1 - effectiveCloud / 250)).toFixed(1))
        : 0;

      // 3. Wind Generation (Rated 4,200 kW)
      // Standard power curve: cut-in 3 m/s, rated 12 m/s
      const windFactor = hubWSpeed < 3.0 ? 0 : Math.min(1.0, Math.pow((hubWSpeed - 3.0) / (12.0 - 3.0), 2.2));
      const windGen = Math.round(4200 * windFactor);

      // 4. Wind Aerodynamic Efficiency (Cp Coefficient as % of Betz optimal 59.3%):
      // Range: 22% - 46.5% aerodynamic efficiency
      const windEff = hubWSpeed < 3.0
        ? 0
        : parseFloat(
            Math.min(
              47.5,
              Math.max(18.0, 44.5 - Math.abs(hubWSpeed - 8.5) * 2.8)
            ).toFixed(1)
          );

      // Combined Fleet Efficiency % (weighted by respective outputs)
      const totalGen = solarGen + windGen;
      const combinedEff = totalGen > 0
        ? parseFloat(((solarGen * (solarEff * 4.2) + windGen * (windEff * 2.1)) / (totalGen * 3.2)).toFixed(1))
        : parseFloat((windEff * 0.7).toFixed(1));

      points.push({
        ts: pointTs,
        timeLabel: formatTime12h(pointTs),
        isForecast,
        windSpeed10m: parseFloat(wSpeed.toFixed(1)),
        hubWindSpeed50m: hubWSpeed,
        cloudOpacityPct: Math.round(effectiveCloud),
        solarDniWsqm: dni,
        ambientTempC: parseFloat(temp.toFixed(1)),
        solarGenKw: solarGen,
        windGenKw: windGen,
        totalGenKw: totalGen,
        solarEfficiencyPct: solarEff,
        windEfficiencyPct: windEff,
        combinedEfficiencyPct: combinedEff,
      });
    }

    return points;
  }, [nowTs, currentWindSpeed, currentCloudOpacity, currentTempC, horizonHours]);

  // Current values at "Now" marker
  const nowPoint = seriesData.find((p) => p.isForecast) || seriesData[Math.floor(seriesData.length / 2)];

  return (
    <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 shadow-xs flex flex-col gap-5">
      {/* Top Section: Dashboard Title & Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE9E0]/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
              <TrendingUp className="w-5 h-5 text-[#27A163]" />
            </span>
            <h2 className="text-base font-bold text-[#0C3B2B]">
              Weather Patterns & Renewable Efficiency Forecast Dashboard
            </h2>
          </div>
          <p className="text-xs text-[#5B6B62] mt-0.5">
            Synchronized meteorological dynamics, generation output, and aerodynamic/photovoltaic efficiency trend lines
          </p>
        </div>

        {/* View Mode & Horizon Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Mode */}
          <div className="inline-flex p-1 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[6px] text-xs">
            <button
              onClick={() => setChartMode('combined')}
              className={`px-3 py-1 font-semibold rounded-[4px] transition-colors cursor-pointer ${
                chartMode === 'combined' ? 'bg-white text-[#0C3B2B] shadow-xs' : 'text-[#5B6B62] hover:text-[#16241D]'
              }`}
            >
              Dual Power & Efficiency
            </button>
            <button
              onClick={() => setChartMode('efficiency')}
              className={`px-3 py-1 font-semibold rounded-[4px] transition-colors cursor-pointer ${
                chartMode === 'efficiency' ? 'bg-white text-[#0C3B2B] shadow-xs' : 'text-[#5B6B62] hover:text-[#16241D]'
              }`}
            >
              Efficiency Trend Lines (%)
            </button>
            <button
              onClick={() => setChartMode('weather')}
              className={`px-3 py-1 font-semibold rounded-[4px] transition-colors cursor-pointer ${
                chartMode === 'weather' ? 'bg-white text-[#0C3B2B] shadow-xs' : 'text-[#5B6B62] hover:text-[#16241D]'
              }`}
            >
              Weather Patterns
            </button>
          </div>

          {/* Horizon Selection */}
          <div className="inline-flex p-1 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[6px] text-xs">
            {[6, 12, 24].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setHorizonHours(hrs)}
                className={`px-2.5 py-1 font-semibold rounded-[4px] transition-colors cursor-pointer tabular-nums ${
                  horizonHours === hrs ? 'bg-white text-[#13724A] shadow-xs' : 'text-[#5B6B62]'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards: Live Efficiency Ratios & Weather Drivers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B62] flex items-center gap-1.5 font-medium">
            <Sun className="w-3.5 h-3.5 text-[#E9A820]" /> Solar Conversion PR
          </span>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-heading text-[#B07B0E] tabular-nums">
              {nowPoint ? nowPoint.solarEfficiencyPct : 18.4}%
            </span>
            <span className="text-[11px] text-[#5B6B62]">Module PR</span>
          </div>
          <span className="text-[10px] text-[#5B6B62]">
            Thermal Derate: -0.38%/°C active
          </span>
        </div>

        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B62] flex items-center gap-1.5 font-medium">
            <Wind className="w-3.5 h-3.5 text-[#1B93A1]" /> Wind Aero Efficiency (Cp)
          </span>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-heading text-[#1B93A1] tabular-nums">
              {nowPoint ? nowPoint.windEfficiencyPct : 42.1}%
            </span>
            <span className="text-[11px] text-[#5B6B62] font-semibold">/ 59.3%</span>
          </div>
          <span className="text-[10px] text-[#5B6B62]">
            Near optimal tip-speed ratio ($\lambda$)
          </span>
        </div>

        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B62] flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-[#27A163]" /> Clean Power Forecast
          </span>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {nowPoint ? formatPower(nowPoint.totalGenKw, 1) : '—'}
            </span>
          </div>
          <span className="text-[10px] text-[#13724A] font-semibold">
            {nowPoint ? `${formatPower(nowPoint.solarGenKw, 0)} solar · ${formatPower(nowPoint.windGenKw, 0)} wind` : ''}
          </span>
        </div>

        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B62] flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#13724A]" /> Peak Efficiency Window
          </span>
          <div className="my-1">
            <span className="text-base font-bold font-heading text-[#0C3B2B]">
              11:00 AM – 2:30 PM
            </span>
          </div>
          <span className="text-[10px] text-[#13724A] font-medium">
            Estimated 84.8% combined conversion
          </span>
        </div>
      </div>

      {/* Series Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-[#FAFCF9] p-3 rounded-[8px] border border-[#DDE9E0]">
        <span className="text-[#5B6B62] font-medium flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" /> Toggle Visualization Series:
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visibleSeries.solarGen}
              onChange={() => toggleSeries('solarGen')}
              className="rounded text-[#E9A820] focus:ring-0"
            />
            <span className="flex items-center gap-1 text-[#B07B0E] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E9A820]" /> Solar Power (kW)
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visibleSeries.windGen}
              onChange={() => toggleSeries('windGen')}
              className="rounded text-[#1B93A1] focus:ring-0"
            />
            <span className="flex items-center gap-1 text-[#1B93A1] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1B93A1]" /> Wind Power (kW)
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visibleSeries.solarEff}
              onChange={() => toggleSeries('solarEff')}
              className="rounded text-[#B07B0E] focus:ring-0"
            />
            <span className="flex items-center gap-1 text-[#B07B0E] font-semibold">
              <span className="w-3 h-0.5 bg-[#B07B0E]" /> Solar Efficiency Trend (%)
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visibleSeries.windEff}
              onChange={() => toggleSeries('windEff')}
              className="rounded text-[#1B93A1] focus:ring-0"
            />
            <span className="flex items-center gap-1 text-[#1B93A1] font-semibold">
              <span className="w-3 h-0.5 bg-[#1B93A1]" /> Wind Aero Efficiency Trend (%)
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visibleSeries.cloudOpacity}
              onChange={() => toggleSeries('cloudOpacity')}
              className="rounded text-[#5B6B62] focus:ring-0"
            />
            <span className="flex items-center gap-1 text-[#5B6B62]">
              <span className="w-3 h-0.5 bg-[#5B6B62] border-t border-dashed" /> Cloud Opacity (%)
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visibleSeries.windSpeed}
              onChange={() => toggleSeries('windSpeed')}
              className="rounded text-[#0C3B2B] focus:ring-0"
            />
            <span className="flex items-center gap-1 text-[#0C3B2B]">
              <span className="w-3 h-0.5 bg-[#0C3B2B]" /> Hub Wind (m/s)
            </span>
          </label>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div style={{ width: '100%', height: 340 }} className="select-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={seriesData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="solarAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E9A820" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#E9A820" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="windAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B93A1" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#1B93A1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="timeLabel"
              tickLine={false}
              axisLine={{ stroke: '#DDE9E0' }}
              tick={{ fill: '#5B6B62', fontSize: 11 }}
            />

            {/* Left Y-Axis for Power (kW) when in Combined or Weather mode */}
            {chartMode !== 'efficiency' && (
              <YAxis
                yAxisId="leftPower"
                orientation="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#5B6B62', fontSize: 11 }}
                tickFormatter={(v) => formatPower(v, 0)}
              />
            )}

            {/* Right Y-Axis for Efficiency / Weather percentages (0 to 100%) */}
            <YAxis
              yAxisId="rightEff"
              orientation={chartMode === 'efficiency' ? 'left' : 'right'}
              tickLine={false}
              axisLine={false}
              domain={[0, 60]}
              tick={{ fill: '#13724A', fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as WeatherGenerationDataPoint;
                  return (
                    <div className="bg-white border border-[#DDE9E0] p-3 rounded-[10px] shadow-floating text-xs">
                      <div className="flex items-center justify-between gap-4 font-bold text-[#0C3B2B] mb-2 border-b border-[#DDE9E0]/60 pb-1">
                        <span>{pt.timeLabel}</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                            pt.isForecast ? 'bg-[#EAF7EE] text-[#13724A]' : 'bg-[#F5FAF6] text-[#5B6B62]'
                          }`}
                        >
                          {pt.isForecast ? 'ML Forecast' : 'Actual Telemetry'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 tabular-nums">
                        {/* Power figures */}
                        <div className="flex justify-between items-center text-[#B07B0E]">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Sun className="w-3 h-3" /> Solar Power:
                          </span>
                          <strong className="font-bold">{formatPower(pt.solarGenKw)}</strong>
                        </div>

                        <div className="flex justify-between items-center text-[#1B93A1]">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Wind className="w-3 h-3" /> Wind Power:
                          </span>
                          <strong className="font-bold">{formatPower(pt.windGenKw)}</strong>
                        </div>

                        {/* Efficiency Trend Figures */}
                        <div className="flex justify-between items-center text-[#0C3B2B] pt-1 border-t border-[#DDE9E0]/60">
                          <span className="font-semibold">Solar Efficiency (PR):</span>
                          <strong className="text-[#B07B0E] font-bold">{pt.solarEfficiencyPct}%</strong>
                        </div>

                        <div className="flex justify-between items-center text-[#0C3B2B]">
                          <span className="font-semibold">Wind Aero Efficiency (Cp):</span>
                          <strong className="text-[#1B93A1] font-bold">{pt.windEfficiencyPct}%</strong>
                        </div>

                        {/* Weather contextual values */}
                        <div className="flex justify-between items-center text-[#5B6B62] pt-1 border-t border-[#DDE9E0]/60 text-[11px]">
                          <span>DNI: {pt.solarDniWsqm} W/m² · Cloud: {pt.cloudOpacityPct}%</span>
                          <span>Hub Wind: {pt.hubWindSpeed50m} m/s ({pt.ambientTempC}°C)</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Now line dividing past readings and future forecast */}
            {nowPoint && (
              <ReferenceLine
                x={nowPoint.timeLabel}
                stroke="#07261C"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                yAxisId={chartMode !== 'efficiency' ? 'leftPower' : 'rightEff'}
                label={{
                  value: 'Now (Telemetry ↔ Forecast)',
                  position: 'insideTopLeft',
                  fill: '#07261C',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Solar Generation Area (When Visible) */}
            {chartMode !== 'efficiency' && visibleSeries.solarGen && (
              <Area
                yAxisId="leftPower"
                type="monotone"
                dataKey="solarGenKw"
                name="Solar Output"
                stroke="#E9A820"
                strokeWidth={1.75}
                fill="url(#solarAreaGradient)"
                isAnimationActive={false}
              />
            )}

            {/* Wind Generation Area (When Visible) */}
            {chartMode !== 'efficiency' && visibleSeries.windGen && (
              <Area
                yAxisId="leftPower"
                type="monotone"
                dataKey="windGenKw"
                name="Wind Output"
                stroke="#1B93A1"
                strokeWidth={1.75}
                fill="url(#windAreaGradient)"
                isAnimationActive={false}
              />
            )}

            {/* Solar Efficiency Trend Line (Amber) */}
            {visibleSeries.solarEff && (
              <Line
                yAxisId="rightEff"
                type="monotone"
                dataKey="solarEfficiencyPct"
                name="Solar Efficiency Trend (%)"
                stroke="#B07B0E"
                strokeWidth={2.5}
                dot={false}
                strokeDasharray={chartMode === 'efficiency' ? undefined : '5 5'}
                isAnimationActive={false}
              />
            )}

            {/* Wind Efficiency Trend Line (Cyan/Teal) */}
            {visibleSeries.windEff && (
              <Line
                yAxisId="rightEff"
                type="monotone"
                dataKey="windEfficiencyPct"
                name="Wind Aero Efficiency Trend (%)"
                stroke="#1B93A1"
                strokeWidth={2.5}
                dot={false}
                strokeDasharray={chartMode === 'efficiency' ? undefined : '5 5'}
                isAnimationActive={false}
              />
            )}

            {/* Weather Overlay: Cloud Opacity (%) */}
            {visibleSeries.cloudOpacity && (
              <Line
                yAxisId="rightEff"
                type="monotone"
                dataKey="cloudOpacityPct"
                name="Cloud Opacity (%)"
                stroke="#5B6B62"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Weather Overlay: Hub Wind Speed (m/s) */}
            {visibleSeries.windSpeed && (
              <Line
                yAxisId="rightEff"
                type="monotone"
                dataKey="hubWindSpeed50m"
                name="50m Hub Wind (m/s)"
                stroke="#0C3B2B"
                strokeWidth={1.75}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Physics & Efficiency Annotation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#DDE9E0]/60 text-xs text-[#5B6B62]">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#13724A] shrink-0" />
          <span>
            <strong>Physics Rule:</strong> Solar PR accounts for negative temperature derating (-0.38%/°C above 25°C) and diffuse cloud scattering. Wind Cp tracks the Betz aerodynamic conversion limit (59.3%).
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#B07B0E]" /> Solar Efficiency Trend (%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#1B93A1]" /> Wind Efficiency Trend (%)
          </span>
        </div>
      </div>
    </div>
  );
};
