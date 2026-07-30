export interface Intention {
  id: string;
  title: string;
  category: 'health' | 'work' | 'learning' | 'personal';
  effortEstimate: number;
  scheduledTime: string;
  estimatedDuration: number;
  date: string;
  createdAt: string;
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
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
