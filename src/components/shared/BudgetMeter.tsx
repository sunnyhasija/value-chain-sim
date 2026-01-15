'use client';

interface BudgetMeterProps {
  spent: number;
  total: number;
  className?: string;
}

export function BudgetMeter({ spent, total, className = '' }: BudgetMeterProps) {
  const remaining = Math.max(0, total - spent);
  const percentageUsed = Math.min(100, (spent / total) * 100);

  const getStatusColor = () => {
    if (percentageUsed > 100) return 'text-red-600';
    if (percentageUsed > 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Budget</span>
        <span className={`font-semibold ${getStatusColor()}`}>
          ${remaining.toFixed(1)}M remaining
        </span>
      </div>

      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            percentageUsed > 100
              ? 'bg-red-500'
              : percentageUsed > 90
              ? 'bg-yellow-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(100, percentageUsed)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>Spent: ${spent.toFixed(1)}M</span>
        <span>Total: ${total.toFixed(1)}M</span>
      </div>
    </div>
  );
}

interface BudgetSummaryProps {
  total: number;
  allocations: Record<string, number>;
  eliminationCosts: number;
}

export function BudgetSummary({ total, allocations, eliminationCosts }: BudgetSummaryProps) {
  const totalAllocations = Object.values(allocations).reduce((a, b) => a + b, 0);
  const totalSpent = totalAllocations + eliminationCosts;
  const remaining = total - totalSpent;

  const isOverBudget = remaining < 0;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <h4 className="font-medium text-gray-900">Budget Summary</h4>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Activity Investments:</span>
          <span className="font-medium">${totalAllocations.toFixed(1)}M</span>
        </div>
        {eliminationCosts > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Elimination Costs:</span>
            <span className="font-medium">${eliminationCosts.toFixed(1)}M</span>
          </div>
        )}
        <div className="border-t pt-1 flex justify-between font-medium">
          <span>Total Spent:</span>
          <span>${totalSpent.toFixed(1)}M</span>
        </div>
      </div>

      <div
        className={`flex justify-between text-lg font-bold ${
          isOverBudget ? 'text-red-600' : 'text-green-600'
        }`}
      >
        <span>Remaining:</span>
        <span>${remaining.toFixed(1)}M</span>
      </div>

      {isOverBudget && (
        <p className="text-sm text-red-600">
          Over budget! Reduce spending by ${Math.abs(remaining).toFixed(1)}M
        </p>
      )}

      <BudgetMeter spent={totalSpent} total={total} />
    </div>
  );
}
