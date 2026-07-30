import { NextRequest, NextResponse } from 'next/server';
import { getLogs, getIntentions } from '@/lib/firebase-db';
import { getUserFromRequest } from '@/lib/auth-server';
import { analyzeBehavioralDiscrepancies } from '@/ai/flows/analyze-behavioral-discrepancies';
import { generatePersonalizedRecommendations } from '@/ai/flows/generate-personalized-recommendations';
import { BehavioralClassifier } from '@/ai/models/behavioral-classifier';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch intentions and logs from Firebase RTDB
    const [intentions, logs] = await Promise.all([
      getIntentions(user.id),
      getLogs(user.id),
    ]);

    if (intentions.length === 0 || logs.length === 0) {
      return NextResponse.json({
        discrepancies: [],
        recommendations: [],
      });
    }

    // Limit LLM input to the most recent 10 items for performance optimization
    const maxLlmItems = 10;

    // Filter to only include missed/deviated logs for discrepancy auditing
    const missedLogsForAudit = logs.filter(l => !l.completed).slice(0, 5);

    let discrepancyAnalysis = { discrepancies: [] as any[] };

    if (missedLogsForAudit.length > 0) {
      const auditPlanned = missedLogsForAudit.map(l => {
        const relatedIntention = intentions.find(i => i.id === l.intentionId);
        return {
          id: String(relatedIntention?.id ?? ''),
          description: String(relatedIntention?.title ?? 'Unknown Intention'),
          expectedEffort: String(relatedIntention?.effortEstimate ?? '3'),
          category: String(relatedIntention?.category ?? 'work'),
          dueDate: String(relatedIntention?.date ?? ''),
        };
      });

      const auditActual = missedLogsForAudit.map(l => {
        const relatedIntention = intentions.find(i => i.id === l.intentionId);
        return {
          id: String(l.id),
          description: relatedIntention ? String(relatedIntention.title) : 'Unknown Intention',
          completionStatus: 'not_started' as const,
          notes: String((l.frictionNote || '') + ' ' + (l.contextNote || '')).trim(),
          actualTimeSpent: String(l.actualEffort),
        };
      });

      try {
        discrepancyAnalysis = await analyzeBehavioralDiscrepancies({
          plannedIntentions: auditPlanned,
          actualBehaviors: auditActual,
          analysisContext: `Analyzing past behavioral data of user: ${user.name || 'User'}.`,
        });
      } catch (err) {
        console.warn('[insights] analyzeBehavioralDiscrepancies failed or timed out. Using rule-based fallback.', err);
        // Robust heuristic fallback for discrepancies
        discrepancyAnalysis = {
          discrepancies: auditPlanned.map((p, idx) => {
            const notes = auditActual[idx].notes;
            let explanation = 'The scheduled task was not completed.';
            let reason = 'Friction or priority shift occurred.';
            let insight = 'Try scheduling this intention during your peak energy hours.';

            if (notes.toLowerCase().includes('tired') || notes.toLowerCase().includes('exhaust')) {
              explanation = 'Friction due to fatigue or low physical energy.';
              reason = 'Task scheduled at a time of high temporal fatigue.';
              insight = 'Move demanding tasks to mornings or allocate rest periods beforehand.';
            } else if (notes.toLowerCase().includes('distract') || notes.toLowerCase().includes('phone') || notes.toLowerCase().includes('social')) {
              explanation = 'Environmental distraction interrupted the focus window.';
              reason = 'Lack of digital boundary enforcement or quiet workspace.';
              insight = 'Enable Do Not Disturb mode and use a website blocker for the duration of this task.';
            } else if (notes.toLowerCase().includes('time') || notes.toLowerCase().includes('busy')) {
              explanation = 'Overestimated available time or time budget constraint.';
              reason = 'Time estimation bias or packing too many tasks into the day.';
              insight = 'Double your time estimates and plan only 1 core intention per day.';
            }

            return {
              plannedItem: { id: p.id, description: p.description },
              actualOutcome: { id: auditActual[idx].id, description: auditActual[idx].description, completionStatus: 'not_started' },
              deviationExplanation: explanation,
              inconsistencyReason: reason,
              suggestedInsight: insight,
            };
          })
        };
      }
    }

    // 5. Construct summaries for the Pivot Engine
    const discrepanciesSummary = discrepancyAnalysis.discrepancies.length > 0 
      ? discrepancyAnalysis.discrepancies.map(d => 
          `- Task: "${d.plannedItem.description}". Deviation: ${d.deviationExplanation}. Inconsistency: ${d.inconsistencyReason}`
        ).join('\n')
      : 'No significant behavioral discrepancies detected. The user is executing intentions consistently.';

    const plannedTasks = intentions.slice(0, maxLlmItems).map(i => ({
      name: String(i.title),
      description: `Category: ${i.category}. Scheduled at: ${i.scheduledTime}.`,
      expectedEffortHours: Number(i.effortEstimate) || 3,
    }));

    const actualBehaviorsRec = logs.slice(0, maxLlmItems).map(l => {
      const relatedIntention = intentions.find(i => i.id === l.intentionId);
      return {
        name: relatedIntention ? String(relatedIntention.title) : 'Unknown Intention',
        completed: Boolean(l.completed),
        actualEffortHours: Number(l.actualEffort) || null,
      };
    });

    // 6. Run Pivot Engine Recommendation Flow
    let recommendationAnalysis = { recommendations: [] as any[] };
    try {
      recommendationAnalysis = await generatePersonalizedRecommendations({
        userGoals: `Improve overall behavior integrity, consistency, and willpower alignment in categories: Health, Work, Learning, Personal.`,
        discrepanciesSummary,
        plannedTasks,
        actualBehaviors: actualBehaviorsRec,
      });
    } catch (err) {
      console.warn('[insights] generatePersonalizedRecommendations failed or timed out. Using rule-based fallback.', err);
      // Robust heuristic fallback for recommendations
      const missedCategories = Array.from(new Set(
        missedLogsForAudit.map(l => {
          const relatedIntention = intentions.find(i => i.id === l.intentionId);
          return relatedIntention?.category ?? 'work';
        })
      ));

      recommendationAnalysis = {
        recommendations: [
          {
            title: 'Audit Time of Day Energy Levels',
            description: 'Identify if you are scheduling complex tasks during low-energy periods (e.g., late evenings). Relocate focus tasks to your highest productivity hours.',
            category: 'Time Management' as const,
            rationale: 'Aligning willpower resources with task difficulty dramatically increases completion rates.',
          },
          {
            title: 'Deconstruct Willpower Hurdles',
            description: 'For tasks marked as missed in categories like ' + (missedCategories.join(', ') || 'work') + ', reduce the starting effort to just 10 minutes.',
            category: 'Task Breakdown' as const,
            rationale: 'Starting friction is the largest predictor of task abandonment. Lowering the entry barrier builds immediate momentum.',
          },
          {
            title: 'Establish Focus Environment',
            description: 'Declutter your workspace and block notification sources before commencing high-effort intentions.',
            category: 'Environment Adjustment' as const,
            rationale: 'External triggers bypass conscious willpower. A clean, locked-down environment protects focus automatically.',
          }
        ]
      };
    }

    // Train local Logistic Regression classifier on history
    const historyForClassifier = logs.map(l => {
      const relatedIntention = intentions.find(i => i.id === l.intentionId);
      return {
        category: relatedIntention ? String(relatedIntention.category) : 'work',
        effort: relatedIntention ? Number(relatedIntention.effortEstimate) || 3 : 3,
        scheduledTime: relatedIntention ? String(relatedIntention.scheduledTime || '09:00') : '09:00',
        completed: Boolean(l.completed),
      };
    });

    const classifier = new BehavioralClassifier();
    const chronologicalHistory = [...historyForClassifier].reverse();
    classifier.train(chronologicalHistory);
    const modelInfo = classifier.getModelInfo();

    return NextResponse.json({
      discrepancies: discrepancyAnalysis.discrepancies,
      recommendations: recommendationAnalysis.recommendations,
      modelInfo,
    });
  } catch (error) {
    console.error('[insights API Route Error]', error);
    return NextResponse.json({ error: 'Failed to generate behavioral insights' }, { status: 500 });
  }
}
