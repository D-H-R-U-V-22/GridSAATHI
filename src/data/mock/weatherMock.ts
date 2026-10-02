import { WeatherSnapshot } from '../../domain/types';

export class WeatherSimulator {
  private current: WeatherSnapshot;

  constructor() {
    this.current = {
      ts: Date.now(),
      cloudCoverPct: 22,
      windSpeedMs: 7.2,
      tempC: 32.5,
      rainMm: 0,
      uvIndex: 6.8,
    };
  }

  getSnapshot(ts: number): WeatherSnapshot {
    const d = new Date(ts);
    const hour = d.getHours() + d.getMinutes() / 60;
    
    // UV index follows sun
    let uv = 0;
    if (hour > 7 && hour < 18) {
      uv = Math.max(0, 9.5 * Math.sin(((hour - 7) / 11) * Math.PI) * (1 - this.current.cloudCoverPct / 120));
    }

    return {
      ...this.current,
      ts,
      uvIndex: parseFloat(uv.toFixed(1)),
    };
  }

  setCloudCover(pct: number) {
    this.current.cloudCoverPct = Math.max(0, Math.min(100, pct));
  }

  setWindSpeed(speedMs: number) {
    this.current.windSpeedMs = Math.max(0, Math.min(35, speedMs));
  }

  setTemp(tempC: number) {
    this.current.tempC = tempC;
  }

  setRain(rainMm: number) {
    this.current.rainMm = Math.max(0, rainMm);
  }

  step(stepSeconds = 2) {
    // Subtle natural drift
    const drift = (Math.random() - 0.49) * 0.15;
    this.current.windSpeedMs = Math.max(1.5, Math.min(18.0, this.current.windSpeedMs + drift));
  }

  reset() {
    this.current = {
      ts: Date.now(),
      cloudCoverPct: 22,
      windSpeedMs: 7.2,
      tempC: 32.5,
      rainMm: 0,
      uvIndex: 6.8,
    };
  }
}

export const weatherSim = new WeatherSimulator();
