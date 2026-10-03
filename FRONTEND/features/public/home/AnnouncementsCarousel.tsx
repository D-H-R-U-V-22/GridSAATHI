import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../domain/types';
import { useSessionStore } from '../../../store/useSessionStore';
import { formatTime12h } from '../../../lib/time';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Clock,
  ArrowRight,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface AnnouncementsCarouselProps {
  alerts: Alert[];
}

export const AnnouncementsCarousel: React.FC<AnnouncementsCarouselProps> = ({ alerts }) => {
  const navigate = useNavigate();
  const language = useSessionStore((s) => s.language);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAlertModal, setSelectedAlertModal] = useState<Alert | null>(null);

  // Responsive items per view: mobile 1, tablet 2, desktop 3
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSlides = Math.max(1, alerts.length - itemsPerView + 1);

  // Autoplay every 6s, paused on hover/focus and respecting reduced motion
  useEffect(() => {
    if (isPaused || alerts.length <= itemsPerView) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1 >= totalSlides ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, alerts.length, itemsPerView, totalSlides]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1 >= totalSlides ? 0 : prev + 1));
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 text-center text-xs text-[#5B6B62]">
        <CheckCircle2 className="w-6 h-6 text-[#27A163] mx-auto mb-2" />
        {language === 'hi' ? 'कोई सक्रिय अलर्ट नहीं है। ग्रिड सामान्य है।' : 'No active alerts. Grid running nominally.'}
      </div>
    );
  }

  // Get severity border & pill style
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-l-4 border-l-[#C73E3A]',
          pill: 'bg-[#FCEEED] text-[#9E2824]',
          label: 'CRITICAL',
        };
      case 'warning':
        return {
          border: 'border-l-4 border-l-[#E9A820]',
          pill: 'bg-[#FEFAF2] text-[#B07B0E]',
          label: 'WARNING',
        };
      case 'advisory':
        return {
          border: 'border-l-4 border-l-[#27A163]',
          pill: 'bg-[#EAF7EE] text-[#13724A]',
          label: 'ADVISORY',
        };
      default:
        return {
          border: 'border-l-4 border-l-[#5B6B62]',
          pill: 'bg-[#F5FAF6] text-[#5B6B62]',
          label: 'INFO',
        };
    }
  };

  return (
    <div
      className="flex flex-col gap-3.5 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Title & Navigation controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
            <Bell className="w-4 h-4 text-[#27A163]" />
          </span>
          <h2 className="text-base font-bold font-heading text-[#0C3B2B]">
            {language === 'hi' ? 'नवीनतम स्थानीय घोषणाएं' : 'Latest Neighbourhood Announcements'}
          </h2>
          <span className="text-xs text-[#5B6B62] font-semibold tabular-nums ml-1">
            ({alerts.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/colony/alerts')}
            className="text-xs font-bold text-[#13724A] hover:underline cursor-pointer mr-2 hidden sm:inline"
          >
            {language === 'hi' ? 'सभी देखें →' : 'View All →'}
          </button>

          {/* Carousel Arrows */}
          <button
            onClick={handlePrev}
            aria-label="Previous announcements"
            className="w-8 h-8 rounded-full bg-white border border-[#DDE9E0] text-[#0C3B2B] hover:bg-[#F5FAF6] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next announcements"
            className="w-8 h-8 rounded-full bg-white border border-[#DDE9E0] text-[#0C3B2B] hover:bg-[#F5FAF6] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out gap-4"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {alerts.map((alert) => {
            const style = getSeverityStyles(alert.severity);
            const title = alert.title;
            const body = language === 'hi' && alert.bodyHi ? alert.bodyHi : alert.body;

            return (
              <div
                key={alert.id}
                style={{ flex: `0 0 calc(${100 / itemsPerView}% - ${(16 * (itemsPerView - 1)) / itemsPerView}px)` }}
                className={`bg-white rounded-[14px] border border-[#DDE9E0] p-4 shadow-xs flex flex-col justify-between h-[184px] transition-all hover:shadow-sm ${style.border}`}
              >
                <div>
                  {/* Top pill & time */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${style.pill}`}>
                      {style.label}
                    </span>
                    <span className="text-[11px] text-[#5B6B62] tabular-nums flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {alert.publishedAt ? formatTime12h(alert.publishedAt) : 'Live'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#0C3B2B] line-clamp-1 leading-snug">
                    {title}
                  </h3>

                  {/* Body with clean line clamp */}
                  <p className="text-xs text-[#5B6B62] mt-1.5 line-clamp-2 leading-relaxed">
                    {body}
                  </p>
                </div>

                {/* Bottom actions */}
                <div className="pt-2 border-t border-[#DDE9E0]/60 flex items-center justify-between">
                  <span className="text-[10px] text-[#5B6B62] truncate">
                    Issued by Substation
                  </span>
                  <button
                    onClick={() => setSelectedAlertModal(alert)}
                    className="text-xs font-semibold text-[#13724A] hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                  >
                    Read more <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination dots */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx ? 'w-5 bg-[#27A163]' : 'w-1.5 bg-[#DDE9E0]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Read More Modal */}
      {selectedAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DDE9E0] rounded-[16px] max-w-[500px] w-full p-6 shadow-floating flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#DDE9E0]/60 pb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${getSeverityStyles(selectedAlertModal.severity).pill}`}>
                {getSeverityStyles(selectedAlertModal.severity).label}
              </span>
              <button
                onClick={() => setSelectedAlertModal(null)}
                className="p-1 text-[#5B6B62] hover:text-[#16241D] rounded-[6px] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold font-heading text-[#0C3B2B]">
                {selectedAlertModal.title}
              </h3>
              <p className="text-xs text-[#5B6B62] mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Published at {selectedAlertModal.publishedAt ? formatTime12h(selectedAlertModal.publishedAt) : 'Live'}
              </p>
            </div>

            <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] text-xs text-[#0C3B2B] leading-relaxed">
              {language === 'hi' && selectedAlertModal.bodyHi
                ? selectedAlertModal.bodyHi
                : selectedAlertModal.body}
            </div>

            <div className="p-3 bg-[#EAF7EE] rounded-[8px] text-[11px] text-[#13724A]">
              <strong>Recommended Citizen Action:</strong> Check the Solutions tab for specific household load adjustments or emergency battery backup status.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedAlertModal(null);
                  navigate('/colony/recommendations');
                }}
                className="px-3.5 py-1.5 bg-[#27A163] text-white text-xs font-semibold rounded-[6px] hover:bg-[#13724A] transition-colors cursor-pointer"
              >
                View Recommended Solutions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
