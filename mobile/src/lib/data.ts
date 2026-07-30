import { apiFetch } from './api';
import { Intention, RealityLog } from './schema';

export async function addIntention(
  data: Omit<Intention, 'id' | 'createdAt'>
): Promise<Intention> {
  const result = await apiFetch<{ intention: Intention }>('/api/intentions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.intention;
}

export async function addRealityLog(
  data: Omit<RealityLog, 'id' | 'createdAt'>
): Promise<RealityLog> {
  const result = await apiFetch<{ log: RealityLog }>('/api/logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.log;
}
