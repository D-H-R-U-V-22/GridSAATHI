/**
 * TRAI DLT Compliant SMS Templates (India <= 160 characters)
 * Entity: GridSaathi Clean Power Initiative
 */

export interface DltTemplate {
  templateId: string;
  category: string;
  textEn: string;
  textHi: string;
}

export const DLT_SMS_TEMPLATES: Record<string, DltTemplate> = {
  WEATHER_WARNING: {
    templateId: '110716892341001',
    category: 'weather',
    textEn: '[GridSaathi] WEATHER ALERT: Thunderstorm/cloud front in {area}. Unplug sensitive electronics. Solar inflow reduced. Issued by Power House.',
    textHi: '[ग्रिडसाथी] मौसम चेतावनी: {area} में आंधी/बादल। संवेदनशील उपकरण अनप्लग करें। पावर हाउस द्वारा जारी।',
  },
  DEMAND_RESPONSE: {
    templateId: '110716892341002',
    category: 'demand_response',
    textEn: '[GridSaathi] PEAK ALERT: High load on {colony} feeder. Please postpone AC/geysers for 90 mins to avoid forced shedding. Help keep grid stable.',
    textHi: '[ग्रिडसाथी] पीक लोड: {colony} फीडर पर भारी लोड। बिजली कटौती से बचने हेतु एसी व भारी लोड 90 मिनट टालें।',
  },
  PRE_CUT_MAINTENANCE: {
    templateId: '110716892341003',
    category: 'maintenance',
    textEn: '[GridSaathi] PLANNED OUTAGE: Substation line maintenance in {colony} on {time}. Please pre-fill water tanks and charge essentials.',
    textHi: '[ग्रिडसाथी] पूर्व सूचना: {colony} में {time} बजे रखरखाव कार्य। कृपया पानी की टंकी पहले भर लें।',
  },
  OUTAGE_BACKUP: {
    templateId: '110716892341004',
    category: 'outage',
    textEn: '[GridSaathi] OUTAGE ALERT: Feeder tripped in {colony}. Shared battery backup armed for clinic & water pump. Restoring by {eta}.',
    textHi: '[ग्रिडसाथी] बिजली ब्रेकडाउन: {colony} में फॉल्ट। अस्पताल व पेयजल हेतु सामुदायिक बैटरी चालू। संभावित समय {eta}।',
  },
};
