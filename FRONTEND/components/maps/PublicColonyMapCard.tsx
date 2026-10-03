import React, { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Polygon,
  Polyline,
} from '@vis.gl/react-google-maps';
import { useLocationStore } from '../../store/useLocationStore';
import { useGridStore } from '../../store/useGridStore';
import { useStorageStore } from '../../store/useStorageStore';
import { useSessionStore } from '../../store/useSessionStore';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID, GMP_ATTRIBUTION_IDS } from '../../lib/maps/googleMapsConfig';
import { MapPin, BatteryCharging, Sun, Zap, Shield, Navigation } from 'lucide-react';

export const PublicColonyMapCard: React.FC = () => {
  const currentArea = useLocationStore((s) => s.currentArea);
  const currentColony = useLocationStore((s) => s.currentColony);
  const selectedColonyId = useLocationStore((s) => s.selectedColonyId);
  const colonyStatuses = useGridStore((s) => s.colonyStatuses);
  const colonyReadings = useGridStore((s) => s.colonyReadings);
  const batteries = useStorageStore((s) => s.batteries);
  const language = useSessionStore((s) => s.language);

  const [activePin, setActivePin] = useState<'colony' | 'battery' | 'solar' | 'substation' | null>(null);

  const status = colonyStatuses[selectedColonyId] || 'stable';
  const reading = colonyReadings[selectedColonyId];
  const battery = batteries[selectedColonyId];

  // Colony polygon coords
  const colonyCoords = React.useMemo(() => {
    if (!currentColony?.geometry?.coordinates?.[0]) return [];
    return currentColony.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
  }, [currentColony]);

  const centerLat = colonyCoords[0]?.lat || currentArea.lat + 0.008;
  const centerLng = colonyCoords[0]?.lng || currentArea.lng + 0.008;

  // Offsets for community infrastructure points within the colony
  const batteryPos = { lat: centerLat + 0.0015, lng: centerLng - 0.0018 };
  const solarPos = { lat: centerLat - 0.0014, lng: centerLng + 0.002 };

  let statusColor = '#27A163';
  let fillColor = '#EAF7EE';
  if (status === 'watch' || status === 'constrained') {
    statusColor = '#E9A820';
    fillColor = '#FEFAF2';
  } else if (status === 'outage') {
    statusColor = '#C73E3A';
    fillColor = '#FCEEED';
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DDE9E0]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[8px] bg-[#EAF7EE] text-[#13724A]">
            <MapPin className="w-5 h-5 text-[#27A163]" />
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-[#0C3B2B] flex items-center gap-2">
              <span>{language === 'hi' ? 'मोहल्ला ग्रिड व बुनियादी ढांचा मैप' : 'Neighbourhood Grid & Infrastructure Map'}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#13724A] border border-[#8ED1A8]">
                Google Maps
              </span>
            </h3>
            <p className="text-xs text-[#5B6B62]">
              {language === 'hi'
                ? `${currentColony.name.hi} में सामुदायिक बैटरी, सौर इनफ्लो व 11kV लाइन`
                : `Community battery, rooftop solar feeders, and distribution lines in ${currentColony.name.en}`}
            </p>
          </div>
        </div>

        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
          style={{ backgroundColor: `${statusColor}22`, color: statusColor }}
        >
          {status}
        </span>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-[320px] rounded-[12px] overflow-hidden border border-[#DDE9E0]">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geometry', 'maps']}>
          <Map
            mapId={GOOGLE_MAPS_MAP_ID}
            defaultCenter={{ lat: centerLat, lng: centerLng }}
            defaultZoom={15}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
            className="w-full h-full"
          >
            {/* Feeder Polyline connecting to parent substation */}
            <Polyline
              path={[
                { lat: currentArea.lat, lng: currentArea.lng },
                { lat: centerLat, lng: centerLng },
              ]}
              strokeColor="#0C3B2B"
              strokeOpacity={0.65}
              strokeWeight={2.5}
            />

            {/* Colony Boundary Polygon */}
            {colonyCoords.length > 0 && (
              <Polygon
                paths={colonyCoords}
                strokeColor={statusColor}
                strokeOpacity={0.9}
                strokeWeight={2.5}
                fillColor={statusColor}
                fillOpacity={0.15}
                onClick={() => setActivePin('colony')}
              />
            )}

            {/* Colony Center Pin */}
            <AdvancedMarker
              position={{ lat: centerLat, lng: centerLng }}
              onClick={() => setActivePin('colony')}
              title={currentColony.name[language === 'hi' ? 'hi' : 'en']}
            >
              <div className="px-2 py-1 rounded-[6px] bg-[#0C3B2B] text-white text-[10px] font-bold shadow-md border border-white flex items-center gap-1 cursor-pointer">
                <Zap className="w-3 h-3 text-[#27A163]" />
                <span>{currentColony.name[language === 'hi' ? 'hi' : 'en']}</span>
              </div>
            </AdvancedMarker>

            {/* Community Battery Storage Pin */}
            <AdvancedMarker
              position={batteryPos}
              onClick={() => setActivePin('battery')}
              title="Community Battery Storage"
            >
              <div className="p-1.5 rounded-full bg-[#13724A] text-white shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                <BatteryCharging className="w-3.5 h-3.5 text-white" />
              </div>
            </AdvancedMarker>

            {/* Solar Cluster Pin */}
            <AdvancedMarker
              position={solarPos}
              onClick={() => setActivePin('solar')}
              title="Feeder Solar Aggregator"
            >
              <div className="p-1.5 rounded-full bg-[#E9A820] text-white shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                <Sun className="w-3.5 h-3.5 text-white" />
              </div>
            </AdvancedMarker>

            {/* InfoWindows */}
            {activePin === 'battery' && (
              <InfoWindow position={batteryPos} onCloseClick={() => setActivePin(null)}>
                <div className="p-2 min-w-[170px] text-xs">
                  <div className="font-bold text-[#0C3B2B] flex items-center gap-1">
                    <BatteryCharging className="w-3.5 h-3.5 text-[#27A163]" />
                    <span>{language === 'hi' ? 'सामुदायिक बैटरी' : 'Community Battery'}</span>
                  </div>
                  <div className="text-[11px] text-[#5B6B62] mt-1">
                    {language === 'hi' ? 'चार्ज स्थिति:' : 'State of Charge:'}{' '}
                    <strong className="text-[#13724A]">{battery?.socPct || 84}%</strong>
                  </div>
                  <div className="text-[10px] text-[#5B6B62] mt-0.5">
                    {language === 'hi' ? 'आकस्मिक पेयजल व क्लिनिक बैकअप' : 'Guaranteed water lift & clinic power'}
                  </div>
                </div>
              </InfoWindow>
            )}

            {activePin === 'solar' && (
              <InfoWindow position={solarPos} onCloseClick={() => setActivePin(null)}>
                <div className="p-2 min-w-[170px] text-xs">
                  <div className="font-bold text-[#0C3B2B] flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-[#E9A820]" />
                    <span>{language === 'hi' ? 'स्थानीय सौर उत्पादन' : 'Rooftop Solar Cluster'}</span>
                  </div>
                  <div className="text-[11px] text-[#5B6B62] mt-1">
                    {language === 'hi' ? 'वर्तमान उत्पादन:' : 'Live Generation:'}{' '}
                    <strong className="text-[#B07B0E]">{Math.round(reading?.solarKw || 86)} kW</strong>
                  </div>
                  <div className="text-[10px] text-[#5B6B62] mt-0.5">
                    {language === 'hi' ? 'स्वच्छ नवीकरणीय ऊर्जा' : 'Zero-carbon local generation'}
                  </div>
                </div>
              </InfoWindow>
            )}

            {activePin === 'colony' && (
              <InfoWindow
                position={{ lat: centerLat, lng: centerLng }}
                onCloseClick={() => setActivePin(null)}
              >
                <div className="p-2 min-w-[180px] text-xs">
                  <div className="font-bold text-[#0C3B2B]">
                    {currentColony.name[language === 'hi' ? 'hi' : 'en']}
                  </div>
                  <div className="text-[11px] text-[#5B6B62] mt-1 flex justify-between">
                    <span>{language === 'hi' ? 'वर्तमान लोड:' : 'Colony Load:'}</span>
                    <strong className="text-[#0C3B2B]">{Math.round(reading?.demandKw || 142)} kW</strong>
                  </div>
                  <div className="text-[11px] text-[#5B6B62] flex justify-between">
                    <span>{language === 'hi' ? 'कनेक्टेड मकान:' : 'Connected Homes:'}</span>
                    <strong className="text-[#0C3B2B]">{currentColony.houseCount}</strong>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Map Infrastructure Legend */}
      <div className="grid grid-cols-3 gap-2 text-[11px] text-[#5B6B62] pt-1">
        <div className="flex items-center gap-1.5 p-2 rounded-[8px] bg-[#F5FAF6] border border-[#DDE9E0]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#13724A] shrink-0" />
          <span className="truncate">{language === 'hi' ? 'कम्युनिटी बैटरी' : 'Shared Battery'}</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-[8px] bg-[#F5FAF6] border border-[#DDE9E0]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E9A820] shrink-0" />
          <span className="truncate">{language === 'hi' ? 'रूफटॉप सोलर' : 'Rooftop Solar'}</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-[8px] bg-[#F5FAF6] border border-[#DDE9E0]">
          <span className="w-2.5 h-0.5 bg-[#0C3B2B] shrink-0" />
          <span className="truncate">{language === 'hi' ? '11kV फीडर लाइन' : '11kV Line'}</span>
        </div>
      </div>
    </div>
  );
};
