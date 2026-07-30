'use client';

import { Intention, RealityLog } from './schema';
import { apiFetch } from './api-config';

async function parseJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export async function addIntention(
  data: Omit<Intention, 'id' | 'createdAt'>
): Promise<Intention> {
  const result = await parseJsonResponse(
    await apiFetch('/api/intentions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  );
  return result.intention;
}

export async function addRealityLog(
  data: Omit<RealityLog, 'id' | 'createdAt'>
): Promise<RealityLog> {
  const result = await parseJsonResponse(
    await apiFetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  );
  return result.log;
}
