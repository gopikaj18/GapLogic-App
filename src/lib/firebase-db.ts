import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, get, set, push } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

// Helper to encode emails because Firebase keys cannot contain '.'
export function encodeEmail(email: string): string {
  return email.toLowerCase().replace(/\./g, ',');
}

// --- USER OPERATIONS ---
export interface FirebaseUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export async function getUserById(id: string): Promise<FirebaseUser | null> {
  const snapshot = await get(ref(db, `users/${id}`));
  return snapshot.exists() ? (snapshot.val() as FirebaseUser) : null;
}

export async function getUserByEmail(email: string): Promise<FirebaseUser | null> {
  const encoded = encodeEmail(email);
  const snapshot = await get(ref(db, `usersByEmail/${encoded}`));
  if (!snapshot.exists()) return null;
  const userId = snapshot.val() as string;
  return getUserById(userId);
}

export async function createUser(id: string, email: string, passwordHash: string, name: string): Promise<FirebaseUser> {
  const user: FirebaseUser = {
    id,
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await set(ref(db, `users/${id}`), user);
  await set(ref(db, `usersByEmail/${encodeEmail(email)}`), id);
  return user;
}

// --- INTENTION OPERATIONS ---
export interface FirebaseIntention {
  id: string;
  userId: string;
  title: string;
  category: 'health' | 'work' | 'learning' | 'personal';
  effortEstimate: number;
  scheduledTime: string;
  estimatedDuration: number;
  date: string;
  createdAt: string;

  // New fields
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
  scheduled_start_time?: string;
  was_recovered?: boolean;
  original_missed_at?: string;
}

export async function getIntentions(userId: string): Promise<FirebaseIntention[]> {
  const snapshot = await get(ref(db, `intentions/${userId}`));
  if (!snapshot.exists()) return [];
  const val = snapshot.val();
  // Convert object mapped by key to sorted array by createdAt
  const arr = Object.values(val) as FirebaseIntention[];
  return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createIntention(
  userId: string,
  data: Omit<FirebaseIntention, 'id' | 'userId' | 'createdAt'>
): Promise<FirebaseIntention> {
  const intentionRef = push(ref(db, `intentions/${userId}`));
  const id = intentionRef.key as string;
  
  const intention: FirebaseIntention = {
    id,
    userId,
    title: data.title,
    category: data.category,
    effortEstimate: data.effortEstimate,
    scheduledTime: data.scheduledTime,
    estimatedDuration: data.estimatedDuration,
    date: data.date,
    createdAt: new Date().toISOString(),
    why: data.why || '',
    confidence: data.confidence || 100,
    priority: data.priority || 'medium',
    identity: data.identity || '',
    snoozeCount: data.snoozeCount || 0,
    skipped: data.skipped || false,
    skipReason: data.skipReason || '',
    distraction: data.distraction || '',
  };

  await set(intentionRef, intention);
  return intention;
}

export async function updateIntention(
  userId: string,
  intentionId: string,
  data: Partial<FirebaseIntention>
): Promise<FirebaseIntention> {
  const intentionRef = ref(db, `intentions/${userId}/${intentionId}`);
  const snapshot = await get(intentionRef);
  if (!snapshot.exists()) {
    throw new Error('Intention not found');
  }
  const current = snapshot.val() as FirebaseIntention;
  const updated = { ...current, ...data };
  await set(intentionRef, updated);
  return updated;
}

export async function getIntentionById(userId: string, intentionId: string): Promise<FirebaseIntention | null> {
  const snapshot = await get(ref(db, `intentions/${userId}/${intentionId}`));
  return snapshot.exists() ? (snapshot.val() as FirebaseIntention) : null;
}

export async function deleteIntention(userId: string, intentionId: string): Promise<void> {
  const intentionRef = ref(db, `intentions/${userId}/${intentionId}`);
  await set(intentionRef, null);
}

// --- LOG OPERATIONS ---
export interface FirebaseRealityLog {
  id: string;
  userId: string;
  intentionId: string;
  completed: boolean;
  actualEffort: number;
  frictionNote: string;
  contextNote: string;
  date: string;
  createdAt: string;

  // New fields
  expectedEffort?: number;
  actualEnergy?: number;
  expectedEnergy?: number;
  moodBefore?: string;
  moodAfter?: string;
  distractions?: string;
}

export async function getLogs(userId: string): Promise<FirebaseRealityLog[]> {
  const snapshot = await get(ref(db, `logs/${userId}`));
  if (!snapshot.exists()) return [];
  const val = snapshot.val();
  const arr = Object.values(val) as FirebaseRealityLog[];
  return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createLog(
  userId: string,
  data: Omit<FirebaseRealityLog, 'id' | 'userId' | 'createdAt'>
): Promise<FirebaseRealityLog> {
  const logRef = push(ref(db, `logs/${userId}`));
  const id = logRef.key as string;

  const log: FirebaseRealityLog = {
    id,
    userId,
    intentionId: data.intentionId,
    completed: data.completed,
    actualEffort: data.actualEffort,
    frictionNote: data.frictionNote,
    contextNote: data.contextNote,
    date: data.date,
    createdAt: new Date().toISOString(),
    expectedEffort: data.expectedEffort || 3,
    actualEnergy: data.actualEnergy || 3,
    expectedEnergy: data.expectedEnergy || 3,
    moodBefore: data.moodBefore || '',
    moodAfter: data.moodAfter || '',
    distractions: data.distractions || '',
  };

  await set(logRef, log);
  return log;
}

// --- RITUAL OPERATIONS ---
import { Ritual, TrustTransaction, ReflectionEntry, RecoveryState } from './schema';

export async function getRituals(userId: string): Promise<Ritual[]> {
  const snapshot = await get(ref(db, `rituals/${userId}`));
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val()) as Ritual[];
}

export async function createRitual(
  userId: string,
  data: Omit<Ritual, 'id' | 'userId' | 'createdAt'>
): Promise<Ritual> {
  const ritualRef = push(ref(db, `rituals/${userId}`));
  const id = ritualRef.key as string;
  const ritual: Ritual = {
    id,
    userId,
    title: data.title,
    type: data.type,
    steps: data.steps || [],
    streak: data.streak || 0,
    createdAt: new Date().toISOString(),
  };
  await set(ritualRef, ritual);
  return ritual;
}

export async function updateRitual(
  userId: string,
  ritualId: string,
  data: Partial<Ritual>
): Promise<Ritual> {
  const ritualRef = ref(db, `rituals/${userId}/${ritualId}`);
  const snapshot = await get(ritualRef);
  if (!snapshot.exists()) {
    throw new Error('Ritual not found');
  }
  const current = snapshot.val() as Ritual;
  const updated = { ...current, ...data };
  await set(ritualRef, updated);
  return updated;
}

export async function deleteRitual(userId: string, ritualId: string): Promise<void> {
  const ritualRef = ref(db, `rituals/${userId}/${ritualId}`);
  await set(ritualRef, null);
}

// --- TRUST BANK OPERATIONS ---
export async function getTrustTransactions(userId: string): Promise<TrustTransaction[]> {
  const snapshot = await get(ref(db, `trustTransactions/${userId}`));
  if (!snapshot.exists()) return [];
  const list = Object.values(snapshot.val()) as TrustTransaction[];
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createTrustTransaction(
  userId: string,
  data: Omit<TrustTransaction, 'id' | 'userId' | 'createdAt'>
): Promise<TrustTransaction> {
  const txRef = push(ref(db, `trustTransactions/${userId}`));
  const id = txRef.key as string;
  const tx: TrustTransaction = {
    id,
    userId,
    amount: data.amount,
    type: data.type,
    description: data.description,
    date: data.date,
    createdAt: new Date().toISOString(),
  };
  await set(txRef, tx);
  return tx;
}

// --- REFLECTION JOURNAL OPERATIONS ---
export async function getJournalEntries(userId: string): Promise<ReflectionEntry[]> {
  const snapshot = await get(ref(db, `journal/${userId}`));
  if (!snapshot.exists()) return [];
  const list = Object.values(snapshot.val()) as ReflectionEntry[];
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createJournalEntry(
  userId: string,
  data: Omit<ReflectionEntry, 'id' | 'userId' | 'createdAt'>
): Promise<ReflectionEntry> {
  const entryRef = push(ref(db, `journal/${userId}`));
  const id = entryRef.key as string;
  const entry: ReflectionEntry = {
    id,
    userId,
    date: data.date,
    content: data.content,
    gratitude: data.gratitude,
    lessons: data.lessons,
    wins: data.wins,
    mood: data.mood,
    createdAt: new Date().toISOString(),
  };
  await set(entryRef, entry);
  return entry;
}

// --- RECOVERY OPERATIONS ---
export async function getRecoveryState(userId: string): Promise<RecoveryState | null> {
  const snapshot = await get(ref(db, `recoveryState/${userId}`));
  return snapshot.exists() ? (snapshot.val() as RecoveryState) : null;
}

export async function updateRecoveryState(
  userId: string,
  data: Partial<RecoveryState>
): Promise<RecoveryState> {
  const recoveryRef = ref(db, `recoveryState/${userId}`);
  const snapshot = await get(recoveryRef);
  const current = snapshot.exists()
    ? (snapshot.val() as RecoveryState)
    : {
        userId,
        currentStreak: 0,
        recoveryScore: 100,
        recoveryStreak: 0,
        lastUpdated: new Date().toISOString(),
      };
  const updated = { ...current, ...data, lastUpdated: new Date().toISOString() };
  await set(recoveryRef, updated);
  return updated;
}

