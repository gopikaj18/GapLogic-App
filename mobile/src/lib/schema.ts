export interface Intention {
  id: string;
  title: string;
  category: 'health' | 'work' | 'learning' | 'personal';
  effortEstimate: number;
  scheduledTime: string;
  estimatedDuration: number;
  date: string;
  createdAt: string;

  // Self-mastery features
  why?: string;
  confidence?: number;
  priority?: 'low' | 'medium' | 'high';
  identity?: string;
  snoozeCount?: number;
  skipped?: boolean;
  skipReason?: string;
  distraction?: string;
  status?: 'scheduled' | 'completed' | 'missed' | 'skipped' | 'rescheduled' | 'recovered';
  recovered?: boolean;
}

export interface RealityLog {
  id: string;
  intentionId: string;
  completed: boolean;
  actualEffort: number;
  frictionNote: string;
  contextNote: string;
  date: string;
  createdAt: string;

  // Self-mastery features
  expectedEffort?: number;
  actualEnergy?: number;
  expectedEnergy?: number;
  moodBefore?: string;
  moodAfter?: string;
  distractions?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface TrustTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  date: string;
  createdAt: string;
}

export interface ReflectionEntry {
  id: string;
  userId: string;
  date: string;
  content: string;
  gratitude: string;
  lessons: string;
  wins: string;
  mood: number;
  createdAt: string;
}

export interface RecoveryState {
  userId: string;
  currentStreak: number;
  recoveryScore: number;
  recoveryStreak: number;
  lastUpdated: string;
}
