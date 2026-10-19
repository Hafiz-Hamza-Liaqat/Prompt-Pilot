import { LINK_INTELLIGENCE_CONFIG } from './config.js';

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withCoordinatorRetry<T>(
  operation: () => Promise<T>,
  isRetryable: (error: unknown) => boolean,
): Promise<T> {
  const { maxRetries, retryBackoffMs } = LINK_INTELLIGENCE_CONFIG;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !isRetryable(error)) {
        throw error;
      }
      const backoff = retryBackoffMs[Math.min(attempt, retryBackoffMs.length - 1)] ?? 1_000;
      await sleep(backoff);
    }
  }

  throw lastError;
}

export function isRetryableProviderFailure(retryable: boolean): boolean {
  return retryable;
}

export async function fetchMetadataWithRetry<T extends { ok: boolean; retryable?: boolean }>(
  operation: () => Promise<T>,
  isRetryable: (result: T) => boolean,
): Promise<T> {
  const { maxRetries, retryBackoffMs } = LINK_INTELLIGENCE_CONFIG;
  let lastResult: T | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const result = await operation();
    lastResult = result;
    if (result.ok || !isRetryable(result) || attempt >= maxRetries) {
      return result;
    }
    const backoff = retryBackoffMs[Math.min(attempt, retryBackoffMs.length - 1)] ?? 1_000;
    await sleep(backoff);
  }

  return lastResult as T;
}
