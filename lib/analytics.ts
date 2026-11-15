import { count, gte, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { hookTransactions, indexCoverage, securityAssessments } from "@/lib/db/schema"

export async function recordSecurityAssessment(input: { chainId: number; contractAddress: string; riskScore: number; riskLevel: string; isContract: boolean }) {
  if (!input.isContract) return false
  const contractAddress = input.contractAddress.toLowerCase()
  await db.insert(securityAssessments).values({ ...input, contractAddress }).onConflictDoUpdate({
    target: [securityAssessments.chainId, securityAssessments.contractAddress],
    set: { riskScore: input.riskScore, riskLevel: input.riskLevel, isContract: true, lastAssessedAt: new Date(), assessmentCount: sql`${securityAssessments.assessmentCount} + 1` },
  })
  return true
}

export type MetricStatus = "complete" | "partial" | "indexing" | "unavailable"

export async function getAnalyticsMetrics() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [assessmentRows, transactionRows, coverageRows] = await Promise.all([
    db.select({ value: count() }).from(securityAssessments),
    db.select({ value: count() }).from(hookTransactions).where(gte(hookTransactions.blockTimestamp, since)),
    db.select().from(indexCoverage),
  ])
  const status: MetricStatus = coverageRows.length === 0 ? "indexing" : coverageRows.every((row) => row.status === "complete" && row.chainHeadBlock !== null && row.indexedToBlock >= row.chainHeadBlock) ? "complete" : coverageRows.some((row) => row.status === "partial") ? "partial" : coverageRows.some((row) => row.status === "indexing") ? "indexing" : "unavailable"
  return {
    securityAssessments: { status: "complete" as const, total: assessmentRows[0]?.value ?? 0, detail: "Unique chain + contract pairs assessed" },
    hookTransactions24h: { status, total: status === "complete" || status === "partial" ? transactionRows[0]?.value ?? 0 : null, detail: status === "complete" ? "Verified Hook transactions across complete indexes" : status === "partial" ? "Verified total from partial network coverage" : status === "indexing" ? "Coverage is still indexing; no definitive total yet" : "No reliable transaction coverage is available" },
  }
}
