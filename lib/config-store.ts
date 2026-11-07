import { readFile } from "node:fs/promises"
import path from "node:path"
import { defaultConfig, migrateConfig, type SiteConfig } from "@/lib/config"

const configPath = path.join(process.cwd(), "public", "config.json")

export async function readConfig(): Promise<SiteConfig> {
  try {
    return migrateConfig(JSON.parse(await readFile(configPath, "utf8")))
  } catch {
    return defaultConfig
  }
}
