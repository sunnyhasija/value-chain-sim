import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exportSessionData } from '@/lib/db';
import { ALL_ACTIVITIES } from '@/lib/activities';
import { LINKAGES } from '@/lib/linkages';
import { buildScorecards } from '@/lib/scorecard';

export async function GET(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const format = searchParams.get('format') || 'json';
    const view = searchParams.get('view') || 'summary';

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const data = await exportSessionData(sessionId);

    const scorecards = buildScorecards(data.teams, data.decisions, ALL_ACTIVITIES);

    if (format === 'csv') {
      if (view === 'scorecard') {
        const rows: string[] = [];

        rows.push([
          'Team Name',
          'Team Code',
          'Cycle',
          'CAS Change',
          'CAS Total',
          'Base Score',
          'Linkage Bonus Total',
          'Shock Effect',
          'NVA Drag',
          'Active Linkages',
          'Avg Health',
          'Avg Health Delta',
          'Allocation Total',
          'Elimination Costs',
          'Spend Total',
          'Cuts Count',
          'Allocation Value-Creating',
          'Allocation Value-Supporting',
          'Allocation Non-Value-Add',
        ].join(','));

        for (const row of scorecards) {
          rows.push([
            `"${row.teamName}"`,
            row.teamCode,
            row.cycle.toString(),
            row.casChange.toFixed(1),
            row.casTotal.toFixed(1),
            row.baseScore.toFixed(1),
            row.linkageBonusTotal.toFixed(1),
            row.shockEffect.toFixed(1),
            row.nvaDrag.toFixed(1),
            row.activeLinkageCount.toString(),
            row.avgHealth.toFixed(1),
            row.avgHealthDelta.toFixed(1),
            row.allocationTotal.toFixed(1),
            row.eliminationCosts.toFixed(1),
            row.spendTotal.toFixed(1),
            row.cutsCount.toString(),
            (row.allocationsByCategory['value-creating'] || 0).toFixed(1),
            (row.allocationsByCategory['value-supporting'] || 0).toFixed(1),
            (row.allocationsByCategory['non-value-add'] || 0).toFixed(1),
          ].join(','));
        }

        const csv = rows.join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="game-${sessionId}-scorecard.csv"`,
          },
        });
      }

      // Create CSV export
      const rows: string[] = [];

      // Header row
      rows.push([
        'Team Name',
        'Team Code',
        'Final CAS',
        'Final Margin',
        'Final Budget',
        ...ALL_ACTIVITIES.map(a => `${a.name} Health`),
        ...LINKAGES.map(l => `${l.id} Active`),
      ].join(','));

      // Data rows
      for (const team of data.teams) {
        const activities = data.teamActivities[team.id] || [];
        const activeLinkages = team.cycleResults[team.cycleResults.length - 1]?.activeLinkages || [];

        const row = [
          `"${team.name}"`,
          team.code,
          team.cas.toFixed(1),
          team.margin.toFixed(2),
          team.budget.toFixed(2),
          ...ALL_ACTIVITIES.map(a => {
            const act = activities.find(ta => ta.activityId === a.id);
            return act ? act.health.toFixed(1) : '0';
          }),
          ...LINKAGES.map(l => activeLinkages.includes(l.id) ? '1' : '0'),
        ];

        rows.push(row.join(','));
      }

      const csv = rows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="game-${sessionId}-export.csv"`,
        },
      });
    }

    // JSON export (default)
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      activityDefinitions: ALL_ACTIVITIES,
      linkageDefinitions: LINKAGES,
      scorecards,
      ...data,
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
