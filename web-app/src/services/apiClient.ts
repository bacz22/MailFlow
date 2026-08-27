import type { ApiProblemDetails, FieldErrorDetail, RefreshResponse } from '../types/auth.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

let inMemoryAccessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken
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
      return data.accessToken
    } catch {
      setAccessToken(null)
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (inMemoryAccessToken) {
    defaultHeaders['Authorization'] = `Bearer ${inMemoryAccessToken}`
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  // Handle empty body responses (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T
  }

  // Handle 401 Unauthorized with Single-flight Refresh (trừ các endpoint auth)
  if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/register')) {
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
