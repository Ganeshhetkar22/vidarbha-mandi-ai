/**
 * Centralized API configuration for the frontend.
 *
 * All backend API calls go through this module.
 * The base URL is configurable via VITE_API_BASE_URL.
 *
 * For local development:  VITE_API_BASE_URL=http://localhost:5000
 * For production:         VITE_API_BASE_URL=https://your-api-domain.com
 *
 * If VITE_API_BASE_URL is not set, backend-dependent features
 * (like triggering ML predictions) will show a "not configured" state.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export const isApiConfigured = Boolean(API_BASE_URL);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiFetch(path, options = {}) {
  if (!isApiConfigured) {
    throw new ApiError('API base URL not configured. Set VITE_API_BASE_URL in your .env file.');
  }
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(`API request failed (${response.status})`, response.status);
    }
    return response;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out. The server may be offline.');
    }
    throw new ApiError('Failed to connect to the backend server. Is it running?');
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiGet(path) {
  const response = await apiFetch(path);
  return await response.json();
}

export async function apiPost(path, body) {
  const response = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return await response.json();
}
