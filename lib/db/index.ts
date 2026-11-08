import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "@/lib/db/schema"

const globalForDatabase = globalThis as unknown as { hooklabsPool?: Pool }
export const pool = globalForDatabase.hooklabsPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 4 })
if (process.env.NODE_ENV !== "production") globalForDatabase.hooklabsPool = pool
export const db = drizzle(pool, { schema })
