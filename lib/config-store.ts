import { list, put } from "@vercel/blob"
import { defaultConfig, migrateConfig, siteConfigSchema, type SiteConfig } from "@/lib/config"

const prefix = "hooklabs/config/versions/"

export async function readConfig(): Promise<SiteConfig> {
  try {
    const { blobs } = await list({ prefix, limit: 100 })
    const latest = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0]
    if (!latest) return defaultConfig
    const response = await fetch(latest.url, { cache: "no-store", signal: AbortSignal.timeout(5000) })
    return migrateConfig(await response.json())
  } catch {
    return defaultConfig
  }
}

export async function writeConfig(input: unknown, expectedVersion: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is not configured")
  const current = await readConfig()
  if (current.version !== expectedVersion) return { conflict: true as const, current }
  const now = new Date()
  const version = `${now.getTime()}`
  const config = siteConfigSchema.parse({ ...(input as object), version, updatedAt: now.toISOString() })
  await put(`${prefix}${version}.json`, JSON.stringify(config, null, 2), { access: "public", addRandomSuffix: false, contentType: "application/json" })
  return { conflict: false as const, config }
}
