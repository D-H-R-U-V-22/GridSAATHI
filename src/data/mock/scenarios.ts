export type ScenarioType =
  | 'normal'
  | 'cloudCover'
  | 'windLull'
  | 'heatWave'
  | 'feederFault'
  | 'plannedMaintenance';

export interface ActiveScenario {
  type: ScenarioType;
  label: string;
  description: string;
  appliedAt: number;
  targetId?: string; // feederId or areaId
  durationMs?: number;
}

export class ScenarioManager {
  private activeScenarios: Map<ScenarioType, ActiveScenario> = new Map();

  applyScenario(scenario: ActiveScenario) {
    if (scenario.type === 'normal') {
      this.reset();
      return;
    }
    this.activeScenarios.set(scenario.type, scenario);
  }

  removeScenario(type: ScenarioType) {
    this.activeScenarios.delete(type);
  }

  hasScenario(type: ScenarioType): boolean {
    return this.activeScenarios.has(type);
  }

  getScenario(type: ScenarioType): ActiveScenario | undefined {
    return this.activeScenarios.get(type);
  }

  getAll(): ActiveScenario[] {
    return Array.from(this.activeScenarios.values());
  }

  reset() {
    this.activeScenarios.clear();
  }
}

export const scenarioManager = new ScenarioManager();
