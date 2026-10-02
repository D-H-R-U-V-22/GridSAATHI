export function formatPower(kw: number, decimals = 1): string {
  if (Math.abs(kw) >= 1000) {
    return `${(kw / 1000).toFixed(decimals)} MW`;
  }
  return `${kw.toFixed(decimals)} kW`;
}

export function formatEnergy(kwh: number, decimals = 1): string {
  if (Math.abs(kwh) >= 1000) {
    return `${(kwh / 1000).toFixed(decimals)} MWh`;
  }
  return `${kwh.toFixed(decimals)} kWh`;
}

export function formatPercent(pct: number, decimals = 0): string {
  return `${pct.toFixed(decimals)}%`;
}

export function formatVoltage(v: number): string {
  return `${v.toFixed(1)} V`;
}

export function formatFrequency(hz: number): string {
  return `${hz.toFixed(2)} Hz`;
}
