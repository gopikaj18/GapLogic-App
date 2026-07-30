
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
}
