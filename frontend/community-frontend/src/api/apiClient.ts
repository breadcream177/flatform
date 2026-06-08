const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = configuredApiBaseUrl || 'http://localhost:8080';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

async function readResponseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as T;
}

async function readErrorMessage(response: Response, defaultMessage: string) {
  try {
    const result = await readResponseJson<ApiResponse<unknown>>(response);
    return result?.message || `${defaultMessage} 상태 코드: ${response.status}`;
  } catch {
    return `${defaultMessage} 상태 코드: ${response.status}`;
  }
}

function isNetworkError(error: unknown) {
  return error instanceof TypeError;
}

function getNetworkErrorMessage() {
  return '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.';
}

export async function requestApi<T>(
  url: string,
  options: RequestInit | undefined,
  defaultMessage: string
): Promise<T> {
  try {
    const response = await fetch(url, options);
    const result = await readResponseJson<ApiResponse<T>>(response);

    if (!response.ok || !result?.success || result.data === null) {
      throw new Error(result?.message || defaultMessage);
    }

    return result.data;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error(getNetworkErrorMessage());
    }

    throw error;
  }
}

export async function requestApiVoid(
  url: string,
  options: RequestInit | undefined,
  defaultMessage: string
): Promise<void> {
  try {
    const response = await fetch(url, options);
    const result = await readResponseJson<ApiResponse<unknown>>(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || defaultMessage);
    }
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error(getNetworkErrorMessage());
    }

    throw error;
  }
}

export async function requestJson<T>(
  url: string,
  options: RequestInit | undefined,
  defaultMessage: string
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, defaultMessage));
    }

    const data = await readResponseJson<T>(response);

    if (data === null) {
      throw new Error(defaultMessage);
    }

    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error(getNetworkErrorMessage());
    }

    throw error;
  }
}
