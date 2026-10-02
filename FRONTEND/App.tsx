import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes';
import { ToastProvider } from './components/ui/Toast';
import { simulator } from './data/mock/simulator';
import { useAlertStore } from './store/useAlertStore';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const bannerAlert = useAlertStore((s) => s.bannerAlert);
  const clearBanner = useAlertStore((s) => s.clearBanner);

  // Initialize and run the 2-second simulation engine
  useEffect(() => {
    simulator.start();
    return () => {
      simulator.stop();
    };
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        {/* Global On-Screen Broadcast Banner if active */}
        {bannerAlert && (
          <div className="bg-[#C73E3A] text-white px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              <span className="font-bold truncate">{bannerAlert.title}:</span>
              <span className="truncate">{bannerAlert.body}</span>
            </div>
            <button
              onClick={clearBanner}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Application Navigation Routes */}
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}
