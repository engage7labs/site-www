/**
 * Polling Utility
 *
 * Standardized polling logic with lifecycle management and transient failure handling.
 * Ensures reliable status checks with proper cleanup and logging.
 */

export interface PollingState {
  status: "idle" | "polling" | "success" | "error" | "timeout";
  pollCount: number;
  lastError?: Error;
}

export interface PollingConfig {
  maxPolls: number;
  intervalMs: number;
  jobId: string;
}

/**
 * Creates a managed polling lifecycle
 * Returns an update callback and cleanup function
 */
export function createPollingManager(config: PollingConfig) {
  let state: PollingState = {
    status: "idle",
    pollCount: 0,
  };

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  return {
    /**
     * Current polling state
     */
    getState: () => state,

    /**
     * Start polling with the provided async fetch function
     */
    start: async (
      fetchFn: () => Promise<{ status: string; [key: string]: any }>
    ): Promise<void> => {
      if (intervalId) {
        console.warn(`[polling] Already polling for job ${config.jobId}`);
        return;
      }

      stopped = false;
      state = { status: "polling", pollCount: 0 };

      // Initial fetch
      try {
        const result = await fetchFn();
        state.pollCount++;
        logPoll("initial", result.status, config.jobId);

        // Check if already terminal
        if (result.status === "completed" || result.status === "failed") {
          state.status = "success";
          return;
        }
      } catch (error) {
        logPollError("initial", error, config.jobId);
        state.lastError =
          error instanceof Error ? error : new Error(String(error));
        // Continue polling through transient errors
      }

      // Recurring polls
      intervalId = setInterval(async () => {
        state.pollCount++;

        // Check timeout
        if (state.pollCount >= config.maxPolls) {
          state.status = "timeout";
          state.lastError = new Error("Polling timeout");
          cleanup();
          logPoll("timeout", "timeout", config.jobId, state.pollCount);
          return;
        }

        // Fetch status
        try {
          const result = await fetchFn();
          logPoll("poll", result.status, config.jobId, state.pollCount);

          // Check if terminal
          if (result.status === "completed" || result.status === "failed") {
            state.status = "success";
            cleanup();
          }
        } catch (error) {
          logPollError("poll", error, config.jobId, state.pollCount);
          // Silently continue on transient errors
        }
      }, config.intervalMs);
    },

    /**
     * Stop polling manually
     */
    stop: cleanup,
  };

  function cleanup() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    stopped = true;
  }
}

/**
 * Structured logging for polling
 */
function logPoll(
  phase: "initial" | "poll" | "timeout",
  resultStatus: string,
  jobId: string,
  pollCount?: number
) {
  const msg =
    phase === "initial"
      ? "initial fetch"
      : phase === "timeout"
      ? "polling timeout"
      : "poll";
  const pollStr = pollCount ? ` (poll #${pollCount})` : "";
  console.log(`[polling] ${msg}: ${resultStatus} for job ${jobId}${pollStr}`);
}

/**
 * Structured error logging for polling
 */
function logPollError(
  phase: "initial" | "poll",
  error: unknown,
  jobId: string,
  pollCount?: number
) {
  const phase_str = phase === "initial" ? "initial fetch" : "poll";
  const pollStr = pollCount ? ` (poll #${pollCount})` : "";
  const msg = error instanceof Error ? error.message : String(error);
  console.warn(
    `[polling] ${phase_str} error: ${msg} for job ${jobId}${pollStr}`
  );
}
