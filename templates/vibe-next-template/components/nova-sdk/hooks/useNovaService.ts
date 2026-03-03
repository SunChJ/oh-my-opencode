"use client"

import { useMemo } from 'react'
import { HTTPClient } from '@/http'
import type { PlatformConfig } from '../types'

interface UseNovaServiceProps {
  platformConfig?: PlatformConfig
}

export function useNovaService({ platformConfig }: UseNovaServiceProps) {
  return useMemo(() => {
    if (!platformConfig?.apiBaseUrl) {
      throw new Error('API base URL is required in platformConfig')
    }

    return new HTTPClient({
      baseURL: platformConfig.apiBaseUrl,
    })
  }, [platformConfig])
}
