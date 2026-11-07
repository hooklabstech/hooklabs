"use client"

import { usePublicConfig } from "@/lib/public-config-client"

export function RuntimeBranding() {
  const { data } = usePublicConfig()
  if (!data) return null
  return <style>{`:root{--primary:${data.primaryColor};--ring:${data.primaryColor};--chart-1:${data.primaryColor};--chart-2:${data.secondaryColor}}`}</style>
}
