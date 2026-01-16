'use client';

import { useState, useMemo } from 'react';
import { TeamActivity } from '@/lib/types';
import {
  getActivityById,
  VALUE_CREATING_ACTIVITIES,
  VALUE_SUPPORTING_ACTIVITIES,
  NON_VALUE_ADD_ACTIVITIES,
} from '@/lib/activities';
import { HealthBar } from '../shared/HealthBar';
import { BudgetSummary } from '../shared/BudgetMeter';

interface InvestmentAllocatorProps {
  activities: TeamActivity[];
  budget: number;
  onSubmit: (allocations: Record<string, number>, cuts: string[]) => void;
  onActivateInnovationLab?: () => void;
  isActivatingInnovationLab?: boolean;
  isSubmitting?: boolean;
  hasSubmitted?: boolean;
}

export function InvestmentAllocator({
  activities,
  budget,
  onSubmit,
  onActivateInnovationLab,
  isActivatingInnovationLab = false,
  isSubmitting = false,
  hasSubmitted = false,
}: InvestmentAllocatorProps) {
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [cuts, setCuts] = useState<string[]>([]);

  const handleAllocationChange = (activityId: string, value: number) => {
    setAllocations((prev) => ({
      ...prev,
      [activityId]: Math.max(0, value),
    }));
  };

  const handleToggleCut = (activityId: string) => {
    setCuts((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const eliminationCosts = useMemo(() => {
    return cuts.reduce((total, activityId) => {
      const def = NON_VALUE_ADD_ACTIVITIES.find((a) => a.id === activityId);
      return total + (def?.eliminationCost || 0);
    }, 0);
  }, [cuts]);

  const totalSpent = useMemo(() => {
    const allocationTotal = Object.values(allocations).reduce((a, b) => a + b, 0);
    return allocationTotal + eliminationCosts;
  }, [allocations, eliminationCosts]);

  const isOverBudget = totalSpent > budget;

  const handleSubmit = () => {
    if (isOverBudget) {
      alert('Cannot submit: spending exceeds budget');
      return;
    }
    onSubmit(allocations, cuts);
  };

  if (hasSubmitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-sm">
        <div className="text-4xl mb-3">&#10003;</div>
        <h3 className="text-xl font-semibold text-green-800">
          Decisions Submitted
        </h3>
        <p className="text-green-600 mt-2">
          Waiting for other teams and instructor to advance the cycle.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Value Creating Activities
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Primary activities that directly create value for customers.
          </p>
          <div className="space-y-4">
            {VALUE_CREATING_ACTIVITIES.map((def) => {
              const activity = activities.find((a) => a.activityId === def.id);
              if (!activity) return null;

              return (
                <ActivityRow
                  key={def.id}
                  name={def.name}
                  description={def.description}
                  health={activity.health}
                  weight={def.weight}
                  allocation={allocations[def.id] || 0}
                  onAllocationChange={(v) => handleAllocationChange(def.id, v)}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Value Supporting Activities
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Support activities that enable primary activities.
          </p>
          <div className="space-y-4">
            {VALUE_SUPPORTING_ACTIVITIES.map((def) => {
              const activity = activities.find((a) => a.activityId === def.id);
              if (!activity) return null;

              return (
                <ActivityRow
                  key={def.id}
                  name={def.name}
                  description={def.description}
                  health={activity.health}
                  allocation={allocations[def.id] || 0}
                  onAllocationChange={(v) => handleAllocationChange(def.id, v)}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Non-Value-Add Activities
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Activities that consume resources. Consider eliminating them.
          </p>
          <div className="space-y-4">
            {NON_VALUE_ADD_ACTIVITIES.map((def) => {
              const activity = activities.find((a) => a.activityId === def.id);
              if (!activity) return null;

              // Skip innovation lab if not active
              if (def.id === 'innovation-lab' && activity.health === 0) {
                return (
                  <div
                    key={def.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <div className="font-medium text-slate-700">{def.name}</div>
                        <div className="text-xs text-slate-500">{def.description}</div>
                        <div className="text-xs text-amber-600 mt-1">
                          Available to activate (costs ${def.maintenanceCost}M/cycle)
                        </div>
                      </div>
                      {onActivateInnovationLab ? (
                        <button
                          onClick={onActivateInnovationLab}
                          disabled={isActivatingInnovationLab}
                          className="px-3 py-1 text-sm rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                        >
                          {isActivatingInnovationLab ? 'Activating...' : 'Activate'}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">Not Active</span>
                      )}
                    </div>
                  </div>
                );
              }

              if (activity.isEliminated) {
                return (
                  <div
                    key={def.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-slate-400 line-through">
                          {def.name}
                        </div>
                        <div className="text-xs text-slate-400">{def.description}</div>
                      </div>
                      <span className="text-sm text-emerald-600">Eliminated</span>
                    </div>
                  </div>
                );
              }

              const isMarkedForCut = cuts.includes(def.id);

              return (
                <div
                  key={def.id}
                  className={`rounded-xl border p-3 ${
                    isMarkedForCut
                      ? 'border-rose-300 bg-rose-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-medium text-slate-900">{def.name}</div>
                      <div className="text-xs text-slate-500">{def.description}</div>
                      <div className="text-xs text-rose-600 mt-1">
                        Costing ${def.maintenanceCost}M/quarter
                      </div>
                    </div>
                    {def.eliminationCost !== undefined && (
                      <button
                        onClick={() => handleToggleCut(def.id)}
                        className={`px-3 py-1 text-sm rounded ${
                          isMarkedForCut
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                      >
                        {isMarkedForCut
                          ? `Eliminating ($${def.eliminationCost}M)`
                          : `Eliminate ($${def.eliminationCost}M)`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 h-fit space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900">
              Decision Console
            </h3>
            <span className="text-xs text-slate-500">Cycle Submit</span>
          </div>
          <BudgetSummary
            total={budget}
            allocations={allocations}
            eliminationCosts={eliminationCosts}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isOverBudget}
          className={`w-full py-4 text-lg font-semibold rounded-xl transition-colors ${
            isOverBudget
              ? 'bg-rose-100 text-rose-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
          }`}
        >
          {isSubmitting
            ? 'Submitting...'
            : isOverBudget
            ? 'Over Budget - Reduce Spending'
            : 'Submit Decisions'}
        </button>
      </aside>
    </div>
  );
}

interface ActivityRowProps {
  name: string;
  description: string;
  health: number;
  weight?: number;
  allocation: number;
  onAllocationChange: (value: number) => void;
}

function ActivityRow({
  name,
  description,
  health,
  weight,
  allocation,
  onAllocationChange,
}: ActivityRowProps) {
  return (
    <div className="p-3 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{name}</span>
            {weight && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                {weight}x weight
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className="text-right ml-4">
          <div className="text-sm font-medium text-gray-700">
            Health: {Math.round(health)}
          </div>
        </div>
      </div>

      <HealthBar value={health} size="sm" className="mb-3" />

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 w-16">Invest:</span>
        <input
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={allocation}
          onChange={(e) => onAllocationChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="w-24 flex items-center">
          <span className="text-gray-500 mr-1">$</span>
          <input
            type="number"
            min="0"
            max="50"
            step="0.5"
            value={allocation}
            onChange={(e) => onAllocationChange(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-right"
          />
          <span className="text-gray-500 ml-1">M</span>
        </div>
      </div>
    </div>
  );
}
