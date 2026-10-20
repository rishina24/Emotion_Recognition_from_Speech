// Centralized API client for VoxSense AI
import type {
  HealthResponse,
  ModelStatusResponse,
  ModelInfoResponse,
  PredictionResponse,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '';
const REQUEST_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor() {
    super('Analysis took too long. Your selected audio has been preserved. Please retry.');
    this.name = 'TimeoutError';
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === 'string') return body.detail;
    return JSON.stringify(body);
  } catch {
    return `HTTP ${res.status}: ${res.statusText}`;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  signal?: AbortSignal,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const combinedSignal = signal
    ? (() => {
        const ac = new AbortController();
        signal.addEventListener('abort', () => ac.abort());
        controller.signal.addEventListener('abort', () => ac.abort());
        return ac.signal;
      })()
    : controller.signal;

  try {
    const res = await fetch(url, { ...init, signal: combinedSignal });
    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      if (controller.signal.aborted) throw new TimeoutError();
      throw err; // user-aborted
    }
    throw new NetworkError(
      'The analysis service is currently unreachable. Check that the backend is running.',
    );
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  async health(): Promise<HealthResponse> {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/health`, { method: 'GET' }, undefined, 5000);
    if (!res.ok) throw new ApiError(await parseError(res), res.status);
    return res.json();
  },

  async modelStatus(): Promise<ModelStatusResponse> {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/model/status`, { method: 'GET' }, undefined, 5000);
    if (!res.ok) throw new ApiError(await parseError(res), res.status);
    return res.json();
  },

  async modelInfo(): Promise<ModelInfoResponse> {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/model/info`, { method: 'GET' }, undefined, 5000);
    if (!res.ok) throw new ApiError(await parseError(res), res.status);
    return res.json();
  },

  async predict(
    audioBlob: Blob,
    filename: string,
    signal?: AbortSignal,
  ): Promise<PredictionResponse> {
    if (!audioBlob || audioBlob.size === 0) {
      throw new ApiError('The audio file is empty.', 400);
    }

    const formData = new FormData();
    // IMPORTANT: field name must match FastAPI endpoint parameter name
    formData.append('audio', audioBlob, filename);
    // Do NOT set Content-Type manually — browser sets boundary automatically

    const res = await fetchWithTimeout(
      `${BASE_URL}/api/v1/predict`,
      { method: 'POST', body: formData },
      signal,
    );

    if (!res.ok) {
      const msg = await parseError(res);
      if (res.status === 503) {
        throw new ApiError(
          msg || 'The emotion model is not ready. Follow the model training instructions before running predictions.',
          503,
        );
      }
      throw new ApiError(msg, res.status);
    }

    const data = await res.json();

    // Validate response schema
    if (
      typeof data.predicted_emotion !== 'string' ||
      typeof data.confidence !== 'number' ||
      typeof data.probabilities !== 'object' ||
      typeof data.model_version !== 'string'
    ) {
      throw new ApiError(
        'The analysis service returned an invalid response. Your audio is preserved; you can retry or check diagnostics.',
        0,
      );
    }

    // Validate probability distribution
    const probs = data.probabilities as Record<string, number>;
    const probValues = Object.values(probs);
    const hasNonFinite = probValues.some((v) => !isFinite(v));
    if (hasNonFinite) {
      throw new ApiError('Invalid probability values returned from server.', 0);
    }

    return data as PredictionResponse;
  },
};
