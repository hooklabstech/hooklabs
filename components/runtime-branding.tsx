"use client"

import { usePublicConfig } from "@/lib/public-config-client"

export function RuntimeBranding() {
  const { data } = usePublicConfig()
  if (!data) return null
  return <style>{`:root{--runtime-brand-primary:${data.primaryColor};--runtime-brand-secondary:${data.secondaryColor}}`}</style>
}
