
/**
 * Represents basic user information.
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

/**
 * Represents a user's planned intention.
 */
export interface Intention {
  id: string;
  title: string;
  category: "health" | "work" | "learning" | "personal";
  effortEstimate: number;  // 1–5
  scheduledTime: string;   // "HH:MM"
  estimatedDuration: number; // in minutes
  date: string;            // "YYYY-MM-DD"
  createdAt: string;
  completed?: boolean;
  
  
  // New self-mastery features
  why?: string;            // motivational quote ("Why Vault")
  confidence?: number;     // confidence percentage (e.g. 40)
  priority?: 'low' | 'medium' | 'high';
  identity?: string;       // e.g. "Athlete", "Reader"
  snoozeCount?: number;    // times rescheduled
  skipped?: boolean;       // explicitly skipped status
  skipReason?: string;     // skip justification
  distraction?: string;    // distraction tracker value
  status?: 'scheduled' | 'completed' | 'missed' | 'skipped' | 'rescheduled' | 'recovered';
  recovered?: boolean;
  scheduled_start_time?: string;
  was_recovered?: boolean;
  original_missed_at?: string;
}

/**
 * Represents the recorded outcome of an intention.
 */
export interface RealityLog {
  id: string;
  intentionId: string;     // links to Intention
  completed: boolean;
  actualEffort: number;    // 1–5
  frictionNote: string;    // what went wrong
  contextNote: string;     // mood, energy, situation
  date: string;
  createdAt: string;
  
  // New self-mastery features
  expectedEffort?: number;
  actualEnergy?: number;   // 1–5 actual energy logged
  expectedEnergy?: number;
  moodBefore?: string;     // pre-task mood
  moodAfter?: string;      // post-task mood
  distractions?: string;   // logged distraction
}

export interface RitualStep {
  id: string;
  title: string;
  duration: number;        // in minutes
  why?: string;
  completedCount: number;
  missedCount: number;
}

export interface Ritual {
  id: string;
  userId: string;
  title: string;
  type: 'morning' | 'evening' | 'custom';
  steps: RitualStep[];
  streak: number;
  createdAt: string;
}

export interface TrustTransaction {
  id: string;
  userId: string;
  amount: number;          // e.g. +20, -12
  type: 'deposit' | 'withdrawal';
  description: string;
  date: string;
  createdAt: string;
}

export interface ReflectionEntry {
  id: string;
  userId: string;
  date: string;            // YYYY-MM-DD
  content: string;         // Daily writing prompt text
  gratitude: string;
  lessons: string;
  wins: string;
  mood: number;            // 1-5 rating
  createdAt: string;
}

export interface RecoveryState {
  userId: string;
  currentStreak: number;
  recoveryScore: number;   // rebound efficiency metric
  recoveryStreak: number;  // streak of recovery activities
  lastUpdated: string;
}

