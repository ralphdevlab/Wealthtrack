export type FetchResilientStatus = "waking" | "idle" | "failed";

type FetchResilientOptions = {
  onStatusChange?: (status: FetchResilientStatus) => void;
  /** Per-attempt timeout before that attempt is aborted and retried. */
  timeoutMs?: number;
  /** Delay between retry attempts. */
  retryDelayMs?: number;
  /** Total wall-clock budget across all attempts before giving up. */
  maxTotalWaitMs?: number;
  /** HTTP statuses that should be treated as "still booting" and retried. */
  retryableStatuses?: number[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch() wrapper for waking a sleeping Render free-tier backend: retries on
 * network errors, per-attempt timeouts, and 502/503/504 boot responses,
 * reporting "waking" once trouble is first seen. Any other response
 * (including 4xx like 401) is returned as-is on the first attempt — callers
 * keep their normal res.ok/res.status handling unchanged.
 */
export async function fetchResilient(
  input: string,
  init: RequestInit = {},
  options: FetchResilientOptions = {}
): Promise<Response> {
  const {
    onStatusChange,
    timeoutMs = 5000,
    retryDelayMs = 3000,
    maxTotalWaitMs = 80000,
    retryableStatuses = [502, 503, 504],
  } = options;

  const start = Date.now();
  let announcedWaking = false;

  while (true) {
    try {
      const res = await fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });

      if (retryableStatuses.includes(res.status) && Date.now() - start < maxTotalWaitMs) {
        if (!announcedWaking) {
          announcedWaking = true;
          onStatusChange?.("waking");
        }
        await sleep(retryDelayMs);
        continue;
      }

      if (announcedWaking) onStatusChange?.("idle");
      return res;
    } catch (err) {
      if (Date.now() - start >= maxTotalWaitMs) {
        onStatusChange?.("failed");
        throw err;
      }
      if (!announcedWaking) {
        announcedWaking = true;
        onStatusChange?.("waking");
      }
      await sleep(retryDelayMs);
    }
  }
}
