/**
 * Retry Helper with Exponential Backoff
 * Handles transient failures gracefully
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    "NetworkError",
    "TimeoutError",
    "ECONNREFUSED",
    "ETIMEDOUT",
  ],
};

/**
 * Check if error is retryable
 */
function isRetryable(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;

  const errorString = error.toString();
  const errorMessage = error.message || "";
  const errorName = error.name || "";

  return retryableErrors.some(
    (retryableError) =>
      errorString.includes(retryableError) ||
      errorMessage.includes(retryableError) ||
      errorName.includes(retryableError),
  );
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if not retryable or last attempt
      if (
        !isRetryable(error, opts.retryableErrors) ||
        attempt === opts.maxAttempts
      ) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs,
      );

      console.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms...`,
        error,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry helper specifically for fetch requests
 */
export async function retryFetch(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions,
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options);

    // Retry on 5xx errors
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }

    return response;
  }, retryOptions);
}
