/**
 * GridSaathi AI Voice Assistant Engine
 * Synthesizes real-time distribution grid telemetry & alerts into natural audio briefings (EN & HI)
 */

import { Alert } from '../../domain/types';
import { PowerHouseAreaEntity } from '../geo/locate';

export interface BriefingSection {
  title: string;
  text: string;
  category: 'status' | 'forecast' | 'alerts' | 'recommendations' | 'battery';
}

export interface VoiceBriefingData {
  portal: 'public' | 'powerhouse';
  headline: string;
  sections: BriefingSection[];
  fullScript: string;
}

export function buildPublicVoiceBriefing(params: {
  colonyName: string;
  areaName: string;
  status: string;
  demandKw: number;
  solarKw: number;
  batterySoc: number;
  batteryMins: number;
  alerts: Alert[];
  language: 'en' | 'hi';
}): VoiceBriefingData {
  const { colonyName, areaName, status, demandKw, solarKw, batterySoc, batteryMins, alerts, language } = params;
  const isHi = language === 'hi';

  const sections: BriefingSection[] = [];

  // 1. Grid Status Headline
  if (isHi) {
    let statusText = 'विद्युत आपूर्ति सामान्य और स्थिर है।';
    if (status === 'watch') statusText = 'ग्रिड पर दबाव है, कृपया भारी उपकरणों का प्रयोग सीमित रखें।';
    else if (status === 'constrained') statusText = 'ग्रिड अत्यधिक व्यस्त है, बिजली कटौती से बचने हेतु सहयोग करें।';
    else if (status === 'outage') statusText = 'क्षेत्र में तकनीकी फॉल्ट के कारण विद्युत आपूर्ति बाधित है।';

    sections.push({
      title: 'ग्रिड स्थिति',
      category: 'status',
      text: `नमस्ते। यह ग्रिडसाथी एआई का दैनिक अपडेट है। ${colonyName} में वर्तमान ${statusText} वर्तमान में कॉलोनी का कुल लोड ${Math.round(demandKw)} किलोवाट है, जिसमें स्थानीय सौर ऊर्जा से ${Math.round(solarKw)} किलोवाट स्वच्छ बिजली मिल रही है।`,
    });
  } else {
    let statusText = 'Power supply is stable and running nominally.';
    if (status === 'watch') statusText = 'Supply is under watch. Please avoid running heavy appliances simultaneously.';
    else if (status === 'constrained') statusText = 'Supply is highly constrained. Urgent load relief requested.';
    else if (status === 'outage') statusText = 'A feeder outage is currently active in this sector.';

    sections.push({
      title: 'Current Grid Status',
      category: 'status',
      text: `Hello. Here is your GridSaathi neighbourhood briefing for ${colonyName}. ${statusText} Current colony demand is ${Math.round(demandKw)} kilowatts, with ${Math.round(solarKw)} kilowatts supplied cleanly from local rooftop and feeder solar.`,
    });
  }

  // 2. Battery & Outage Readiness
  if (isHi) {
    sections.push({
      title: 'बैटरी बैकअप',
      category: 'battery',
      text: `सामुदायिक बैटरी बैंक ${batterySoc}% चार्ज है, जो किसी भी आकस्मिक कटौती में पेयजल पंप, प्राथमिक क्लिनिक और सीढ़ियों की लाइट के लिए लगभग ${batteryMins} मिनट का इमरजेंसी बैकअप प्रदान करेगा।`,
    });
  } else {
    sections.push({
      title: 'Community Battery',
      category: 'battery',
      text: `The community battery bank is armed at ${batterySoc}%, guaranteeing approximately ${batteryMins} minutes of emergency runtime for drinking water lift pumps, primary medical clinics, and common stairwell lighting.`,
    });
  }

  // 3. Active Alerts
  if (alerts.length > 0) {
    const alertSummaries = alerts.slice(0, 3).map((a) => {
      const text = isHi && a.bodyHi ? a.bodyHi : a.body;
      return `${a.title}: ${text}`;
    }).join(' ');

    sections.push({
      title: isHi ? 'सक्रिय अलर्ट' : 'Active Grid Notices',
      category: 'alerts',
      text: isHi
        ? `पावर हाउस सबस्टेशन द्वारा ${alerts.length} अलर्ट जारी किए गए हैं। ${alertSummaries}`
        : `There are ${alerts.length} active advisories issued by the substation dispatch console. ${alertSummaries}`,
    });
  } else {
    sections.push({
      title: isHi ? 'अलर्ट' : 'Alerts',
      category: 'alerts',
      text: isHi
        ? 'वर्तमान में कोई सक्रिय चेतावनी नहीं है। सभी वितरण लाइनें सुचारू रूप से कार्य कर रही हैं।'
        : 'There are no critical weather or line warnings at this moment.',
    });
  }

  // 4. Resident Action Advice
  if (isHi) {
    sections.push({
      title: 'सलाह',
      category: 'recommendations',
      text: 'यदि संभव हो, तो वाशिंग मशीन और इंडक्शन कुकटॉप को दोपहर के समय चलाएं जब सौर उत्पादन चरम पर होता है। ऊर्जा बचाने में सहयोग के लिए धन्यवाद।',
    });
  } else {
    sections.push({
      title: 'Citizen Tip',
      category: 'recommendations',
      text: 'Whenever possible, schedule water heaters and washing cycles between 11:00 AM and 2:30 PM to capitalize on free midday solar energy. Thank you for keeping our neighbourhood grid dependable.',
    });
  }

  const fullScript = sections.map((s) => s.text).join(' ');
  const headline = isHi
    ? `${colonyName} - एआई वॉइस बुलेटिन`
    : `${colonyName} — AI Grid Audio Briefing`;

  return { portal: 'public', headline, sections, fullScript };
}

export function buildPowerHouseVoiceBriefing(params: {
  area: PowerHouseAreaEntity;
  currentDemandKw: number;
  solarKw: number;
  windKw: number;
  activeAlertsCount: number;
  feeders: Array<{ name: string; capacityKw: number }>;
  language: 'en' | 'hi';
}): VoiceBriefingData {
  const { area, currentDemandKw, solarKw, windKw, activeAlertsCount, feeders, language } = params;
  const isHi = language === 'hi';

  const sections: BriefingSection[] = [];
  const totalRenewableKw = solarKw + windKw;
  const renewableSharePct = currentDemandKw > 0 ? Math.round((totalRenewableKw / currentDemandKw) * 100) : 45;

  if (isHi) {
    sections.push({
      title: 'सबस्टेशन अवलोकन',
      category: 'status',
      text: `पावर हाउस कंट्रोल सेंटर में स्वागत है। ${area.name.hi} का कुल लोड इस समय ${(currentDemandKw / 1000).toFixed(1)} मेगावाट है। सबस्टेशन की कुल क्षमता ${(area.capacityKw / 1000).toFixed(0)} मेगावाट है।`,
    });

    sections.push({
      title: 'नवीकरणीय उत्पादन',
      category: 'forecast',
      text: `वर्तमान नवीकरणीय ऊर्जा उत्पादन: सौर ऊर्जा ${(solarKw / 1000).toFixed(1)} मेगावाट और पवन ऊर्जा ${(windKw / 1000).toFixed(1)} मेगावाट। कुल मांग का ${renewableSharePct}% हिस्सा स्वच्छ ऊर्जा द्वारा पूरा हो रहा है।`,
    });

    sections.push({
      title: 'फीडर लोड व चेतावनी',
      category: 'alerts',
      text: `वर्तमान में ${feeders.length} ग्यारह केवी फीडर लाइनों पर टेलीमेट्री सक्रिय है। कुल ${activeAlertsCount} ऑटोमेटेड अलर्ट और प्रिडिक्शन वार्निंग डिस्पैच कंसोल में दर्ज हैं। संवेदनशील फीडरों पर लोड संतुलित रखें।`,
    });

    sections.push({
      title: 'एमएल अनुशंसा',
      category: 'recommendations',
      text: 'मशीन लर्निंग मॉडल दोपहर के बादलों को देखते हुए कम्युनिटी बैटरी को 90% तक चार्ज रखने और पीक आवर में स्वैच्छिक मांग नियंत्रण लागू करने की सलाह देता है।',
    });
  } else {
    sections.push({
      title: 'Substation Overview',
      category: 'status',
      text: `Power House Dispatch Briefing for ${area.name.en}. Current active substation throughput is ${(currentDemandKw / 1000).toFixed(1)} megawatts against a rated capacity of ${(area.capacityKw / 1000).toFixed(0)} megawatts.`,
    });

    sections.push({
      title: 'Renewable Telemetry',
      category: 'forecast',
      text: `Live renewable generation stands at ${(solarKw / 1000).toFixed(1)} megawatts solar, and ${(windKw / 1000).toFixed(1)} megawatts wind power. Renewable penetration is currently meeting ${renewableSharePct}% of total system demand.`,
    });

    sections.push({
      title: 'Feeder Operations & Alerts',
      category: 'alerts',
      text: `Telemetry is active across ${feeders.length} eleven kV radial feeders. There are ${activeAlertsCount} active grid advisories and weather risk windows currently published across the network.`,
    });

    sections.push({
      title: 'ML Dispatch Advisory',
      category: 'recommendations',
      text: 'Physics-informed load models recommend arming community battery banks ahead of forecasted cloud front attenuation, and maintaining voluntary demand response ready for evening peak.',
    });
  }

  const fullScript = sections.map((s) => s.text).join(' ');
  const headline = isHi
    ? `${area.name.hi} - पावर हाउस एआई वॉइस रिपोर्ट`
    : `${area.name.en} — Power House Dispatch Voice Briefing`;

  return { portal: 'powerhouse', headline, sections, fullScript };
}

/**
 * Web Speech Audio Player Controller with Hindi & English Voice Detection
 */
class SpeechController {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private onStateChangeCb: ((state: 'idle' | 'playing' | 'paused') => void) | null = null;

  setStateCallback(cb: (state: 'idle' | 'playing' | 'paused') => void) {
    this.onStateChangeCb = cb;
  }

  speak(text: string, language: 'en' | 'hi') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Web Speech API not supported on this platform.');
      return;
    }

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    this.utterance = utter;

    // Set language and rate
    utter.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utter.rate = language === 'hi' ? 0.95 : 1.0;
    utter.pitch = 1.0;

    // Pick best natural voice if available
    const voices = window.speechSynthesis.getVoices();
    if (language === 'hi') {
      const hiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.lang.toLowerCase().includes('hi-in')
      );
      if (hiVoice) utter.voice = hiVoice;
    } else {
      const enVoice =
        voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
        voices.find((v) => v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('indian')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (enVoice) utter.voice = enVoice;
    }

    utter.onstart = () => {
      this.isSpeaking = true;
      this.onStateChangeCb?.('playing');
    };

    utter.onpause = () => {
      this.onStateChangeCb?.('paused');
    };

    utter.onresume = () => {
      this.onStateChangeCb?.('playing');
    };

    utter.onend = () => {
      this.isSpeaking = false;
      this.onStateChangeCb?.('idle');
    };

    utter.onerror = () => {
      this.isSpeaking = false;
      this.onStateChangeCb?.('idle');
    };

    window.speechSynthesis.speak(utter);
  }

  pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.onStateChangeCb?.('paused');
    }
  }

  resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      this.onStateChangeCb?.('playing');
    }
  }

  stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.onStateChangeCb?.('idle');
    }
  }
}

export const speechController = new SpeechController();
