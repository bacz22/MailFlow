import { apiClient } from './apiClient'
import { mapDailySendQuota, type DailySendQuota } from '../types/quota.types'

export const quotaService = {
  async getDailySend(): Promise<DailySendQuota> {
    const data = await apiClient<Record<string, unknown>>('/quota/daily-send', {
      method: 'GET',
    })
    return mapDailySendQuota(data)
  },
}
