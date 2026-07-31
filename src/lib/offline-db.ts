import { Intention, RealityLog, Ritual, TrustTransaction, ReflectionEntry, RecoveryState } from './schema';

// Helper to read from LocalStorage
function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const val = localStorage.getItem(key);
  if (!val) return defaultValue;
  try {
    return JSON.parse(val) as T;
  } catch {
    return defaultValue;
  }
}

// Helper to write to LocalStorage
function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Intercept local mock router
export async function handleOfflineRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const url = new URL(path, 'http://localhost');
  const pathname = url.pathname;
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Mock delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // 1. AUTH ENDPOINTS
  if (pathname === '/api/auth/me') {
    const user = getLocal('offline_user', { id: 'offline_user', email: 'user@gaplogic.local', name: 'GapLogic User', createdAt: new Date().toISOString() });
    return new Response(JSON.stringify(user), { status: 200 });
  }

  if (pathname === '/api/auth/login' || pathname === '/api/auth/register' || pathname === '/api/auth/google') {
    const email = body.email || 'user@gaplogic.local';
    const name = body.name || 'GapLogic User';
    const user = { id: 'offline_user', email, name, createdAt: new Date().toISOString() };
    setLocal('offline_user', user);
    setLocal('gaplogic_token', 'offline_session_token');
    return new Response(JSON.stringify({ user, token: 'offline_session_token' }), { status: 200 });
  }

  // 2. INTENTIONS ENDPOINTS
  if (pathname === '/api/intentions') {
    let intentions = getLocal<Intention[]>('offline_intentions', []);
    
    if (method === 'GET') {
      return new Response(JSON.stringify({ intentions }), { status: 200 });
    }
    
    if (method === 'POST') {
      const newIntention: Intention = {
        id: Math.random().toString(36).substr(2, 9),
        title: body.title,
        category: body.category,
        scheduledTime: body.scheduledTime,
        estimatedDuration: Number(body.estimatedDuration) || Number(body.duration) || 30,
        effortEstimate: Number(body.effortEstimate) || 3,
        date: body.date,
        completed: false,
        why: body.why || '',
        confidence: Number(body.confidence) || 100,
        priority: body.priority || 'medium',
        identity: body.identity || '',
        snoozeCount: 0,
        skipped: false,
        skipReason: '',
        distraction: '',
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };
      intentions.push(newIntention);
      setLocal('offline_intentions', intentions);
      return new Response(JSON.stringify({ success: true, intention: newIntention }), { status: 200 });
    }

    if (method === 'PATCH') {
      // Intentions updates (snoozing/skipping)
      const { id, ...updates } = body;
      intentions = intentions.map(item => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        return item;
      });
      setLocal('offline_intentions', intentions);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      intentions = intentions.filter(item => item.id !== id);
      setLocal('offline_intentions', intentions);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
  }

  // 3. LOGS ENDPOINTS
  if (pathname === '/api/logs') {
    let logs = getLocal<RealityLog[]>('offline_logs', []);
    
    if (method === 'GET') {
      return new Response(JSON.stringify({ logs }), { status: 200 });
    }

    if (method === 'POST') {
      const newLog: RealityLog = {
        id: Math.random().toString(36).substr(2, 9),
        intentionId: body.intentionId,
        completed: body.completed,
        actualEffort: Number(body.actualEffort) || 3,
        frictionNote: body.frictionNote || '',
        contextNote: body.contextNote || '',
        date: body.date,
        expectedEffort: Number(body.expectedEffort) || 3,
        actualEnergy: Number(body.actualEnergy) || 3,
        expectedEnergy: Number(body.expectedEnergy) || 3,
        moodBefore: body.moodBefore || 'Calm',
        moodAfter: body.moodAfter || 'Calm',
        distractions: body.distractions || '',
        createdAt: new Date().toISOString()
      };
      
      // Update completion in intentions list
      let intentions = getLocal<Intention[]>('offline_intentions', []);
      intentions = intentions.map(item => {
        if (item.id === body.intentionId) {
          const updatedItem: Intention = { ...item, completed: body.completed };
          if (body.completed) {
            if (item.status === 'rescheduled' || item.status === 'recovered' || item.recovered) {
              updatedItem.status = 'recovered';
              updatedItem.recovered = true;
            } else {
              updatedItem.status = 'completed';
            }
          } else {
            updatedItem.status = 'missed';
          }
          return updatedItem;
        }
        return item;
      });
      setLocal('offline_intentions', intentions);

      logs.push(newLog);
      setLocal('offline_logs', logs);
      return new Response(JSON.stringify({ success: true, log: newLog }), { status: 200 });
    }
  }

  // 4. RITUALS ENDPOINTS
  if (pathname === '/api/rituals') {
    let rituals = getLocal<Ritual[]>('offline_rituals', []);

    if (method === 'GET') {
      return new Response(JSON.stringify({ rituals }), { status: 200 });
    }

    if (method === 'POST') {
      // Upsert ritual
      const updatedRitual = body;
      const index = rituals.findIndex(r => r.id === updatedRitual.id || r.type === updatedRitual.type);
      if (index > -1) {
        rituals[index] = { ...rituals[index], ...updatedRitual };
      } else {
        updatedRitual.id = updatedRitual.id || Math.random().toString(36).substr(2, 9);
        rituals.push(updatedRitual as Ritual);
      }
      setLocal('offline_rituals', rituals);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
  }

  // 5. TRUST TRANSACTIONS
  if (pathname === '/api/trust') {
    let transactions = getLocal<TrustTransaction[]>('offline_trust', []);

    if (method === 'GET') {
      return new Response(JSON.stringify({ transactions }), { status: 200 });
    }

    if (method === 'POST') {
      const newTx: TrustTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        userId: 'offline_user',
        amount: Number(body.amount),
        type: body.type,
        description: body.description,
        date: body.date,
        createdAt: new Date().toISOString()
      };
      transactions.push(newTx);
      setLocal('offline_trust', transactions);
      return new Response(JSON.stringify({ success: true, transaction: newTx }), { status: 200 });
    }
  }

  // 6. REFLECTION JOURNAL
  if (pathname === '/api/journal') {
    let entries = getLocal<ReflectionEntry[]>('offline_journal', []);

    if (method === 'GET') {
      return new Response(JSON.stringify({ entries }), { status: 200 });
    }

    if (method === 'POST') {
      const newEntry: ReflectionEntry = {
        id: Math.random().toString(36).substr(2, 9),
        userId: 'offline_user',
        date: body.date,
        content: body.content,
        gratitude: body.gratitude || '',
        lessons: body.lessons || '',
        wins: body.wins || '',
        mood: Number(body.mood) || 3,
        createdAt: new Date().toISOString()
      };
      entries.push(newEntry);
      setLocal('offline_journal', entries);
      return new Response(JSON.stringify({ success: true, entry: newEntry }), { status: 200 });
    }
  }

  // 7. RECOVERY STATE
  if (pathname === '/api/recovery') {
    let state = getLocal<RecoveryState | null>('offline_recovery', null);

    if (method === 'GET') {
      return new Response(JSON.stringify({ recoveryState: state }), { status: 200 });
    }

    if (method === 'POST') {
      state = {
        userId: 'offline_user',
        currentStreak: body.currentStreak ?? state?.currentStreak ?? 0,
        recoveryScore: body.recoveryScore ?? state?.recoveryScore ?? 100,
        recoveryStreak: body.recoveryStreak ?? state?.recoveryStreak ?? 0,
        lastUpdated: new Date().toISOString()
      };
      setLocal('offline_recovery', state);
      return new Response(JSON.stringify({ success: true, recoveryState: state }), { status: 200 });
    }
  }

  return new Response(JSON.stringify({ error: 'Mock endpoint not found' }), { status: 404 });
}
