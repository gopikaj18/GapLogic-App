/**
 * @fileOverview Direct native communication helper for local Ollama instance.
 */

export async function queryOllama(prompt: string, format?: 'json'): Promise<string> {
  const url = process.env.OLLAMA_SERVER_ADDRESS || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

  try {
    const res = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({
        model,
        prompt,
        format,
        stream: false,
        options: {
          num_predict: 256,
          temperature: 0.1,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Ollama request failed with status ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();
    return json.response || '';
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Ollama request timed out after 15 seconds.');
    }
    throw error;
  }
}

/**
 * Utility to extract and parse JSON from LLM output, handling markdown wrappers.
 */
export function cleanAndParseJson<T>(text: string): T {
  let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const match = cleanText.match(/\{[\s\S]*\}/);
  if (match) {
    cleanText = match[0];
  }
  // Remove trailing commas which are invalid in JSON
  cleanText = cleanText.replace(/,(\s*[\]\}])/g, '$1');
  return JSON.parse(cleanText) as T;
}

/**
 * Utility to recursively map null values to undefined, as standard in Zod models.
 */
export function sanitizeNulls(obj: any): any {
  if (obj === null) return undefined;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeNulls);
  }
  if (obj && typeof obj === 'object') {
    const clean: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== null) {
        clean[key] = sanitizeNulls(val);
      }
    }
    return clean;
  }
  return obj;
}
