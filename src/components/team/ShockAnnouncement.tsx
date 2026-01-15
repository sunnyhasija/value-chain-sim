'use client';

import { ShockDefinition } from '@/lib/types';

interface ShockAnnouncementProps {
  shock: ShockDefinition;
  onDismiss?: () => void;
}

export function ShockAnnouncement({ shock, onDismiss }: ShockAnnouncementProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-pulse">
        {/* Header */}
        <div className="bg-red-600 text-white p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">&#9888;</span>
            <div>
              <h2 className="text-xl font-bold">BREAKING NEWS</h2>
              <p className="text-red-200 text-sm">External Shock Event</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">{shock.name}</h3>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {shock.narrative}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-medium">Impact:</span>
              <span className="text-gray-700">
                {Math.abs(shock.healthImpact)} health points to affected activities
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-medium">Affected:</span>
              <span className="text-gray-700">
                {shock.affectedActivities
                  .map((id) => id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                  .join(', ')}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500 italic">
            Teams with strong strategic linkages may have built resilience against
            this type of disruption.
          </p>
        </div>

        {/* Footer */}
        {onDismiss && (
          <div className="px-6 pb-6">
            <button
              onClick={onDismiss}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Acknowledge
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ShockBannerProps {
  shock: ShockDefinition;
}

export function ShockBanner({ shock }: ShockBannerProps) {
  return (
    <div className="bg-red-100 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl text-red-600">&#9888;</span>
        <div>
          <h4 className="font-semibold text-red-800">{shock.name}</h4>
          <p className="text-sm text-red-700">{shock.description}</p>
        </div>
      </div>
    </div>
  );
}
