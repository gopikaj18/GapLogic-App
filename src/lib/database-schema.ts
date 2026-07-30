/**
 * GapLogic Database Schema
 * Local Storage Structure and Cloud Database Reference
 */

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
    timezone: string;
  };
}

// Intention/Goal
export interface Intention {
  id: string;
  userId: string;
  title: string;
  category: 'health' | 'work' | 'learning' | 'personal';
  description?: string;
  effortEstimate: number; // 1-5 scale
  estimatedDuration: number; // in minutes
  scheduledTime: string; // HH:MM format
  date: string; // YYYY-MM-DD
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Reality Log (completion record)
export interface RealityLog {
  id: string;
  userId: string;
  intentionId: string;
  completed: boolean;
  actualEffort: number; // 1-5 scale
  actualDuration?: number; // in minutes
  frictionNote: string; // obstacles encountered
  contextNote: string; // mood, energy, environment
  completionTime?: string; // HH:MM format
  date: string; // YYYY-MM-DD
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// AI Feedback/Insight
export interface AIFeedback {
  id: string;
  userId: string;
  type: 'gap' | 'pattern' | 'recommendation' | 'celebration';
  title: string;
  description: string;
  category?: 'health' | 'work' | 'learning' | 'personal' | 'general';
  severity: 'low' | 'medium' | 'high';
  actionItems?: string[];
  relatedIntentionIds?: string[];
  createdAt: string;
  viewed: boolean;
}

// Behavioral Analytics
export interface BehavioralAnalytics {
  userId: string;
  totalIntentions: number;
  totalCompleted: number;
  completionRate: number; // percentage
  currentStreak: number; // days
  longestStreak: number;
  averageEffort: number;
  categoryStats: {
    [key: string]: {
      total: number;
      completed: number;
      rate: number;
    };
  };
  weeklyTrend: Array<{
    date: string;
    intentions: number;
    completed: number;
    rate: number;
  }>;
  timeInvested: {
    total: number; // total minutes
    byCategory: { [key: string]: number };
    daily: { [key: string]: number };
  };
  lastUpdated: string;
}

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  USERS: 'gaplogic_users',
  SESSION: 'gaplogic_session',
  INTENTIONS: 'gaplogic_intentions',
  LOGS: 'gaplogic_logs',
  FEEDBACK: 'gaplogic_feedback',
  ANALYTICS: 'gaplogic_analytics',
  SETTINGS: 'gaplogic_settings',
};

/**
 * Cloud Database Schema (PostgreSQL)
 */
/*
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE intentions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  effort_estimate INTEGER,
  estimated_duration INTEGER,
  scheduled_time VARCHAR(5),
  date DATE NOT NULL,
  priority VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id, date)
);

CREATE TABLE reality_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intention_id UUID NOT NULL REFERENCES intentions(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL,
  actual_effort INTEGER,
  actual_duration INTEGER,
  friction_note TEXT,
  context_note TEXT,
  completion_time VARCHAR(5),
  date DATE NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id, date)
);

CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  severity VARCHAR(50) NOT NULL,
  action_items TEXT[],
  related_intention_ids UUID[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  viewed BOOLEAN DEFAULT FALSE,
  INDEX (user_id, created_at)
);

CREATE TABLE behavioral_analytics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_intentions INTEGER,
  total_completed INTEGER,
  completion_rate DECIMAL(5, 2),
  current_streak INTEGER,
  longest_streak INTEGER,
  average_effort DECIMAL(3, 2),
  category_stats JSONB,
  weekly_trend JSONB,
  time_invested JSONB,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id)
);
*/
