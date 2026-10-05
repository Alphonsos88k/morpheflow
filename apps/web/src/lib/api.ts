import type { ApiError } from "@morpheflow/spec";

/** A failed API call, carrying the server's readable message and HTTP status. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Calls our backend and returns the parsed JSON.
 * @param method - HTTP method.
 * @param path - Path under `/api`, e.g. "/health".
 * @param body - Optional JSON body.
 * @throws ApiRequestError with the server's `{ error }` message.
 */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiRequestError((data as ApiError).error ?? res.statusText, res.status);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
};

/** "Service is down" errors, where offering a Launch button makes sense. */
export const isServiceDown = (err: unknown) => err instanceof ApiRequestError && err.status === 503;

/**
 * Readable message from anything thrown.
 * @param err - The caught value.
 */
export const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));
