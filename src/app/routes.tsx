import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../features/landing/LandingPage';
import { PowerHouseShell } from '../components/layout/PowerHouseShell';
import { PublicShell } from '../components/layout/PublicShell';
import { CommandCenterPage } from '../features/powerhouse/command-center/CommandCenterPage';
import { ForecastingPage } from '../features/powerhouse/forecast/ForecastingPage';
import { AlertsPage } from '../features/powerhouse/alerts/AlertsPage';
import { LoadManagementPage } from '../features/powerhouse/load-management/LoadManagementPage';
import { DemandResponsePage } from '../features/powerhouse/demand-response/DemandResponsePage';
import { StoragePermissionsPage } from '../features/powerhouse/storage-permissions/StoragePermissionsPage';
import { SettingsPage } from '../features/powerhouse/settings/SettingsPage';
import { PredictorPage } from '../features/powerhouse/predictor/PredictorPage';
import { LoadControlPage } from '../features/powerhouse/load-control/LoadControlPage';
import { TechnicalLossPage } from '../features/powerhouse/technical-loss/TechnicalLossPage';

import { PublicHomePage } from '../features/public/home/PublicHomePage';
import { PublicForecastPage } from '../features/public/forecast/PublicForecastPage';
import { PublicAlertsPage } from '../features/public/alerts/PublicAlertsPage';
import { MessageBoxPage } from '../features/public/alerts/MessageBoxPage';
import { PublicStoragePage } from '../features/public/storage/PublicStoragePage';
import { HouseDashboardPage } from '../features/public/houses/HouseDashboardPage';
import { RecommendationsPage } from '../features/public/recommendations/RecommendationsPage';

import { UiKitchenSink } from '../dev/UiKitchenSink';
import { DataDebug } from '../dev/DataDebug';
import { useSessionStore } from '../store/useSessionStore';

export const AppRoutes: React.FC = () => {
  const selectedHouseId = useSessionStore((s) => s.selectedHouseId);

  return (
    <Routes>
      {/* Landing Portal Selector */}
      <Route path="/" element={<LandingPage />} />

      {/* Power House Portal Routes */}
      <Route path="/powerhouse" element={<PowerHouseShell />}>
        <Route index element={<CommandCenterPage />} />
        <Route path="forecast" element={<ForecastingPage />} />
        <Route path="predictor" element={<PredictorPage />} />
        <Route path="alerts" element={<Navigate to="/powerhouse/alerts/weather" replace />} />
        <Route path="alerts/:tab" element={<AlertsPage />} />
        <Route path="load" element={<LoadManagementPage />} />
        <Route path="load/:feederId" element={<LoadManagementPage />} />
        <Route path="load-control" element={<LoadControlPage />} />
        <Route path="technical-loss" element={<TechnicalLossPage />} />
        <Route path="demand-response" element={<DemandResponsePage />} />
        <Route path="storage" element={<StoragePermissionsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Public / Colony Portal Routes */}
      <Route path="/colony" element={<PublicShell />}>
        <Route index element={<PublicHomePage />} />
        <Route path="forecast" element={<PublicForecastPage />} />
        <Route path="alerts" element={<PublicAlertsPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="messages" element={<MessageBoxPage />} />
        <Route path="storage" element={<PublicStoragePage />} />
        <Route path="houses" element={<Navigate to={`/colony/houses/${selectedHouseId}`} replace />} />
        <Route path="houses/:houseId" element={<HouseDashboardPage />} />
      </Route>

      {/* Dev / Debug Routes */}
      <Route path="/dev/ui" element={<UiKitchenSink />} />
      <Route path="/dev/data" element={<DataDebug />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
