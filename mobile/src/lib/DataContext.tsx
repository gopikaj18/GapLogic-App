import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { apiFetch } from './api';
import { Intention, RealityLog } from './schema';
import { useSession } from './SessionContext';

interface DataContextType {
  intentions: Intention[];
  logs: RealityLog[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  intentions: [],
  logs: [],
  loading: true,
  refresh: async () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: sessionLoading } = useSession();
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [logs, setLogs] = useState<RealityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setIntentions([]);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [intentionsData, logsData] = await Promise.all([
        apiFetch<{ intentions: Intention[] }>('/api/intentions'),
        apiFetch<{ logs: RealityLog[] }>('/api/logs'),
      ]);
      setIntentions(intentionsData.intentions ?? []);
      setLogs(logsData.logs ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (sessionLoading) return;
    refresh();
  }, [sessionLoading, refresh]);

  return (
    <DataContext.Provider value={{ intentions, logs, loading, refresh }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
