import { GridAlert } from '../../types/alert';
import { ALL_AREAS } from '../geo/locate';

export interface MLRiskWindow {
  id: string;
  areaId: string;
  category: 'solar_dip' | 'evening_peak' | 'wind_lull' | 'feeder_overload';
  severity: 'advisory' | 'warning' | 'critical';
  title: { en: string; hi: string };
  reasoning: string;
  confidence: number;
  startsAt: string;
  endsAt: string;
  recommendedAction: { en: string; hi: string };
  affectedColonyIds: string[];
}

export interface MLRecommendation {
  id: string;
  areaId: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  category: 'demand_response' | 'storage' | 'feeder_throttle';
  urgency: 'immediate' | 'scheduled';
  projectedReliefKw: number;
  confidence: number;
  status: 'pending' | 'approved' | 'dismissed';
}

export interface PredictionProvider {
  getRiskWindows(areaId: string): Promise<MLRiskWindow[]>;
  getRecommendations(areaId: string): Promise<MLRecommendation[]>;
}

export class MockPredictionProvider implements PredictionProvider {
  async getRiskWindows(areaId: string): Promise<MLRiskWindow[]> {
    const area = ALL_AREAS.find((a) => a.id === areaId) || ALL_AREAS[0];
    const colonyId = area.colonies[0]?.id || 'colony-shanti-vihar';

    const now = new Date();
    const starts = new Date(now.getTime() + 45 * 60 * 1000).toISOString();
    const ends = new Date(now.getTime() + 195 * 60 * 1000).toISOString();

    if (area.climateProfile === 'semi_arid_high_solar') {
      return [
        {
          id: `rw-${area.id}-dust-1`,
          areaId: area.id,
          category: 'solar_dip',
          severity: 'warning',
          title: {
            en: 'High Aerosol Dust Layer Reducing Solar Output',
            hi: 'धूल कणों के कारण सौर ऊर्जा उत्पादन में कमी',
          },
          reasoning: 'MODIS AOD > 0.62 · Solar yield dropped 28% below forecast · 1:00–4:15 PM',
          confidence: 0.94,
          startsAt: starts,
          endsAt: ends,
          recommendedAction: {
            en: 'Issue voluntary demand-response request to defer water pump & AC loads',
            hi: 'पंप और एसी लोड स्थगित करने हेतु नागरिकों को मांग नियंत्रण सलाह जारी करें',
          },
          affectedColonyIds: [colonyId],
        },
      ];
    }

    if (area.climateProfile === 'western_ghats_wind') {
      return [
        {
          id: `rw-${area.id}-wind-1`,
          areaId: area.id,
          category: 'wind_lull',
          severity: 'advisory',
          title: {
            en: 'Thermal Wind Shear Attenuation Horizon',
            hi: 'हवा की गति में अस्थायी गिरावट पूर्वानुमान',
          },
          reasoning: 'Hub-height wind vector falling below 3.5 m/s cut-in · 5:30–8:00 PM',
          confidence: 0.88,
          startsAt: starts,
          endsAt: ends,
          recommendedAction: {
            en: 'Pre-charge community battery bank to 90% from midday solar before wind drop',
            hi: 'हवा थमने से पूर्व सामुदायिक बैटरी को दिन के सौर ऊर्जा से 90% तक चार्ज करें',
          },
          affectedColonyIds: [colonyId],
        },
      ];
    }

    // Default: Lucknow / Gangetic plains
    return [
      {
        id: `rw-${area.id}-cloud-1`,
        areaId: area.id,
        category: 'solar_dip',
        severity: 'warning',
        title: {
          en: 'Dense Monsoon Stratocumulus Front Approaching',
          hi: 'घने बादलों के कारण सौर ऊर्जा उत्पादन में भारी गिरावट',
        },
        reasoning: 'Cloud optical thickness 78% · Solar generation -42% · Expected 1:30–4:30 PM',
        confidence: 0.92,
        startsAt: starts,
        endsAt: ends,
        recommendedAction: {
          en: 'Postpone residential heavy inductive loads and arm shared battery backup',
          hi: 'भारी घरेलू उपकरणों का उपयोग टालें और सामुदायिक बैटरी बैकअप सक्रिय करें',
        },
        affectedColonyIds: [colonyId],
      },
    ];
  }

  async getRecommendations(areaId: string): Promise<MLRecommendation[]> {
    const area = ALL_AREAS.find((a) => a.id === areaId) || ALL_AREAS[0];

    return [
      {
        id: `rec-${area.id}-dr`,
        areaId: area.id,
        title: {
          en: 'Dispatch 90-Minute Voluntary Demand Response (1:30–3:00 PM)',
          hi: '90 मिनट का स्वैच्छिक मांग नियंत्रण (DR) अलर्ट जारी करें (1:30–3:00 PM)',
        },
        description: {
          en: 'Cloud cover is reducing rooftop solar. Relieves 450 kW on 11kV feeder lines with zero forced blackouts.',
          hi: 'बादलों के कारण सोलर उत्पादन कम है। बिना किसी बिजली कटौती के 450 kW लोड कम होगा।',
        },
        category: 'demand_response',
        urgency: 'immediate',
        projectedReliefKw: 450,
        confidence: 0.95,
        status: 'pending',
      },
      {
        id: `rec-${area.id}-battery`,
        areaId: area.id,
        title: {
          en: 'Arm Community Battery Storage for Emergency Medical/Water Circuit',
          hi: 'सामुदायिक बैटरी को पेयजल व क्लिनिक सर्किट के लिए आरक्षित करें',
        },
        description: {
          en: 'Pre-allocate 35% battery SoC to guarantee drinking water pump lifts during forecasted peak.',
          hi: 'पीक घंटों में पेयजल पंप चालू रखने के लिए 35% बैटरी आरक्षित रखें।',
        },
        category: 'storage',
        urgency: 'scheduled',
        projectedReliefKw: 180,
        confidence: 0.91,
        status: 'pending',
      },
    ];
  }
}

export const predictionProvider: PredictionProvider = new MockPredictionProvider();
