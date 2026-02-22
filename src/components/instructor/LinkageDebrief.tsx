import { Team } from '@/lib/types';
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

interface InstructorLinkageDebriefProps {
  teams: Team[];
}

export function InstructorLinkageDebrief({ teams }: InstructorLinkageDebriefProps) {
  const linkageIndex = buildLinkageIndex();

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold text-white">D — Linkage Activation Debrief</h3>
      <div className="space-y-4 text-sm text-slate-200">
        {teams.map((team) => {
          const ordered = [...team.cycleResults].sort((a, b) => a.cycle - b.cycle);
          if (!ordered.length) return null;

          return (
            <details
              key={team.id}
              className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3"
            >
              <summary className="flex cursor-pointer items-center justify-between">
                <div className="text-base font-semibold text-white">{team.name}</div>
                <div className="text-xs text-slate-400">
                  Cycles: {ordered.length} · Final active linkages: {ordered[ordered.length - 1].activeLinkages.length}
                </div>
              </summary>

              <div className="mt-4 space-y-3">
                {ordered.map((result, index) => {
                  const previous = index === 0 ? [] : ordered[index - 1].activeLinkages;
                  const { activated, turnedOff } = diffLinkages(result.activeLinkages, previous);

                  const activeItems = result.activeLinkages.map((id) => linkageIndex[id]).filter(Boolean);
                  const activatedItems = activated.map((id) => linkageIndex[id]).filter(Boolean);
                  const turnedOffItems = turnedOff.map((id) => linkageIndex[id]).filter(Boolean);

                  return (
                    <div key={result.cycle} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                        <span>Cycle {result.cycle}</span>
                        <span>Active: {result.activeLinkages.length}</span>
                      </div>

                      <div className="mt-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Active This Cycle
                        </div>
                        {activeItems.length === 0 ? (
                          <div className="mt-1 text-sm text-slate-500">No linkages active.</div>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {activeItems.map((item) => (
                              <span
                                key={item.id}
                                className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200"
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
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Activated This Round
                          </div>
                          {activatedItems.length === 0 ? (
                            <div className="mt-1 text-sm text-slate-500">None.</div>
                          ) : (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {activatedItems.map((item) => (
                                <span
                                  key={item.id}
                                  className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200"
                                  title={item.description}
                                >
                                  {item.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Turned Off This Round
                          </div>
                          {turnedOffItems.length === 0 ? (
                            <div className="mt-1 text-sm text-slate-500">None.</div>
                          ) : (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {turnedOffItems.map((item) => (
                                <span
                                  key={item.id}
                                  className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200"
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
            </details>
          );
        })}
      </div>
    </section>
  );
}
