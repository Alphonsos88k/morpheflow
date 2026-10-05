import type { ContentfulStatusCode } from "hono/utils/http-status";

/** An error that should reach the user as-is, with an HTTP status. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: ContentfulStatusCode = 400,
  ) {
    super(message);
  }
}

/**
 * Extracts a readable message from anything thrown.
 * @param err - The caught value.
 */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
