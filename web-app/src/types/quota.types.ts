export interface DailySendQuota {
  used: number
  limit: number
  remaining: number
  /** ISO offset datetime when quota resets (next midnight Asia/Ho_Chi_Minh) */
  resetAt: string
}

function formatResetLabel(resetAt: string): string {
  try {
    const d = new Date(resetAt)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    })
  } catch {
    return resetAt
  }
}

export function mapDailySendQuota(raw: Record<string, unknown>): DailySendQuota {
  return {
    used: Number(raw.used ?? 0),
    limit: Number(raw.limit ?? 50),
    remaining: Number(raw.remaining ?? 0),
    resetAt: String(raw.resetAt ?? ''),
  }
}

export { formatResetLabel }
