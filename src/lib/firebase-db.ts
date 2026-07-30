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
  };

  await set(intentionRef, intention);
  return intention;
}

export async function getIntentionById(userId: string, intentionId: string): Promise<FirebaseIntention | null> {
  const snapshot = await get(ref(db, `intentions/${userId}/${intentionId}`));
  return snapshot.exists() ? (snapshot.val() as FirebaseIntention) : null;
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
  };

  await set(logRef, log);
  return log;
}
