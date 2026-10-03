import React, { useState, useEffect } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { useAlertStore } from '../../store/useAlertStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { predictionProvider, MLRecommendation, MLRiskWindow } from '../../lib/ml/PredictionProvider';
import {
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Send,
  BatteryMedium,
  Radio,
  Sliders,
  Clock,
} from 'lucide-react';

export const RecommendationsFeed: React.FC = () => {
  const { showToast } = useToast();
  const currentArea = useLocationStore((s) => s.currentArea);
  const publishAlert = useAlertStore((s) => s.publishAlert);

  const [recommendations, setRecommendations] = useState<MLRecommendation[]>([]);
  const [riskWindows, setRiskWindows] = useState<MLRiskWindow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    Promise.all([
      predictionProvider.getRecommendations(currentArea.id),
      predictionProvider.getRiskWindows(currentArea.id),
    ]).then(([recs, rws]) => {
      if (mounted) {
        setRecommendations(recs);
        setRiskWindows(rws);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [currentArea.id]);

  const handleApprove = (rec: MLRecommendation) => {
    // 1. Mark approved
    setRecommendations((prev) =>
      prev.map((r) => (r.id === rec.id ? { ...r, status: 'approved' } : r))
    );

    // 2. Publish matching public advisory alert!
    publishAlert({
      type: rec.category === 'storage' ? 'storage' : 'demand_response',
      severity: 'advisory',
      title: rec.title.en,
      body: rec.description.en,
      bodyHi: rec.description.hi,
      scope: { level: 'area', ids: [currentArea.id] },
      startsAt: Date.now(),
      endsAt: Date.now() + 120 * 60 * 1000,
      source: 'operator',
      status: 'active',
      channels: ['app', 'sms'],
    });

    showToast({
      type: 'success',
      title: 'ML Recommendation Approved & Published',
      message: `Broadcasting "${rec.title.en}" live to public residents of ${currentArea.name.en}.`,
    });
  };

  const handleDismiss = (id: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' } : r))
    );
    showToast({
      type: 'info',
      title: 'Recommendation Dismissed',
      message: 'Operator bypassed automated dispatch suggestion.',
    });
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 shadow-xs flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DDE9E0]/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
            <Sparkles className="w-4 h-4 text-[#27A163]" />
          </span>
          <div>
            <h3 className="text-base font-bold font-heading text-[#0C3B2B]">
              Automated ML Recommendations & Intermittency Risk Feed
            </h3>
            <p className="text-xs text-[#5B6B62]">
              Physics-constrained ML suggestions with operator review & single-click broadcast
            </p>
          </div>
        </div>
      </div>

      {/* Risk Windows Cards */}
      {riskWindows.map((rw) => (
        <div
          key={rw.id}
          className="p-4 bg-[#FEFAF2] border border-[#F8D288] rounded-[12px] flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#785103] flex items-center gap-1.5 uppercase">
              <AlertTriangle className="w-3.5 h-3.5" /> High Risk Intermittency Window Detected
            </span>
            <span className="text-[10px] bg-white border border-[#F8D288] text-[#785103] px-2 py-0.5 rounded font-bold tabular-nums">
              {Math.round(rw.confidence * 100)}% Confidence
            </span>
          </div>

          <h4 className="text-sm font-bold text-[#0C3B2B]">{rw.title.en}</h4>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-white px-2 py-1 rounded border border-[#F8D288] text-[#785103] font-medium">
              🔍 {rw.reasoning}
            </span>
          </div>

          <p className="text-xs text-[#5B6B62] mt-0.5">
            <strong>Suggested Mitigation:</strong> {rw.recommendedAction.en}
          </p>
        </div>
      ))}

      {/* Actionable Recommendations List */}
      <div className="flex flex-col gap-3">
        {recommendations.map((rec) => {
          const isApproved = rec.status === 'approved';
          const isDismissed = rec.status === 'dismissed';

          return (
            <div
              key={rec.id}
              className={`p-4 rounded-[12px] border transition-all ${
                isApproved
                  ? 'bg-[#EAF7EE]/40 border-[#8ED1A8]'
                  : isDismissed
                  ? 'bg-[#F5FAF6] opacity-60 border-[#DDE9E0]'
                  : 'bg-white border-[#DDE9E0] shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5FAF6] border border-[#DDE9E0] text-[#0C3B2B] uppercase">
                      {rec.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[#13724A] font-semibold tabular-nums">
                      ⚡ Relieves ~{rec.projectedReliefKw} kW
                    </span>
                    <span className="text-[10px] text-[#5B6B62] tabular-nums">
                      (Model Score: {Math.round(rec.confidence * 100)}%)
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#0C3B2B]">{rec.title.en}</h4>
                  <p className="text-xs text-[#5B6B62] mt-0.5">{rec.description.en}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isApproved ? (
                    <span className="px-3 py-1 bg-[#EAF7EE] text-[#13724A] text-xs font-bold rounded-[6px] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Published Live
                    </span>
                  ) : isDismissed ? (
                    <span className="text-xs text-[#5B6B62] italic">Dismissed</span>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<X className="w-3.5 h-3.5" />}
                        onClick={() => handleDismiss(rec.id)}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Check className="w-3.5 h-3.5" />}
                        onClick={() => handleApprove(rec)}
                      >
                        Approve & Broadcast
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
