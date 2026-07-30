'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { Intention, RealityLog } from './schema';
import { useSession } from './SessionContext';
import { apiFetch } from './api-config';

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

export const DataProvider = ({ children }: { children: ReactNode }) => {
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
      const [intentionsRes, logsRes] = await Promise.all([
        apiFetch('/api/intentions'),
        apiFetch('/api/logs'),
      ]);

      if (intentionsRes.ok) {
        const data = await intentionsRes.json();
        setIntentions(data.intentions ?? []);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs ?? []);
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
    <DataContext.Provider value={{ intentions, logs, loading, refresh }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
