import { Intention, RealityLog } from './schema';

export function mapIntention(row: Record<string, unknown>): Intention {
  return {
    id: String(row.id),
    title: String(row.title),
    category: row.category as Intention['category'],
    effortEstimate: Number(row.effort_estimate),
    scheduledTime: String(row.scheduled_time),
    estimatedDuration: Number(row.estimated_duration),
    date: String(row.date),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export function mapLog(row: Record<string, unknown>): RealityLog {
  return {
    id: String(row.id),
    intentionId: String(row.intention_id),
    completed: Boolean(row.completed),
    actualEffort: Number(row.actual_effort),
    frictionNote: String(row.friction_note ?? ''),
    contextNote: String(row.context_note ?? ''),
    date: String(row.date),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}
