import { AlertType, Severity } from '../domain/types';

export interface AlertTemplate {
  id: string;
  type: AlertType;
  severity: Severity;
  titleEn: string;
  bodyEn: string;
  titleHi: string;
  bodyHi: string;
}

export const ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: 'tpl-cloud-drop',
    type: 'weather',
    severity: 'advisory',
    titleEn: 'Dense Cloud Cover — Solar Generation Drop',
    bodyEn: 'Heavy overcast is predicted to reduce rooftop and solar feeder supply by 65%. Please conserve power between 1:00 pm and 4:30 pm.',
    titleHi: 'घने बादल — सौर ऊर्जा उत्पादन में भारी गिरावट',
    bodyHi: 'घने बादलों के कारण सौर ऊर्जा आपूर्ति में 65% कमी का अनुमान है। कृपया दोपहर 1:00 से 4:30 के बीच बिजली की बचत करें।',
  },
  {
    id: 'tpl-wind-lull',
    type: 'weather',
    severity: 'warning',
    titleEn: 'Wind Generation Lull Alert',
    bodyEn: 'Surface wind speeds have dropped below 3.0 m/s in Peri-Urban zones. Renewable inflow is constrained through evening hours.',
    titleHi: 'हवा की गति धीमी — पवन ऊर्जा चेतावनी',
    bodyHi: 'हवा की गति 3.0 m/s से कम होने के कारण शाम के समय हरित ऊर्जा प्रवाह सीमित रहेगा।',
  },
  {
    id: 'tpl-heatwave-surge',
    type: 'weather',
    severity: 'critical',
    titleEn: 'Heatwave Advisory — High Cooling Demand Surge',
    bodyEn: 'Ambient temperature reached 41°C. Grid demand is peaking across all feeders. Avoid running AC below 25°C and postpone heavy pump usage.',
    titleHi: 'लू का अलर्ट — कूलिंग लोड में भारी उछाल',
    bodyHi: 'तापमान 41°C पहुंचने से ग्रिड पर भारी लोड है। कृपया एसी का तापमान 25°C से कम न रखें और भारी पंप न चलाएं।',
  },
  {
    id: 'tpl-feeder-overload',
    type: 'high_load',
    severity: 'warning',
    titleEn: 'Feeder Load Exceeded 90% Threshold',
    bodyEn: 'Feeder load is critically near rated limits. Local demand response initiated to avoid automated tripping.',
    titleHi: 'फीडर क्षमता 90% से अधिक लोड पर',
    bodyHi: 'फीडर पर लोड निर्धारित सीमा के करीब पहुंच गया है। ट्रिपिंग से बचने के लिए लोड नियंत्रण आवश्यक है।',
  },
  {
    id: 'tpl-dr-evening',
    type: 'demand_response',
    severity: 'warning',
    titleEn: 'Evening Demand Response: 6:00 pm – 9:00 pm',
    bodyEn: 'Renewable shortfall predicted during evening hours. Please pause geysers, washing machines, and water pumps for 3 hours.',
    titleHi: 'शाम की मांग नियंत्रण अपील: शाम 6:00 से रात 9:00',
    bodyHi: 'शाम के पीक समय सौर ऊर्जा न होने से आपूर्ति सीमित है। कृपया गीजर, वाशिंग मशीन व पानी के पंप बंद रखें।',
  },
  {
    id: 'tpl-maintenance',
    type: 'maintenance',
    severity: 'info',
    titleEn: 'Scheduled 11kV Substation Maintenance',
    bodyEn: 'Transformer servicing scheduled for tomorrow from 10:00 am to 12:30 pm. Community battery storage will support basic lighting.',
    titleHi: 'नियमित 11kV सबस्टेशन रखरखाव',
    bodyHi: 'कल सुबह 10:00 से दोपहर 12:30 बजे तक ट्रांसफार्मर का रखरखाव रहेगा। सामुदायिक बैटरी आवश्यक रोशनी चालू रखेगी।',
  },
  {
    id: 'tpl-outage-restoration',
    type: 'outage',
    severity: 'critical',
    titleEn: 'Feeder Trip Detected — Restoration Underway',
    bodyEn: 'Transient cable fault isolated. Maintenance crew dispatched. Community battery backup has been permitted.',
    titleHi: 'फीडर ट्रिप — बहाली कार्य प्रगति पर',
    bodyHi: 'तकनीकी खराबी के कारण फीडर बंद हुआ है। मरम्मत टीम पहुंच चुकी है। बैटरी बैकअप सक्रिय कर दिया गया है।',
  },
];
