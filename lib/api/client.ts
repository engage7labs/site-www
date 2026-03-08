/**
 * API Client
 *
 * Base HTTP client with error handling and type safety.
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

interface RequestConfig extends RequestInit {
  timeout?: number;
}

/**
 * Makes an HTTP request with timeout and error handling.
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { timeout = API_TIMEOUT, ...fetchConfig } = config;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchConfig,
      signal: controller.signal,
      headers: {
        ...DEFAULT_HEADERS,
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
        errorData.message || errorData.error,
        errorData.details
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
