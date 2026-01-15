'use client';

import { useState, useEffect } from 'react';
import { ShockDefinition } from '@/lib/types';

interface ShockInjectorProps {
  sessionId: string;
  currentCycle: number;
  currentShock: ShockDefinition | null;
  onShockInjected?: () => void;
}

export function ShockInjector({
  sessionId,
  currentCycle,
  currentShock,
  onShockInjected,
}: ShockInjectorProps) {
  const [shocks, setShocks] = useState<ShockDefinition[]>([]);
  const [selectedShockId, setSelectedShockId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load suggested shocks for current cycle
    fetch(`/api/game/shock?cycle=${currentCycle}`)
      .then((res) => res.json())
      .then((data) => setShocks(data.shocks))
      .catch((err) => console.error('Failed to load shocks:', err));
  }, [currentCycle]);

  const handleInjectShock = async () => {
    if (!selectedShockId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/game/shock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, shockId: selectedShockId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to inject shock');
      }

      onShockInjected?.();
      setSelectedShockId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentShock) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-600 text-xl">&#9888;</span>
          <h4 className="font-semibold text-yellow-800">Active Shock</h4>
        </div>
        <h5 className="font-medium text-gray-900">{currentShock.name}</h5>
        <p className="text-sm text-gray-600 mt-1">{currentShock.description}</p>
        <div className="mt-2 text-xs text-gray-500">
          Impact: {currentShock.healthImpact} health to affected activities
        </div>
      </div>
    );
  }

  const selectedShock = shocks.find((s) => s.id === selectedShockId);

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h4 className="font-semibold text-gray-900">Inject External Shock</h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Shock Event
        </label>
        <select
          value={selectedShockId}
          onChange={(e) => setSelectedShockId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a shock --</option>
          {shocks.map((shock) => (
            <option key={shock.id} value={shock.id}>
              {shock.name} ({shock.healthImpact} health impact)
            </option>
          ))}
        </select>
      </div>

      {selectedShock && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900">{selectedShock.name}</h5>
          <p className="text-sm text-gray-600 mt-1">{selectedShock.description}</p>
          <div className="mt-2 text-sm">
            <span className="text-gray-500">Affects: </span>
            <span className="text-red-600">
              {selectedShock.affectedActivities.join(', ')}
            </span>
          </div>
          <div className="mt-1 text-sm">
            <span className="text-gray-500">Health Impact: </span>
            <span className="text-red-600">{selectedShock.healthImpact}</span>
          </div>
          <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
            <span className="font-medium text-yellow-800">Narrative:</span>
            <p className="text-yellow-900 mt-1 whitespace-pre-line">
              {selectedShock.narrative}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <button
        onClick={handleInjectShock}
        disabled={!selectedShockId || isLoading}
        className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Injecting...' : 'Inject Shock'}
      </button>

      <p className="text-xs text-gray-500">
        Shocks will be applied when you advance to the next cycle. Teams with
        certain active linkages may have immunity.
      </p>
    </div>
  );
}
