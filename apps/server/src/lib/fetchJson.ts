/**
 * `fetch` + JSON parse with a timeout. Throws on non-2xx, including the response body in the message.
 * @param url - Full URL.
 * @param init - Standard fetch options.
 * @param timeoutMs - Abort after this many milliseconds.
 */
export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 500)}`);
  return JSON.parse(body) as T;
}
