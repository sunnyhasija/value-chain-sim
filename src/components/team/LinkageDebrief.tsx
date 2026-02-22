import { CycleResult } from '@/lib/types';
import { LINKAGES } from '@/lib/linkages';
import { getActivityById } from '@/lib/activities';

type LinkageRow = {
  id: string;
  label: string;
  description: string;
};

function buildLinkageIndex(): Record<string, LinkageRow> {
  const index: Record<string, LinkageRow> = {};
  for (const linkage of LINKAGES) {
    const support = getActivityById(linkage.supportActivityId);
    const primary = getActivityById(linkage.primaryActivityId);
    const supportName = support?.name || linkage.supportActivityId;
    const primaryName = primary?.name || linkage.primaryActivityId;
    index[linkage.id] = {
      id: linkage.id,
      label: `${supportName} → ${primaryName}`,
      description: linkage.description,
    };
  }
  return index;
}

function diffLinkages(current: string[], previous: string[]) {
  const currentSet = new Set(current);
  const previousSet = new Set(previous);
  const activated = current.filter(id => !previousSet.has(id));
  const turnedOff = previous.filter(id => !currentSet.has(id));
  return { activated, turnedOff };
}

interface LinkageDebriefProps {
  cycleResults: CycleResult[];
}

export function LinkageDebrief({ cycleResults }: LinkageDebriefProps) {
  if (!cycleResults.length) return null;

  const linkageIndex = buildLinkageIndex();
  const ordered = [...cycleResults].sort((a, b) => a.cycle - b.cycle);

  return (
    <div className="mt-6 bg-white rounded-lg shadow p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Value Chain Debrief</h3>
        <p className="text-sm text-gray-600">
          These linkages show where your supporting activities reinforced primary activities.
        </p>
      </div>

      <div className="space-y-4">
        {ordered.map((result, index) => {
          const previous = index === 0 ? [] : ordered[index - 1].activeLinkages;
          const { activated, turnedOff } = diffLinkages(result.activeLinkages, previous);

          const activeItems = result.activeLinkages.map((id) => linkageIndex[id]).filter(Boolean);
          const activatedItems = activated.map((id) => linkageIndex[id]).filter(Boolean);
          const turnedOffItems = turnedOff.map((id) => linkageIndex[id]).filter(Boolean);

          return (
            <div key={result.cycle} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">Cycle {result.cycle}</div>
                <div className="text-xs text-gray-500">
                  Active linkages: {result.activeLinkages.length}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Active This Cycle
                </div>
                {activeItems.length === 0 ? (
                  <div className="mt-1 text-sm text-gray-500">No linkages active.</div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeItems.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                        title={item.description}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Activated This Round
                  </div>
                  {activatedItems.length === 0 ? (
                    <div className="mt-1 text-sm text-gray-500">None.</div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activatedItems.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                          title={item.description}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Turned Off This Round
                  </div>
                  {turnedOffItems.length === 0 ? (
                    <div className="mt-1 text-sm text-gray-500">None.</div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {turnedOffItems.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                          title={item.description}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
