"use client"

import useSWR from "swr"
import { defaultConfig, migrateConfig, type SiteConfig } from "@/lib/config"

async function fetchPublicConfig(): Promise<SiteConfig> {
  const response = await fetch(`/config.json?live=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } })
  if (!response.ok) throw new Error("Unable to load public configuration")
  return migrateConfig(await response.json())
}

export function usePublicConfig(enabled = true) {
  return useSWR<SiteConfig>(enabled ? "/config.json" : null, fetchPublicConfig, {
    fallbackData: enabled ? defaultConfig : undefined,
    keepPreviousData: true,
    refreshInterval: 5000,
    refreshWhenHidden: true,
    revalidateOnFocus: true,
  })
}
