/**
 * API Client
 *
 * Base HTTP client with error handling, retry logic, and type safety.
 */

import type { ApiError } from "@/lib/types/analysis";
import { API_BASE_URL, API_TIMEOUT, DEFAULT_HEADERS } from "./config";

class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    public details?: any
  ) {
    super(error);
    this.name = "ApiClientError";
  }
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) return false;

  // Timeout errors are retryable
  if (error.statusCode === 408) return true;

  // Server errors (5xx) are retryable
  if (error.statusCode >= 500) return true;

  // Network errors (statusCode 0) are retryable
  if (error.statusCode === 0) return true;

  return false;
}

/**
 * Retries a request with exponential backoff (max 2 retries)
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 500ms, 1000ms
      const delayMs = 500 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

interface RequestConfig extends RequestInit {
  timeout?: number;
  skipRetry?: boolean;
}

/**
 * Makes an HTTP request with timeout and error handling.
 * Automatically retries transient failures.
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { timeout = API_TIMEOUT, skipRetry = false, ...fetchConfig } = config;

  const makeRequest = async (): Promise<T> => {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
        headers: {
          ...(fetchConfig.body instanceof FormData ? {} : DEFAULT_HEADERS),
          ...fetchConfig.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: "API Error",
            message: `Request failed with status ${response.status}`,
            statusCode: response.status,
          };
        }

        throw new ApiClientError(
          response.status,
          errorData.message ||
            errorData.error ||
            (typeof (errorData as any).detail === "string"
              ? (errorData as any).detail
              : `HTTP ${response.status}`),
          (errorData as any).detail ?? errorData.details
        );
      }

      // Parse successful response
      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiClientError(408, "Request timeout");
      }

      // Re-throw ApiClientError
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Handle network errors
      throw new ApiClientError(
        0,
        "Network error. Please check your connection.",
        error
      );
    }
  };

  // Apply retry logic unless explicitly skipped
  if (skipRetry) {
    return makeRequest();
  }

  return withRetry(makeRequest);
}

/**
 * GET request
 */
export async function get<T>(
  endpoint: string,
  config?: RequestConfig
): Promise<T> {
  return request<T>(endpoint, {
    ...config,
    method: "GET",
  });
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  data?: any,
  config?: RequestConfig
): Promise<T> {
  return request<T>(endpoint, {
    ...config,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * POST request with FormData (for file uploads)
 */
export async function postFormData<T>(
  endpoint: string,
  formData: FormData,
  config?: RequestConfig
): Promise<T> {
  // Remove Content-Type header for FormData (browser sets it with boundary)
  const { headers, ...restConfig } = config || {};
  const filteredHeaders = headers
    ? Object.fromEntries(
        Object.entries(headers).filter(
          ([key]) => key.toLowerCase() !== "content-type"
        )
      )
    : {};

  return request<T>(endpoint, {
    ...restConfig,
    method: "POST",
    headers: filteredHeaders,
    body: formData,
  });
}

/**
 * DELETE request
 */
export async function del<T>(
  endpoint: string,
  config?: RequestConfig
): Promise<T> {
  return request<T>(endpoint, {
    ...config,
    method: "DELETE",
  });
}

export { ApiClientError };
