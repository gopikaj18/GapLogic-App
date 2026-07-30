'use client';

import { Intention, RealityLog, AIFeedback } from './database-schema';

const FEEDBACK_KEY = 'gaplogic_feedback';

/**
 * Generate AI insights based on user behavior
 */
export function generateAIFeedback(intentions: Intention[], logs: RealityLog[]): AIFeedback[] {
  const feedback: AIFeedback[] = [];

  if (intentions.length === 0 || logs.length === 0) {
    return feedback;
  }

  const completionRate = logs.filter(l => l.completed).length / intentions.length;
  const completedCount = logs.filter(l => l.completed).length;

  // Celebration feedback for milestones
  if (completedCount === 5) {
    feedback.push({
      id: Math.random().toString(36).substring(2, 15),
      userId: '',
      type: 'celebration',
      title: '🎯 First 5 Victories!',
      description: 'You\'ve completed 5 intentions! You\'re building momentum. Keep this energy going.',
      severity: 'low',
      createdAt: new Date().toISOString(),
      viewed: false,
    });
  }

  if (completedCount === 10) {
    feedback.push({
      id: Math.random().toString(36).substring(2, 15),
      userId: '',
      type: 'celebration',
      title: '🚀 Double Digits Achieved!',
      description: 'You\'ve completed 10 intentions! You\'re proving consistency. The gap is closing.',
      severity: 'low',
      createdAt: new Date().toISOString(),
      viewed: false,
    });
  }

  // Completion rate feedback
  if (completionRate < 0.3) {
    feedback.push({
      id: Math.random().toString(36).substring(2, 15),
      userId: '',
      type: 'gap',
      title: '⚠️ Low Completion Rate',
      description: `You're completing only ${Math.round(completionRate * 100)}% of your intentions. This suggests either over-ambitious planning or external blockers.`,
      category: 'general',
      severity: 'high',
      actionItems: [
        'Start with 2-3 intentions per day instead of more',
        'Review friction notes to identify common obstacles',
        'Schedule easier tasks to build confidence',
      ],
      createdAt: new Date().toISOString(),
      viewed: false,
    });
  }

  // Category analysis
  const categoryStats = analyzeCategoryPerformance(intentions, logs);
  for (const [category, stats] of Object.entries(categoryStats)) {
    if (stats.rate < 0.4 && stats.total >= 3) {
      feedback.push({
        id: Math.random().toString(36).substring(2, 15),
        userId: '',
        type: 'gap',
        title: `📊 ${category.toUpperCase()} Struggles`,
        description: `You're only completing ${Math.round(stats.rate * 100)}% of ${category} tasks. This is a weak point.`,
        category: category as any,
        severity: stats.rate < 0.2 ? 'high' : 'medium',
        actionItems: [
          `Reduce effort estimate for ${category} tasks`,
          `Schedule ${category} tasks earlier in the day`,
          `Break larger ${category} goals into smaller steps`,
        ],
        createdAt: new Date().toISOString(),
        viewed: false,
      });
    }
  }

  // Time-based patterns
  const timePatterns = analyzeTimePatterns(intentions, logs);
  if (timePatterns.lateHourFailure) {
    feedback.push({
      id: Math.random().toString(36).substring(2, 15),
      userId: '',
      type: 'pattern',
      title: '⏰ Evening Willpower Drain',
      description: 'Tasks scheduled after 7 PM have a significantly lower completion rate.',
      severity: 'medium',
      actionItems: [
        'Move high-priority tasks to morning/afternoon',
        'Use evenings for lighter, easier tasks',
        'Build rest time before evening tasks',
      ],
      createdAt: new Date().toISOString(),
      viewed: false,
    });
  }

  // Effort estimation bias
  const effortBias = analyzeEffortBias(intentions, logs);
  if (effortBias.overestimate) {
    feedback.push({
      id: Math.random().toString(36).substring(2, 15),
      userId: '',
      type: 'pattern',
      title: '💪 Estimation Bias Detected',
      description: 'You consistently overestimate task difficulty. This affects planning accuracy.',
      severity: 'low',
      actionItems: [
        'Reduce effort estimates by 1 point for similar tasks',
        'Review actual effort vs. estimated effort over time',
        'Account for setup and context-switching time',
      ],
      createdAt: new Date().toISOString(),
      viewed: false,
    });
  }

  // Consistency recommendation
  const streak = calculateCurrentStreak(intentions, logs);
  if (streak > 3) {
    feedback.push({
      id: Math.random().toString(36).substring(2, 15),
      userId: '',
      type: 'recommendation',
      title: '🔥 Maintain Your Streak',
      description: `You have a ${streak}-day streak! Keep going to build stronger habits.`,
      severity: 'low',
      actionItems: [
        'Protect your focus time',
        'Review what\'s working and double down',
        'Celebrate small wins daily',
      ],
      createdAt: new Date().toISOString(),
      viewed: false,
    });
  }

  return feedback;
}

/**
 * Analyze performance by category
 */
function analyzeCategoryPerformance(
  intentions: Intention[],
  logs: RealityLog[]
): Record<string, { total: number; completed: number; rate: number }> {
  const stats: Record<string, { total: number; completed: number; rate: number }> = {};

  intentions.forEach(intention => {
    if (!stats[intention.category]) {
      stats[intention.category] = { total: 0, completed: 0, rate: 0 };
    }
    stats[intention.category].total++;

    const log = logs.find(l => l.intentionId === intention.id && l.completed);
    if (log) {
      stats[intention.category].completed++;
    }
  });

  // Calculate rates
  Object.keys(stats).forEach(category => {
    stats[category].rate =
      stats[category].total > 0
        ? stats[category].completed / stats[category].total
        : 0;
  });

  return stats;
}

/**
 * Analyze time-based patterns
 */
function analyzeTimePatterns(
  intentions: Intention[],
  logs: RealityLog[]
): { lateHourFailure: boolean } {
  const lateHourTasks = intentions.filter(i => {
    const hour = parseInt(i.scheduledTime.split(':')[0]);
    return hour >= 19;
  });

  if (lateHourTasks.length < 2) {
    return { lateHourFailure: false };
  }

  const lateHourCompleted = lateHourTasks.filter(task => {
    const log = logs.find(l => l.intentionId === task.id && l.completed);
    return !!log;
  }).length;

  const lateHourRate = lateHourCompleted / lateHourTasks.length;

  return { lateHourFailure: lateHourRate < 0.4 };
}

/**
 * Detect effort estimation bias
 */
function analyzeEffortBias(
  intentions: Intention[],
  logs: RealityLog[]
): { overestimate: boolean; underestimate: boolean } {
  const completed = logs
    .filter(l => l.completed)
    .map(log => {
      const intention = intentions.find(i => i.id === log.intentionId);
      return {
        estimated: intention?.effortEstimate || 3,
        actual: log.actualEffort,
      };
    });

  if (completed.length === 0) {
    return { overestimate: false, underestimate: false };
  }

  const avgDifference =
    completed.reduce((sum, item) => sum + (item.estimated - item.actual), 0) /
    completed.length;

  return {
    overestimate: avgDifference > 0.5,
    underestimate: avgDifference < -0.5,
  };
}

/**
 * Calculate current completion streak
 */
function calculateCurrentStreak(intentions: Intention[], logs: RealityLog[]): number {
  const dates = Array.from(new Set(intentions.map(i => i.date))).sort((a, b) =>
    b.localeCompare(a)
  );

  let streak = 0;

  for (const date of dates) {
    const dayIntentions = intentions.filter(i => i.date === date);
    const dayCompleted = logs.filter(
      l => l.date === date && l.completed
    ).length;

    if (dayIntentions.length > 0 && dayCompleted === dayIntentions.length) {
      streak++;
    } else if (dayIntentions.length > 0) {
      break;
    }
  }

  return streak;
}

/**
 * Get all feedback from localStorage
 */
export function getFeedback(): AIFeedback[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(FEEDBACK_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save feedback to localStorage
 */
export function saveFeedback(feedback: AIFeedback[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
}

/**
 * Mark feedback as viewed
 */
export function markFeedbackAsViewed(feedbackId: string): void {
  if (typeof window === 'undefined') return;
  const feedback = getFeedback();
  const updated = feedback.map(f =>
    f.id === feedbackId ? { ...f, viewed: true } : f
  );
  saveFeedback(updated);
}
