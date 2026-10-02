import { Topology, Area, Feeder, Colony, House, Appliance } from '../domain/types';

export const DEFAULT_APPLIANCES: Appliance[] = [
  { id: 'app-ac-1', name: '1.5 Ton Split AC', category: 'cooling', ratedKw: 1.6, heavy: true, deferrable: true },
  { id: 'app-ac-2', name: '1.0 Ton Bedroom AC', category: 'cooling', ratedKw: 1.1, heavy: true, deferrable: true },
  { id: 'app-geyser', name: 'Storage Geyser (25L)', category: 'water', ratedKw: 2.0, heavy: true, deferrable: true },
  { id: 'app-pump', name: 'Submersible Water Pump', category: 'water', ratedKw: 1.1, heavy: true, deferrable: true },
  { id: 'app-wm', name: 'Front Load Washing Machine', category: 'other', ratedKw: 1.2, heavy: true, deferrable: true },
  { id: 'app-iron', name: 'Electric Steam Iron', category: 'heating', ratedKw: 1.0, heavy: true, deferrable: true },
  { id: 'app-cooktop', name: 'Induction Cooktop', category: 'cooking', ratedKw: 1.8, heavy: true, deferrable: false },
  { id: 'app-fridge', name: 'Double Door Refrigerator', category: 'cold_chain', ratedKw: 0.25, heavy: false, deferrable: false },
  { id: 'app-fans', name: 'BLDC Ceiling Fans & LED Lights', category: 'lighting', ratedKw: 0.2, heavy: false, deferrable: false },
  { id: 'app-entertainment', name: 'Smart TV & Wi-Fi Router', category: 'entertainment', ratedKw: 0.15, heavy: false, deferrable: false },
];

export const INITIAL_TOPOLOGY: Topology = {
  powerHouse: {
    id: 'ph-pragati',
    name: 'Pragati Substation 220/66/11kV',
    capacityKw: 18000, // 18 MW
  },
  areas: [
    {
      id: 'area-north',
      name: 'North Sector',
      feederIds: ['feeder-kisan', 'feeder-shanti'],
    },
    {
      id: 'area-central',
      name: 'Central Zone',
      feederIds: ['feeder-mayur', 'feeder-nehru'],
    },
    {
      id: 'area-east',
      name: 'East Extension',
      feederIds: ['feeder-surya', 'feeder-indira'],
    },
    {
      id: 'area-periurban',
      name: 'Peri-Urban Corridor',
      feederIds: ['feeder-rajiv', 'feeder-greenvalley'],
    },
  ],
  feeders: [
    {
      id: 'feeder-kisan',
      name: 'Kisan Nagar 11kV Feeder',
      areaId: 'area-north',
      capacityKw: 2400,
      colonyIds: ['colony-kisan-4', 'colony-adarsh'],
    },
    {
      id: 'feeder-shanti',
      name: 'Shanti Vihar 11kV Feeder',
      areaId: 'area-north',
      capacityKw: 2200,
      colonyIds: ['colony-shanti-vihar'],
    },
    {
      id: 'feeder-mayur',
      name: 'Mayur Vihar 11kV Feeder',
      areaId: 'area-central',
      capacityKw: 2600,
      colonyIds: ['colony-mayur-a', 'colony-mayur-b'],
    },
    {
      id: 'feeder-nehru',
      name: 'Nehru Enclave Feeder',
      areaId: 'area-central',
      capacityKw: 2100,
      colonyIds: ['colony-nehru-east'],
    },
    {
      id: 'feeder-surya',
      name: 'Surya Nagar Solar Feeder',
      areaId: 'area-east',
      capacityKw: 2500,
      colonyIds: ['colony-surya-c', 'colony-panchsheel'],
    },
    {
      id: 'feeder-indira',
      name: 'Indira Colony 11kV Feeder',
      areaId: 'area-east',
      capacityKw: 2000,
      colonyIds: ['colony-indira-vikas'],
    },
    {
      id: 'feeder-rajiv',
      name: 'Rajiv Awas 11kV Feeder',
      areaId: 'area-periurban',
      capacityKw: 2000,
      colonyIds: ['colony-rajiv-awas', 'colony-saraswati'],
    },
    {
      id: 'feeder-greenvalley',
      name: 'Green Valley Wind-Hybrid Feeder',
      areaId: 'area-periurban',
      capacityKw: 2200,
      colonyIds: ['colony-green-valley'],
    },
  ],
  colonies: [
    {
      id: 'colony-shanti-vihar',
      name: 'Shanti Vihar Colony',
      areaId: 'area-north',
      feederId: 'feeder-shanti',
      houseCount: 32,
      batteryId: 'bat-shanti',
      autoConsentBackup: true,
    },
    {
      id: 'colony-kisan-4',
      name: 'Kisan Nagar Sector 4',
      areaId: 'area-north',
      feederId: 'feeder-kisan',
      houseCount: 28,
      batteryId: 'bat-kisan',
      autoConsentBackup: false,
    },
    {
      id: 'colony-adarsh',
      name: 'Adarsh Nagar Extension',
      areaId: 'area-north',
      feederId: 'feeder-kisan',
      houseCount: 22,
      batteryId: 'bat-adarsh',
      autoConsentBackup: true,
    },
    {
      id: 'colony-mayur-a',
      name: 'Mayur Vihar Pocket A',
      areaId: 'area-central',
      feederId: 'feeder-mayur',
      houseCount: 36,
      batteryId: 'bat-mayur-a',
      autoConsentBackup: true,
    },
    {
      id: 'colony-mayur-b',
      name: 'Mayur Vihar Pocket B',
      areaId: 'area-central',
      feederId: 'feeder-mayur',
      houseCount: 34,
      batteryId: 'bat-mayur-b',
      autoConsentBackup: false,
    },
    {
      id: 'colony-nehru-east',
      name: 'Nehru Enclave East',
      areaId: 'area-central',
      feederId: 'feeder-nehru',
      houseCount: 30,
      batteryId: 'bat-nehru',
      autoConsentBackup: true,
    },
    {
      id: 'colony-surya-c',
      name: 'Surya Nagar Block C',
      areaId: 'area-east',
      feederId: 'feeder-surya',
      houseCount: 26,
      batteryId: 'bat-surya',
      autoConsentBackup: true,
    },
    {
      id: 'colony-panchsheel',
      name: 'Panchsheel Colony',
      areaId: 'area-east',
      feederId: 'feeder-surya',
      houseCount: 25,
      batteryId: 'bat-panchsheel',
      autoConsentBackup: false,
    },
    {
      id: 'colony-indira-vikas',
      name: 'Indira Vikas Colony',
      areaId: 'area-east',
      feederId: 'feeder-indira',
      houseCount: 29,
      batteryId: 'bat-indira',
      autoConsentBackup: true,
    },
    {
      id: 'colony-saraswati',
      name: 'Saraswati Kunj',
      areaId: 'area-periurban',
      feederId: 'feeder-rajiv',
      houseCount: 20,
      batteryId: 'bat-saraswati',
      autoConsentBackup: false,
    },
    {
      id: 'colony-rajiv-awas',
      name: 'Rajiv Awas Complex',
      areaId: 'area-periurban',
      feederId: 'feeder-rajiv',
      houseCount: 35,
      batteryId: 'bat-rajiv',
      autoConsentBackup: true,
    },
    {
      id: 'colony-green-valley',
      name: 'Green Valley Greens',
      areaId: 'area-periurban',
      feederId: 'feeder-greenvalley',
      houseCount: 24,
      batteryId: 'bat-greenvalley',
      autoConsentBackup: true,
    },
  ],
};

// Lazy generator for houses in a colony
const houseCache: Record<string, House[]> = {};

export function getHousesForColony(colonyId: string): House[] {
  if (houseCache[colonyId]) {
    return houseCache[colonyId];
  }

  const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === colonyId);
  const count = colony ? colony.houseCount : 25;
  const houses: House[] = [];

  for (let i = 1; i <= count; i++) {
    const houseNum = i < 10 ? `0${i}` : `${i}`;
    const sanctionedLoad = 3 + (i % 4) * 2; // 3kW, 5kW, 7kW, 9kW
    const occupants = 2 + (i % 4);

    // Pick appliances based on house index
    const apps = DEFAULT_APPLIANCES.filter((_, idx) => {
      if (idx > 6 && i % 2 === 0) return true;
      if (idx <= 5) return true;
      return (idx + i) % 2 === 0;
    });

    houses.push({
      id: `${colonyId}-h${houseNum}`,
      colonyId,
      label: `House #${houseNum} (${colony?.name.split(' ')[0] || 'Unit'})`,
      occupants,
      sanctionedLoadKw: sanctionedLoad,
      appliances: apps,
    });
  }

  houseCache[colonyId] = houses;
  return houses;
}
