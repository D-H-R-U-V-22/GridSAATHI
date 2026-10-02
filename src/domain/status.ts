import { SupplyStatus, Severity } from './types';

export function computeSupplyStatus(params: {
  shortfallKw: number;
  capacityKw: number;
  currentDemandKw: number;
  hasOutage?: boolean;
  hasActiveDR?: boolean;
  nearShortfallForecast?: boolean;
}): SupplyStatus {
  if (params.hasOutage) {
    return 'outage';
  }

  const loadPct = params.capacityKw > 0 ? (params.currentDemandKw / params.capacityKw) * 100 : 0;

  if (params.shortfallKw > 0 || loadPct > 90 || params.hasActiveDR) {
    return 'constrained';
  }

  if (params.nearShortfallForecast || loadPct >= 80) {
    return 'watch';
  }

  return 'stable';
}

export function getPublicHeadline(status: SupplyStatus, lang: 'en' | 'hi' = 'en'): string {
  if (lang === 'hi') {
    switch (status) {
      case 'stable': return 'बिजली आपूर्ति सामान्य और स्थिर है';
      case 'watch': return 'शाम को आपूर्ति में कमी की संभावना है';
      case 'constrained': return 'आपूर्ति सीमित है — कृपया भारी उपकरण न चलाएं';
      case 'outage': return 'आपके क्षेत्र में बिजली कटौती चल रही है';
    }
  }

  switch (status) {
    case 'stable': return 'Power is steady';
    case 'watch': return 'Supply may dip this evening';
    case 'constrained': return 'Supply is tight — please avoid heavy appliances';
    case 'outage': return 'Power is out in your area';
  }
}

export function getStatusColor(status: SupplyStatus): {
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  name: string;
} {
  switch (status) {
    case 'stable':
      return {
        hex: '#27A163',
        bgClass: 'bg-[#EAF7EE]',
        textClass: 'text-[#13724A]',
        borderClass: 'border-[#8ED1A8]',
        badgeClass: 'bg-[#D6EFDD] text-[#0C3B2B]',
        name: 'Stable',
      };
    case 'watch':
      return {
        hex: '#E9A820',
        bgClass: 'bg-[#FEF7E6]',
        textClass: 'text-[#B07B0E]',
        borderClass: 'border-[#F8D288]',
        badgeClass: 'bg-[#FDE8B5] text-[#785103]',
        name: 'Watch',
      };
    case 'constrained':
      return {
        hex: '#E2702B',
        bgClass: 'bg-[#FDF1E9]',
        textClass: 'text-[#B34E14]',
        borderClass: 'border-[#F5AC7B]',
        badgeClass: 'bg-[#FCD8C1] text-[#7A320A]',
        name: 'Constrained',
      };
    case 'outage':
      return {
        hex: '#C73E3A',
        bgClass: 'bg-[#FCEEED]',
        textClass: 'text-[#9E2824]',
        borderClass: 'border-[#ECA3A0]',
        badgeClass: 'bg-[#F7D0CF] text-[#691815]',
        name: 'Outage',
      };
  }
}

export function getSeverityStyle(severity: Severity) {
  switch (severity) {
    case 'critical':
      return {
        border: 'border-l-4 border-l-[#C73E3A]',
        bg: 'bg-[#FDF5F5]',
        text: 'text-[#9E2824]',
        badge: 'bg-[#F7D0CF] text-[#691815]',
        label: 'Critical'
      };
    case 'warning':
      return {
        border: 'border-l-4 border-l-[#E2702B]',
        bg: 'bg-[#FEF7F2]',
        text: 'text-[#B34E14]',
        badge: 'bg-[#FCD8C1] text-[#7A320A]',
        label: 'Warning'
      };
    case 'advisory':
      return {
        border: 'border-l-4 border-l-[#E9A820]',
        bg: 'bg-[#FEFAF2]',
        text: 'text-[#B07B0E]',
        badge: 'bg-[#FDE8B5] text-[#785103]',
        label: 'Advisory'
      };
    case 'info':
    default:
      return {
        border: 'border-l-4 border-l-[#3B7DD8]',
        bg: 'bg-[#F2F7FD]',
        text: 'text-[#205499]',
        badge: 'bg-[#D6E6F9] text-[#133A6D]',
        label: 'Info'
      };
  }
}
