import { bigint, boolean, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

export const securityAssessments = pgTable("hooklabs_security_assessments", {
  chainId: integer("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  riskScore: integer("risk_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  isContract: boolean("is_contract").notNull(),
  assessedAt: timestamp("assessed_at", { withTimezone: true }).notNull().defaultNow(),
  lastAssessedAt: timestamp("last_assessed_at", { withTimezone: true }).notNull().defaultNow(),
  assessmentCount: bigint("assessment_count", { mode: "number" }).notNull().default(1),
}, (table) => [primaryKey({ columns: [table.chainId, table.contractAddress] })])

export const hookTransactions = pgTable("hooklabs_hook_transactions", {
  chainId: integer("chain_id").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  blockNumber: bigint("block_number", { mode: "number" }).notNull(),
  hookAddress: text("hook_address").notNull(),
  poolId: text("pool_id").notNull(),
  blockTimestamp: timestamp("block_timestamp", { withTimezone: true }).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.chainId, table.transactionHash, table.hookAddress, table.poolId] })])

export const indexCoverage = pgTable("hooklabs_index_coverage", {
  chainId: integer("chain_id").primaryKey(),
  indexedFromBlock: bigint("indexed_from_block", { mode: "number" }).notNull(),
  indexedToBlock: bigint("indexed_to_block", { mode: "number" }).notNull(),
  chainHeadBlock: bigint("chain_head_block", { mode: "number" }),
  status: text("status").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
