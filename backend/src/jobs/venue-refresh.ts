/**
 * Venue Refresh Job — Phase 3
 * ============================
 * Downloads latest Overture Maps release and upserts into venues table.
 * Marks date_closed for records no longer present in the source.
 * Logs to venue_refresh_log.
 *
 * Triggered via:
 *   POST /api/internal/venue-refresh  (x-internal-key header)
 *   Cloud Scheduler: monthly (1st of each month, 3 AM UTC)
 *
 * Runtime: Cloud Run Job (memory 4GB, timeout 3600s) or same Cloud Run service.
 */

import { spawn } from 'child_process';
import path from 'path';
import { prisma } from '@/services/db';
import { logger } from '@/services/logger';

export interface VenueRefreshResult {
  source: string;
  rowsUpserted: number;
  rowsDeleted: number;
  durationMs: number;
  error?: string;
}

/**
 * Run the Python ETL script for a given source and return stats.
 * Uses spawn so stdout/stderr stream to logs in real-time.
 */
async function runEtlScript(
  scriptName: string,
  args: string[] = [],
): Promise<{ stdout: string; stderr: string; code: number }> {
  const scriptPath = path.join(__dirname, '../../scripts', scriptName);
  const env = {
    ...process.env,
    // DATABASE_URL is already set in Cloud Run
    PYTHONUNBUFFERED: '1',
  };

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn('python3', [scriptPath, ...args], { env });

    proc.stdout.on('data', (d: Buffer) => {
      const s = d.toString();
      stdout += s;
      logger.info(`[venue-refresh] ${s.trim()}`);
    });

    proc.stderr.on('data', (d: Buffer) => {
      const s = d.toString();
      stderr += s;
      logger.warn(`[venue-refresh:stderr] ${s.trim()}`);
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 1 });
    });

    proc.on('error', (err) => {
      stderr += err.message;
      resolve({ stdout, stderr, code: 1 });
    });
  });
}

/**
 * Parse "TOTAL: N" line from ETL script stdout.
 */
function parseRowCount(stdout: string): number {
  const match = stdout.match(/GRAND TOTAL[:\s]+([0-9,]+)/i)
    ?? stdout.match(/TOTAL[:\s]+([0-9,]+)/i)
    ?? stdout.match(/Loaded ([0-9,]+)/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return 0;
}

/**
 * Main refresh job — runs both Overture and OSM/NPS/IMLS ETLs.
 */
export async function runVenueRefresh(): Promise<VenueRefreshResult[]> {
  const results: VenueRefreshResult[] = [];
  logger.info('[venue-refresh] Starting monthly venue refresh');

  // ── 1. Overture Maps (all categories) ────────────────────────────────────
  {
    const startedAt = new Date();
    const startMs = Date.now();

    // Log start
    let logId: number | null = null;
    try {
      const log = await (prisma as any).$queryRaw<Array<{ id: number }>>`
        INSERT INTO venue_refresh_log(source, started_at)
        VALUES ('overture', NOW())
        RETURNING id
      `;
      logId = log[0]?.id ?? null;
    } catch (err) {
      logger.warn('[venue-refresh] Failed to create refresh log entry:', err);
    }

    const { stdout, stderr, code } = await runEtlScript('load-fsq-venues.py', ['--phase', 'all']);
    const durationMs = Date.now() - startMs;
    const rowsUpserted = parseRowCount(stdout);

    const result: VenueRefreshResult = {
      source: 'overture',
      rowsUpserted,
      rowsDeleted: 0,
      durationMs,
      error: code !== 0 ? stderr.slice(0, 500) : undefined,
    };
    results.push(result);

    // Update log
    if (logId) {
      try {
        await (prisma as any).$executeRaw`
          UPDATE venue_refresh_log
          SET completed_at   = NOW(),
              rows_upserted  = ${rowsUpserted},
              rows_deleted   = 0,
              error          = ${result.error ?? null}
          WHERE id = ${logId}
        `;
      } catch { /* non-critical */ }
    }

    logger.info(`[venue-refresh] Overture done: ${rowsUpserted} rows, ${durationMs}ms, code=${code}`);
  }

  // ── 2. OSM Trails + NPS Parks + IMLS Museums ────────────────────────────
  {
    const startMs = Date.now();
    let logId: number | null = null;
    try {
      const log = await (prisma as any).$queryRaw<Array<{ id: number }>>`
        INSERT INTO venue_refresh_log(source, started_at)
        VALUES ('osm+nps+imls', NOW())
        RETURNING id
      `;
      logId = log[0]?.id ?? null;
    } catch { /* non-critical */ }

    const { stdout, stderr, code } = await runEtlScript('load-osm-trails.py', ['--source', 'all']);
    const durationMs = Date.now() - startMs;
    const rowsUpserted = parseRowCount(stdout);

    const result: VenueRefreshResult = {
      source: 'osm+nps+imls',
      rowsUpserted,
      rowsDeleted: 0,
      durationMs,
      error: code !== 0 ? stderr.slice(0, 500) : undefined,
    };
    results.push(result);

    if (logId) {
      try {
        await (prisma as any).$executeRaw`
          UPDATE venue_refresh_log
          SET completed_at  = NOW(),
              rows_upserted = ${rowsUpserted},
              error         = ${result.error ?? null}
          WHERE id = ${logId}
        `;
      } catch { /* non-critical */ }
    }

    logger.info(`[venue-refresh] OSM+NPS+IMLS done: ${rowsUpserted} rows, ${durationMs}ms, code=${code}`);
  }

  logger.info('[venue-refresh] All sources complete');
  return results;
}
