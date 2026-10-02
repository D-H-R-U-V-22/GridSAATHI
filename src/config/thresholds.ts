export const THRESHOLDS = {
  weather: {
    highCloudCoverPct: 65,     // triggers low solar warning
    lowWindSpeedMs: 3.5,       // triggers wind lull warning
    highTempC: 38.0,           // triggers heatwave peak demand surge
    heavyRainMm: 25.0,         // storm alert
  },
  load: {
    feederWatchPct: 80,        // yellow watch
    feederConstrainedPct: 90,  // orange constrained
    feederOverloadPct: 98,     // critical fault danger
    colonyWatchPct: 82,
    colonyConstrainedPct: 92,
  },
  storage: {
    batteryLowSocPct: 25,
    batteryCriticalSocPct: 15,
    emergencyReserveMins: 45,
  },
  forecast: {
    shortfallRiskKw: 50,       // highlight windows with shortfall >= 50 kW
    lookaheadHours: 24,
  },
};
