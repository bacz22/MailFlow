import type { ApiProblemDetails, FieldErrorDetail, RefreshResponse } from '../types/auth.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

let inMemoryAccessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null
let afterRefresh: (() => Promise<void>) | null = null

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

export function setAfterTokenRefresh(handler: (() => Promise<void>) | null) {
  afterRefresh = handler
}

export class ApiError extends Error {
  status: number
  code: string
  title: string
  detail: string
  errors?: FieldErrorDetail[]

  constructor(problem: ApiProblemDetails) {
    super(problem.detail || problem.title || 'Đã xảy ra lỗi không xác định')
    this.name = 'ApiError'
    this.status = problem.status
    this.code = problem.code
    this.title = problem.title
    this.detail = problem.detail
    this.errors = problem.errors
  }
}

async function performTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        setAccessToken(null)
        return null
      }

      const data = (await response.json()) as RefreshResponse
      setAccessToken(data.accessToken)
      if (afterRefresh) {
        await afterRefresh()
      }
      return inMemoryAccessToken
    } catch {
      setAccessToken(null)
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

type ApiClientOptions = RequestInit & { skipRefresh?: boolean }

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {},
  isRetry = false
): Promise<T> {
  const { skipRefresh, ...fetchOptions } = options
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
  }

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  if (inMemoryAccessToken) {
    defaultHeaders['Authorization'] = `Bearer ${inMemoryAccessToken}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
  })

  // Handle empty body responses (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T
  }

  const isPublicAuthEndpoint = [
    '/auth/login',
    '/auth/refresh',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/resend-verification',
  ].some((path) => endpoint.includes(path))

  if (response.status === 401 && !isRetry && !isPublicAuthEndpoint && !skipRefresh) {
    const newAccessToken = await performTokenRefresh()
    if (newAccessToken) {
      return apiClient<T>(endpoint, options, true)
    }
  }

  let data: any
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    if (data && typeof data === 'object' && 'code' in data) {
      throw new ApiError(data as ApiProblemDetails)
    }

    throw new ApiError({
      type: 'https://mailflow.dev/problems/http-error',
      title: response.statusText || 'Lỗi HTTP',
      status: response.status,
      code: `HTTP_${response.status}`,
      detail: `Yêu cầu thất bại với mã lỗi HTTP ${response.status}`,
    })
  }

  return data as T
}

/** Download binary (xlsx) with same auth + refresh behavior as apiClient. */
export async function apiDownloadBlob(
  endpoint: string,
  fallbackFilename: string,
  options: ApiClientOptions = {},
  isRetry = false
): Promise<void> {
  const { skipRefresh, ...fetchOptions } = options
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers: Record<string, string> = {
    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream',
  }
  if (inMemoryAccessToken) {
    headers.Authorization = `Bearer ${inMemoryAccessToken}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    method: fetchOptions.method || 'GET',
    credentials: 'include',
    headers: {
      ...headers,
      ...(fetchOptions.headers as Record<string, string> | undefined),
    },
  })

  if (response.status === 401 && !isRetry && !skipRefresh) {
    const newAccessToken = await performTokenRefresh()
    if (newAccessToken) {
      return apiDownloadBlob(endpoint, fallbackFilename, options, true)
    }
  }

  if (!response.ok) {
    let detail = `Yêu cầu thất bại với mã lỗi HTTP ${response.status}`
    try {
      const problem = (await response.json()) as ApiProblemDetails
      if (problem?.detail) detail = problem.detail
      throw new ApiError(problem)
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError({
        type: 'https://mailflow.dev/problems/http-error',
        title: response.statusText || 'Lỗi HTTP',
        status: response.status,
        code: `HTTP_${response.status}`,
        detail,
      })
    }
  }

  const blob = await response.blob()
  let filename = fallbackFilename
  const disposition = response.headers.get('Content-Disposition')
  if (disposition) {
    const match = /filename="?([^";]+)"?/i.exec(disposition)
    if (match?.[1]) filename = match[1]
  }

  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}
