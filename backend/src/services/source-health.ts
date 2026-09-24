/**
 * In-memory per-source health tracker for the suggestion engine.
 * Updated on every getSuggestions fetch; exposed at GET /api/internal/source-health.
 * Module-level state — resets on process restart (Cloud Run instance), which is fine:
 * the point is visibility into silent source failures on a live instance.
 */

export interface SourceHealth {
  lastAttemptAt?: string;   // ISO timestamp
  lastSuccessAt?: string;   // ISO timestamp of last non-error attempt
  lastResultCount?: number; // result count of last successful attempt
  lastError?: string;       // message from last failed attempt
}

const health: Record<string, SourceHealth> = {};

export function recordSourceAttempt(source: string): void {
  const h = (health[source] ??= {});
  h.lastAttemptAt = new Date().toISOString();
}

export function recordSourceSuccess(source: string, resultCount: number): void {
  const h = (health[source] ??= {});
  h.lastSuccessAt = new Date().toISOString();
  h.lastResultCount = resultCount;
}

export function recordSourceError(source: string, error: unknown): void {
  const h = (health[source] ??= {});
  h.lastError = error instanceof Error ? error.message : String(error);
}

export function getSourceHealth(): Record<string, SourceHealth> {
  return health;
}
