import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { apiFetch } from './api';
import { Intention, RealityLog, TrustTransaction, ReflectionEntry, RecoveryState } from './schema';
import { useSession } from './SessionContext';

interface DataContextType {
  intentions: Intention[];
  logs: RealityLog[];
  trustTransactions: TrustTransaction[];
  journalEntries: ReflectionEntry[];
  recoveryState: RecoveryState | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  intentions: [],
  logs: [],
  trustTransactions: [],
  journalEntries: [],
  recoveryState: null,
  loading: true,
  refresh: async () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: sessionLoading } = useSession();
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [logs, setLogs] = useState<RealityLog[]>([]);
  const [trustTransactions, setTrustTransactions] = useState<TrustTransaction[]>([]);
  const [journalEntries, setJournalEntries] = useState<ReflectionEntry[]>([]);
  const [recoveryState, setRecoveryState] = useState<RecoveryState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setIntentions([]);
      setLogs([]);
      setTrustTransactions([]);
      setJournalEntries([]);
      setRecoveryState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [intentionsData, logsData, trustData, journalData, recoveryData] = await Promise.all([
        apiFetch<{ intentions: Intention[] }>('/api/intentions'),
        apiFetch<{ logs: RealityLog[] }>('/api/logs'),
        apiFetch<{ transactions: TrustTransaction[] }>('/api/trust'),
        apiFetch<{ entries: ReflectionEntry[] }>('/api/journal'),
        apiFetch<{ recoveryState: RecoveryState }>('/api/recovery').catch(() => ({ recoveryState: null })),
      ]);

      setIntentions(intentionsData.intentions ?? []);
      setLogs(logsData.logs ?? []);
      setTrustTransactions(trustData.transactions ?? []);
      setJournalEntries(journalData.entries ?? []);
      setRecoveryState(recoveryData.recoveryState ?? null);
    } catch (e) {
      console.error('Error refreshing DataContext:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (sessionLoading) return;
    refresh();
  }, [sessionLoading, refresh]);

  return (
    <DataContext.Provider
      value={{
        intentions,
        logs,
        trustTransactions,
        journalEntries,
        recoveryState,
        loading,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
