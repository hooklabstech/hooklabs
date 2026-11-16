import { z } from "zod"

const safeUrl = z.union([z.literal(""), z.string().url().refine((value) => { try { return ["https:", "http:"].includes(new URL(value).protocol) } catch { return false } }, "Use an HTTP(S) URL")])
const assetUrl = z.union([safeUrl, z.string().regex(/^\/[a-zA-Z0-9/_\-.]+$/)])
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color")
const ethereumAddress = z.union([z.literal(""), z.string().regex(/^0x[0-9a-fA-F]{40}$/)])
const milestoneStatus = z.enum(["Completed", "In Progress", "Planned", "Delayed"])

export const hookRecordSchema = z.object({
  name: z.string().min(1).max(100), address: z.string().regex(/^0x[0-9a-fA-F]{40}$/), chainId: z.number().int().positive(), chain: z.string().min(1).max(40), category: z.string().max(80), status: z.enum(["Verified", "Unverified"]), sourceUrl: safeUrl, lastUpdated: z.string().datetime(), rating: z.number().int().min(0).max(100), tvl: z.string(), volume: z.string(), transactions: z.string(),
})

const allocationSchema = z.object({ name: z.string().min(1).max(80), percentage: z.number().min(0).max(100), color: color.optional() })
const tokenomicsSchema = z.object({
  status: z.enum(["proposed", "approved", "published"]).default("proposed"),
  totalSupply: z.string().max(80).default("1,000,000,000 HOOKLB"), circulatingSupply: z.string().max(80).default("Awaiting Launch"), vesting: z.string().max(120).default(""), liquidityStatus: z.string().max(120).default("Activates at Launch"),
  allocations: z.array(allocationSchema).max(20).default([]),
}).superRefine((value, context) => {
  if (value.allocations.length && Math.abs(value.allocations.reduce((sum, item) => sum + item.percentage, 0) - 100) > 0.001) context.addIssue({ code: "custom", path: ["allocations"], message: "Token allocations must total 100%" })
})
const milestoneSchema = z.object({ id: z.string().min(1).max(80), title: z.string().min(1).max(140), description: z.string().max(500).default(""), status: milestoneStatus.default("Planned"), targetDate: z.string().max(40).default(""), weight: z.number().positive().max(100).default(1), visible: z.boolean().default(true) })
const roadmapSchema = z.array(z.object({ id: z.string().min(1).max(60), title: z.string().min(1).max(100), description: z.string().max(500), status: milestoneStatus.default("Planned"), targetDate: z.string().max(40).default(""), visible: z.boolean().default(true), milestones: z.array(milestoneSchema).max(30) })).max(12)
const announcementSchema = z.object({ id: z.string().min(1).max(80), title: z.string().min(1).max(120), message: z.string().min(1).max(2000), publishedAt: z.string().max(40).default(""), category: z.enum(["General", "Development", "Token Launch", "Roadmap", "Community", "Important Update"]).default("General"), priority: z.enum(["Low", "Normal", "High", "Critical"]).default("Normal"), enabled: z.boolean().default(true), url: safeUrl.default(""), imageUrl: assetUrl.default(""), pinned: z.boolean().default(false) })

export const siteConfigSchema = z.object({
  version: z.string(), updatedAt: z.string().datetime(), projectName: z.string().min(1).max(60), ticker: z.string().max(16), contractAddress: ethereumAddress,
  chainId: z.number().int().positive().nullable(), chainName: z.string().max(60), logoUrl: assetUrl, primaryColor: color, secondaryColor: color, defaultTheme: z.enum(["dark", "light", "system"]),
  navigationLabels: z.object({ dashboard: z.string(), hooks: z.string(), scanner: z.string(), submit: z.string(), docs: z.string() }),
  social: z.object({ x: safeUrl, github: safeUrl.default(""), telegram: safeUrl, discord: safeUrl, website: safeUrl }), links: z.object({ buy: safeUrl, chart: safeUrl, explorer: safeUrl, documentation: safeUrl }),
  api: z.object({ defaultChainId: z.number().int().positive(), requestTimeoutMs: z.number().int().min(1000).max(20000) }), features: z.object({ registry: z.boolean(), scanner: z.boolean(), pools: z.boolean(), wallet: z.boolean(), swap: z.boolean(), submissions: z.boolean(), showXButton: z.boolean().default(true), showGithubButton: z.boolean().default(true), hideCommunity: z.boolean().default(false), showBuyButton: z.boolean().default(false) }),
  stats: z.object({ registered: z.string(), chains: z.string(), tx24h: z.string(), scanned: z.string() }), activity: z.array(z.object({ name: z.string(), action: z.string(), time: z.string() })).max(100), hooks: z.array(hookRecordSchema).max(500),
  token: z.object({
    name: z.string().min(1).max(60), ticker: z.string().min(1).max(16), contractAddress: ethereumAddress, network: z.string().min(1).max(60), logoUrl: assetUrl, launchPlatform: z.string().max(80), launchVersion: z.enum(["pending", "v1", "v2"]).default("pending"), launchStatus: z.enum(["pre-launch", "preparing", "live", "paused"]), description: z.string().max(500), chartUrl: safeUrl, hideViewChart: z.boolean().default(true), explorerUrl: safeUrl,
    purchase: z.object({ enabled: z.boolean(), url: safeUrl, label: z.string().min(1).max(80), openInNewTab: z.boolean() }),
    marketData: z.object({ price: z.string().max(80), marketCap: z.string().max(80), liquidity: z.string().max(80) }),
    utilities: z.array(z.object({ name: z.string().min(1).max(200), description: z.string().max(400).default(""), iconUrl: assetUrl })).max(12), tokenomics: tokenomicsSchema,
  }),
  roadmapCurrentPhase: z.number().int().min(1).max(12).default(2), roadmap: roadmapSchema.default([]), announcements: z.array(announcementSchema).max(500).default([]),
  community: z.object({ resources: z.array(z.object({ label: z.string().min(1).max(80), url: safeUrl })).max(30) }).default({ resources: [] }),
})

export type SiteConfig = z.infer<typeof siteConfigSchema>
export type HookRecord = z.infer<typeof hookRecordSchema>

const milestone = (id: string, title: string, status: z.infer<typeof milestoneStatus> = "Planned") => ({ id, title, description: "", status, targetDate: "", weight: 1, visible: true })

export const defaultConfig: SiteConfig = {
  version: "default", updatedAt: new Date(0).toISOString(), projectName: "HOOKLABS", ticker: "HOOKLB", contractAddress: "", chainId: 4663, chainName: "Robinhood Chain", logoUrl: "/images/hooklabs-blue-icon.png", primaryColor: "#16a7ff", secondaryColor: "#2dd4ff", defaultTheme: "dark",
  navigationLabels: { dashboard: "Dashboard", hooks: "Hooks", scanner: "Scanner", submit: "Submit Hook", docs: "API Docs" }, social: { x: "", github: "", telegram: "", discord: "", website: "" }, links: { buy: "", chart: "", explorer: "", documentation: "" },
  api: { defaultChainId: 1, requestTimeoutMs: 8000 }, features: { registry: true, scanner: true, pools: false, wallet: true, swap: false, submissions: true, showXButton: true, showGithubButton: true, hideCommunity: false, showBuyButton: false }, stats: { registered: "0", chains: "5", tx24h: "Unavailable", scanned: "0" }, activity: [], hooks: [],
  token: {
    name: "HookLabs", ticker: "HOOKLB", contractAddress: "", network: "Robinhood Chain", logoUrl: "/images/hooklabs-blue-icon.png", launchPlatform: "Ponsfamily", launchVersion: "pending", launchStatus: "pre-launch", description: "The official pre-launch token for the HOOKLABS hook intelligence ecosystem.", chartUrl: "", hideViewChart: true, explorerUrl: "", purchase: { enabled: false, url: "", label: "Buy $HOOKLB", openInNewTab: true }, marketData: { price: "", marketCap: "", liquidity: "" },
    utilities: [
      { name: "Ecosystem Participation", description: "Proposed participation within the evolving HOOKLABS ecosystem.", iconUrl: "/images/token-utilities/01_Ecosystem.png" },
      { name: "Community Initiatives", description: "Potential community programs and ecosystem campaigns.", iconUrl: "/images/token-utilities/02_Community.png" },
      { name: "Potential Access to Premium Analytics", description: "Future access models remain under research and are not guaranteed.", iconUrl: "/images/token-utilities/03_Analytics.png" },
      { name: "Developer Ecosystem Incentives", description: "Potential incentives for builders and hook developers.", iconUrl: "/images/token-utilities/04_Developer.png" },
      { name: "Future Governance Participation", description: "Governance is exploratory and not yet implemented.", iconUrl: "/images/token-utilities/05_Governance.png" },
    ],
    tokenomics: { status: "proposed", totalSupply: "1,000,000,000 HOOKLB", circulatingSupply: "Awaiting Launch", vesting: "", liquidityStatus: "Activates at Launch", allocations: [] },
  },
  roadmapCurrentPhase: 2,
  roadmap: [
    { id: "foundation", title: "Phase 1 — Platform Foundation", description: "Core HOOKLABS product and infrastructure milestones.", status: "In Progress", targetDate: "", visible: true, milestones: [milestone("foundation-brand", "HOOKLABS branding", "Completed"), milestone("foundation-interface", "Website interface", "Completed"), milestone("foundation-scanner", "Hook scanner integration", "Completed"), milestone("foundation-registry", "Hook registry integration", "Completed"), milestone("foundation-api", "Blockchain API infrastructure", "In Progress"), milestone("foundation-wallet", "Wallet integration", "Completed"), milestone("foundation-community", "Community infrastructure", "In Progress")] },
    { id: "token-launch", title: "Phase 2 — HOOKLB Token Launch", description: "Current focus: preparing HOOKLB for a verified Ponsfamily launch.", status: "In Progress", targetDate: "", visible: true, milestones: [milestone("token-ticker", "Official ticker selection: HOOKLB", "Completed"), milestone("token-tokenomics", "Tokenomics preparation", "In Progress"), milestone("token-pons", "Ponsfamily launch requirements"), milestone("token-contract", "Token contract deployment"), milestone("token-verification", "Contract verification"), milestone("token-announcement", "Official launch announcement"), milestone("token-purchase", "Token purchase link activation"), milestone("token-market", "Market data integration")] },
    { id: "expansion", title: "Phase 3 — Ecosystem Expansion", description: "Planned product, network, and utility research.", status: "Planned", targetDate: "", visible: true, milestones: [milestone("expansion-analytics", "Advanced hook analytics"), milestone("expansion-api", "Expanded developer APIs"), milestone("expansion-networks", "Additional network support"), milestone("expansion-community", "Community engagement tools"), milestone("expansion-utility", "HOOKLB ecosystem utility research")] },
    { id: "long-term", title: "Phase 4 — Community & Long-Term Development", description: "Long-term community and ecosystem planning.", status: "Planned", targetDate: "", visible: true, milestones: [milestone("long-proposals", "Community proposals"), milestone("long-governance", "Governance exploration"), milestone("long-integrations", "Strategic ecosystem integrations"), milestone("long-development", "Long-term HOOKLABS development")] },
  ],
  announcements: [], community: { resources: [] },
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function mergeDefaults(base: unknown, incoming: unknown): unknown {
  if (Array.isArray(incoming)) return incoming
  if (!isRecord(base) || !isRecord(incoming)) return incoming ?? base
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(incoming)) result[key] = key in base ? mergeDefaults(base[key], value) : value
  return result
}

export function migrateConfig(input: unknown): SiteConfig {
  // Normalize optional values edited directly on hosting. A single whitespace-only
  // URL or CA must never invalidate the entire site configuration.
  const clean = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(clean)
    if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]))
    return typeof value === "string" ? value.trim() : value
  }
  const legacy = isRecord(input) ? clean(structuredClone(input)) as Record<string, unknown> : {}
  const token = isRecord(legacy.token) ? legacy.token : {}
  if (token.ticker === "HLAB") token.ticker = "HOOKLB"
  if (legacy.ticker === "HLAB") legacy.ticker = "HOOKLB"
  const status = String(token.launchStatus ?? "").toLowerCase()
  token.launchStatus = status === "live" ? "live" : status === "paused" ? "paused" : "pre-launch"
  const launchVersion = String(token.launchVersion ?? "pending").toLowerCase()
  token.launchVersion = launchVersion === "v1" || launchVersion === "v2" ? launchVersion : "pending"
  if (!isRecord(token.purchase)) token.purchase = { enabled: false, url: typeof token.buyUrl === "string" ? token.buyUrl : "", label: "Buy $HOOKLB", openInNewTab: true }
  const tokenomics = isRecord(token.tokenomics) ? token.tokenomics : {}
  if (Array.isArray(tokenomics.allocations)) tokenomics.allocations = tokenomics.allocations.map((item) => isRecord(item) ? { ...item, name: item.name ?? item.label } : item)
  if (!tokenomics.totalSupply) tokenomics.totalSupply = "1,000,000,000 HOOKLB"
  if (!tokenomics.circulatingSupply) tokenomics.circulatingSupply = "Awaiting Launch"
  if (!tokenomics.liquidityStatus || tokenomics.liquidityStatus === "Pending") tokenomics.liquidityStatus = "Activates at Launch"
  if (Array.isArray(tokenomics.allocations) && tokenomics.allocations.length === 4 && tokenomics.allocations.every((item) => isRecord(item))) tokenomics.allocations = []
  token.tokenomics = tokenomics
  if (Array.isArray(token.utilities)) token.utilities = token.utilities.map((item, index) => typeof item === "string" ? { name: item, description: "", iconUrl: defaultConfig.token.utilities[index]?.iconUrl ?? "/images/hooklab-logo.png" } : item)
  // Support both the root-level and token-specific CA/link fields without
  // forcing users to keep duplicate values in sync.
  if (!token.contractAddress && typeof legacy.contractAddress === "string") token.contractAddress = legacy.contractAddress
  if (!legacy.contractAddress && typeof token.contractAddress === "string") legacy.contractAddress = token.contractAddress
  const links = isRecord(legacy.links) ? legacy.links : {}
  const purchase = isRecord(token.purchase) ? token.purchase : {}
  if (!purchase.url && typeof links.buy === "string") purchase.url = links.buy
  if (!token.chartUrl && typeof links.chart === "string") token.chartUrl = links.chart
  if (!token.explorerUrl && typeof links.explorer === "string") token.explorerUrl = links.explorer
  token.purchase = purchase
  legacy.token = token
  if (!Array.isArray(legacy.announcements)) {
    const community = isRecord(legacy.community) ? legacy.community : {}
    legacy.announcements = Array.isArray(community.announcements) ? community.announcements.map((item, index) => isRecord(item) ? { id: `legacy-${index + 1}`, title: item.title, message: item.message ?? item.body, publishedAt: item.publishedAt ?? "", category: "General", priority: "Normal", enabled: true, url: "", imageUrl: "", pinned: false } : item) : []
  }
  if (Array.isArray(legacy.roadmap)) legacy.roadmap = legacy.roadmap.map((phase) => isRecord(phase) ? { ...phase, visible: phase.visible ?? true, milestones: Array.isArray(phase.milestones) ? phase.milestones.map((item) => isRecord(item) ? { ...item, weight: item.weight ?? 1, visible: item.visible ?? true } : item) : [] } : phase)
  return siteConfigSchema.parse(mergeDefaults(defaultConfig, legacy))
}
