import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Polygon,
  Polyline,
  useMap,
} from '@vis.gl/react-google-maps';
import { useLocationStore } from '../../store/useLocationStore';
import { useGridStore } from '../../store/useGridStore';
import { useSessionStore } from '../../store/useSessionStore';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID, GMP_ATTRIBUTION_IDS } from '../../lib/maps/googleMapsConfig';
import { MapPin, Layers, Zap, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

// Subcomponent to smoothly pan map when area or colony changes
const MapRecenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);
  return null;
};

export const AreaMapCard: React.FC = () => {
  const currentArea = useLocationStore((s) => s.currentArea);
  const selectedColonyId = useLocationStore((s) => s.selectedColonyId);
  const setColonyId = useLocationStore((s) => s.setColonyId);
  const colonyStatuses = useGridStore((s) => s.colonyStatuses);
  const powerHouseReading = useGridStore((s) => s.powerHouseReading);
  const language = useSessionStore((s) => s.language);

  const [selectedMarker, setSelectedMarker] = useState<'substation' | string | null>(null);

  // Outer substation polygon coordinates
  const areaBoundary = React.useMemo(() => {
    if (!currentArea.geometry?.coordinates?.[0]) return [];
    return currentArea.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
  }, [currentArea]);

  // Selected colony details
  const activeColony = currentArea.colonies.find((c) => c.id === selectedColonyId);

  return (
    <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-5 shadow-xs flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DDE9E0]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[8px] bg-[#EAF7EE] text-[#13724A]">
            <MapPin className="w-5 h-5 text-[#27A163]" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading text-[#0C3B2B] flex items-center gap-2">
              <span>{language === 'hi' ? 'गूगल मैप्स - वितरण फीडर व कॉलोनी नेटवर्क' : 'Google Maps — Feeder & Colony Distribution Network'}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#13724A] border border-[#8ED1A8]">
                Google Maps Platform
              </span>
            </h2>
            <p className="text-xs text-[#5B6B62]">
              {language === 'hi'
                ? `${currentArea.name.hi} के अंतर्गत 11kV रेडियल लाइनें एवं वास्तविक समय ग्रिड स्थिति`
                : `11kV radial line telemetry and real-time colony boundary status in ${currentArea.name.en}`}
            </p>
          </div>
        </div>

        {/* Status Legend Pills */}
        <div className="flex items-center gap-2 text-[11px] self-start sm:self-auto flex-wrap">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#13724A] border border-[#8ED1A8] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#27A163]" />
            {language === 'hi' ? 'सामान्य' : 'Stable'}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEFAF2] text-[#9A6508] border border-[#E9A820] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#E9A820]" />
            {language === 'hi' ? 'सीमित' : 'Constrained'}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FCEEED] text-[#C73E3A] border border-[#F18D8A] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#C73E3A]" />
            {language === 'hi' ? 'कटौती' : 'Outage'}
          </span>
        </div>
      </div>

      {/* Google Map Viewport */}
      <div className="relative w-full h-[420px] rounded-[12px] overflow-hidden border border-[#DDE9E0]">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geometry', 'maps']}>
          <Map
            mapId={GOOGLE_MAPS_MAP_ID}
            defaultCenter={{ lat: currentArea.lat, lng: currentArea.lng }}
            defaultZoom={13}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
            className="w-full h-full"
          >
            <MapRecenter lat={currentArea.lat} lng={currentArea.lng} />

            {/* 1. Substation Area Boundary Polygon */}
            {areaBoundary.length > 0 && (
              <Polygon
                paths={areaBoundary}
                strokeColor="#13724A"
                strokeOpacity={0.8}
                strokeWeight={2}
                fillColor="#27A163"
                fillOpacity={0.06}
              />
            )}

            {/* 2. Colony Polygons & Feeder Polylines */}
            {currentArea.colonies.map((col) => {
              const status = colonyStatuses[col.id] || 'stable';
              const isSelected = col.id === selectedColonyId;

              let strokeColor = '#27A163';
              let fillColor = '#27A163';
              if (status === 'watch' || status === 'constrained') {
                strokeColor = '#E9A820';
                fillColor = '#E9A820';
              } else if (status === 'outage') {
                strokeColor = '#C73E3A';
                fillColor = '#C73E3A';
              }

              const coords =
                col.geometry?.coordinates?.[0]?.map(([lng, lat]) => ({ lat, lng })) || [];

              const centerLat = coords.length > 0 ? coords[0].lat : currentArea.lat;
              const centerLng = coords.length > 0 ? coords[0].lng : currentArea.lng;

              return (
                <React.Fragment key={col.id}>
                  {/* Feeder Distribution Polyline from Substation to Colony Center */}
                  <Polyline
                    path={[
                      { lat: currentArea.lat, lng: currentArea.lng },
                      { lat: centerLat, lng: centerLng },
                    ]}
                    strokeColor={isSelected ? '#0C3B2B' : strokeColor}
                    strokeOpacity={0.7}
                    strokeWeight={isSelected ? 3.5 : 2}
                  />

                  {/* Colony Boundary Polygon */}
                  {coords.length > 0 && (
                    <Polygon
                      paths={coords}
                      strokeColor={isSelected ? '#0C3B2B' : strokeColor}
                      strokeOpacity={1.0}
                      strokeWeight={isSelected ? 3 : 2}
                      fillColor={fillColor}
                      fillOpacity={isSelected ? 0.35 : 0.18}
                      onClick={() => {
                        setColonyId(col.id);
                        setSelectedMarker(col.id);
                      }}
                    />
                  )}

                  {/* Colony Advanced Marker Pin */}
                  <AdvancedMarker
                    position={{ lat: centerLat, lng: centerLng }}
                    onClick={() => {
                      setColonyId(col.id);
                      setSelectedMarker(col.id);
                    }}
                    title={col.name[language === 'hi' ? 'hi' : 'en']}
                  >
                    <div
                      className={`px-2 py-1 rounded-[6px] text-[10px] font-bold shadow-md cursor-pointer border flex items-center gap-1 transition-transform hover:scale-105 ${
                        isSelected
                          ? 'bg-[#0C3B2B] text-white border-white ring-2 ring-[#27A163]'
                          : status === 'outage'
                          ? 'bg-[#FCEEED] text-[#C73E3A] border-[#C73E3A]'
                          : status === 'constrained'
                          ? 'bg-[#FEFAF2] text-[#9A6508] border-[#E9A820]'
                          : 'bg-white text-[#0C3B2B] border-[#DDE9E0]'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: strokeColor }}
                      />
                      <span>{col.name[language === 'hi' ? 'hi' : 'en']}</span>
                    </div>
                  </AdvancedMarker>

                  {/* InfoWindow for Selected Colony */}
                  {selectedMarker === col.id && (
                    <InfoWindow
                      position={{ lat: centerLat, lng: centerLng }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="p-2 min-w-[180px] text-xs">
                        <div className="font-bold text-[#0C3B2B] text-sm">
                          {col.name[language === 'hi' ? 'hi' : 'en']}
                        </div>
                        <div className="text-[11px] text-[#5B6B62] mt-0.5">
                          {language === 'hi' ? `मकान: ${col.houseCount}` : `Connected Homes: ${col.houseCount}`}
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#DDE9E0] flex items-center justify-between">
                          <span className="text-[10px] text-[#5B6B62] font-semibold uppercase">
                            {language === 'hi' ? 'ग्रिड स्थिति' : 'Status'}
                          </span>
                          <span
                            className="text-[11px] font-bold px-1.5 py-0.5 rounded capitalize"
                            style={{
                              backgroundColor: `${fillColor}33`,
                              color: strokeColor,
                            }}
                          >
                            {status}
                          </span>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </React.Fragment>
              );
            })}

            {/* 3. Primary Substation Marker */}
            <AdvancedMarker
              position={{ lat: currentArea.lat, lng: currentArea.lng }}
              onClick={() => setSelectedMarker('substation')}
              title={currentArea.name[language === 'hi' ? 'hi' : 'en']}
            >
              <div className="p-2 rounded-full bg-[#0C3B2B] text-white shadow-floating border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-[#27A163]" fill="#27A163" />
              </div>
            </AdvancedMarker>

            {/* Substation InfoWindow */}
            {selectedMarker === 'substation' && (
              <InfoWindow
                position={{ lat: currentArea.lat, lng: currentArea.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2 min-w-[210px] text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#0C3B2B] text-sm">
                    <Zap className="w-4 h-4 text-[#27A163]" />
                    <span>{currentArea.name[language === 'hi' ? 'hi' : 'en']}</span>
                  </div>
                  <div className="text-[11px] text-[#5B6B62] mt-0.5">
                    {language === 'hi' ? 'प्राथमिक 220kV ग्रिड सबस्टेशन' : 'Primary 220kV Grid Substation'}
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#DDE9E0] flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#5B6B62]">{language === 'hi' ? 'कुल क्षमता:' : 'Rated Capacity:'}</span>
                      <span className="font-bold text-[#0C3B2B]">
                        {(currentArea.capacityKw / 1000).toFixed(0)} MW
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6B62]">{language === 'hi' ? 'वर्तमान लोड:' : 'Current Load:'}</span>
                      <span className="font-bold text-[#27A163]">
                        {(powerHouseReading.demandKw / 1000).toFixed(1)} MW
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6B62]">{language === 'hi' ? '11kV फीडर लाइनें:' : 'Radial Feeders:'}</span>
                      <span className="font-bold text-[#0C3B2B]">
                        {currentArea.feeders.length} Lines
                      </span>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Selected Colony Quick Stats Ribbon below Map */}
      {activeColony && (
        <div className="p-3 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[10px] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0C3B2B]">
              {activeColony.name[language === 'hi' ? 'hi' : 'en']}
            </span>
            <span className="text-[11px] text-[#5B6B62]">
              · {activeColony.houseCount} {language === 'hi' ? 'मकान कनेक्टेड' : 'homes connected'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#5B6B62]">
              {language === 'hi' ? 'फीडर:' : 'Feeder:'}{' '}
              <strong className="text-[#0C3B2B]">{activeColony.feederId}</strong>
            </span>
            <button
              onClick={() => setSelectedMarker(activeColony.id)}
              className="text-[#13724A] font-bold hover:underline cursor-pointer"
            >
              {language === 'hi' ? 'विस्तार देखें' : 'View Details'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
