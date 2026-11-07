"use client"

import useSWR from "swr"
import type { SiteConfig } from "@/lib/config"

const fetcher = (url: string) => fetch(url).then((response) => response.json())
export function RuntimeBranding() {
  const { data } = useSWR<SiteConfig>("/api/public-config", fetcher, { refreshInterval: 30000 })
  if (!data) return null
  return <style>{`:root{--primary:${data.primaryColor};--ring:${data.primaryColor};--chart-1:${data.primaryColor};--chart-2:${data.secondaryColor}}`}</style>
}
