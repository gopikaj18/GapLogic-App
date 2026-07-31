'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { Intention, RealityLog, Ritual, TrustTransaction, ReflectionEntry, RecoveryState } from './schema';
import { useSession } from './SessionContext';
import { apiFetch } from './api-config';
import { format } from 'date-fns';

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string; // ISO string
  read: boolean;
}

interface DataContextType {
  intentions: Intention[];
  logs: RealityLog[];
  rituals: Ritual[];
  trustTransactions: TrustTransaction[];
  journalEntries: ReflectionEntry[];
  recoveryState: RecoveryState | null;
  loading: boolean;
  refresh: () => Promise<void>;
  notifications: InAppNotification[];
  addNotification: (title: string, body: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
}

const DataContext = createContext<DataContextType>({
  intentions: [],
  logs: [],
  rituals: [],
  trustTransactions: [],
  journalEntries: [],
  recoveryState: null,
  loading: true,
  refresh: async () => {},
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAllNotifications: () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: sessionLoading } = useSession();
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [logs, setLogs] = useState<RealityLog[]>([]);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [trustTransactions, setTrustTransactions] = useState<TrustTransaction[]>([]);
  const [journalEntries, setJournalEntries] = useState<ReflectionEntry[]>([]);
  const [recoveryState, setRecoveryState] = useState<RecoveryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gaplogic_in_app_notifications');
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const addNotification = useCallback((title: string, body: string) => {
    const newNotif: InAppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('gaplogic_in_app_notifications', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gaplogic_in_app_notifications', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('gaplogic_in_app_notifications', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gaplogic_in_app_notifications', JSON.stringify([]));
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setIntentions([]);
      setLogs([]);
      setRituals([]);
      setTrustTransactions([]);
      setJournalEntries([]);
      setRecoveryState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        intentionsRes,
        logsRes,
        ritualsRes,
        trustRes,
        journalRes,
        recoveryRes
      ] = await Promise.all([
        apiFetch('/api/intentions'),
        apiFetch('/api/logs'),
        apiFetch('/api/rituals'),
        apiFetch('/api/trust'),
        apiFetch('/api/journal'),
        apiFetch('/api/recovery'),
      ]);

      let rawIntentions: Intention[] = [];
      let rawLogs: RealityLog[] = [];

      if (intentionsRes.ok) {
        const data = await intentionsRes.json();
        rawIntentions = data.intentions ?? [];
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        rawLogs = data.logs ?? [];
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const currentTimeStr = format(new Date(), 'HH:mm');

      const resolvedIntentions = rawIntentions.map((task: Intention): Intention => {
        const isCompleted = rawLogs.some((l: RealityLog) => l.intentionId === task.id && l.completed);
        const isSkipped = task.skipped === true || task.status === 'skipped';

        if (isCompleted) {
          if (task.status === 'rescheduled' || task.status === 'recovered' || task.recovered) {
            return { ...task, status: 'recovered', recovered: true };
          }
          return { ...task, status: 'completed' };
        }

        if (isSkipped) {
          return { ...task, status: 'skipped' };
        }

        const isPastDate = task.date < todayStr;
        const isToday = task.date === todayStr;
        const hasTimePassed = isToday && task.scheduledTime && task.scheduledTime < currentTimeStr;

        if (isPastDate || hasTimePassed || task.status === 'missed') {
          return { ...task, status: 'missed' };
        }

        if (task.status === 'rescheduled') {
          return { ...task, status: 'rescheduled' };
        }

        return { ...task, status: 'scheduled' };
      });

      setIntentions(resolvedIntentions);
      setLogs(rawLogs);

      if (ritualsRes.ok) {
        const data = await ritualsRes.json();
        setRituals(data.rituals ?? []);
      }

      if (trustRes.ok) {
        const data = await trustRes.json();
        setTrustTransactions(data.transactions ?? []);
      }

      if (journalRes.ok) {
        const data = await journalRes.json();
        setJournalEntries(data.entries ?? []);
      }

      if (recoveryRes.ok) {
        const data = await recoveryRes.json();
        setRecoveryState(data.recoveryState ?? null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (sessionLoading) return;
    refresh();
  }, [sessionLoading, refresh]);

  return (
    <DataContext.Provider value={{
      intentions,
      logs,
      rituals,
      trustTransactions,
      journalEntries,
      recoveryState,
      loading,
      refresh,
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAllNotifications
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

