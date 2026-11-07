import { NextResponse } from "next/server"
import { Pool } from "pg"
import { z } from "zod"
import { auth } from "@/lib/auth/server"
import { inspectAddress } from "@/lib/blockchain"

const chains = { Ethereum: 1, Base: 8453, Arbitrum: 42161, Unichain: 130 } as const
const schema = z.object({ projectName: z.string().trim().min(2).max(80), contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/), chain: z.enum(["Ethereum", "Base", "Arbitrum", "Unichain"]), website: z.union([z.literal(""), z.string().url()]) })

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return NextResponse.json({ error: "Sign in before submitting a hook" }, { status: 401 })
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission", issues: parsed.error.issues }, { status: 400 })
  let inspection
  try { inspection = await inspectAddress(parsed.data.contractAddress, chains[parsed.data.chain]) }
  catch { return NextResponse.json({ error: "The selected network could not verify this address" }, { status: 502 }) }
  if (!inspection.isContract) return NextResponse.json({ error: "No deployed contract bytecode was found at this address" }, { status: 422 })
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const duplicate = await pool.query("SELECT id FROM public.hook_submissions WHERE lower(contract_address) = lower($1) AND chain = $2 LIMIT 1", [parsed.data.contractAddress, parsed.data.chain])
    if (duplicate.rowCount) return NextResponse.json({ error: "This contract has already been submitted on the selected network" }, { status: 409 })
    const result = await pool.query("INSERT INTO public.hook_submissions (user_id, contract_address, chain, project_name, website) VALUES ($1,$2,$3,$4,$5) RETURNING id, status, created_at", [session.user.id, parsed.data.contractAddress, parsed.data.chain, parsed.data.projectName, parsed.data.website || null])
    return NextResponse.json({ submission: result.rows[0], inspection: { chainId: inspection.chainId, hookFlags: inspection.hookFlags, permissions: inspection.permissions.filter((permission) => permission.enabled) } }, { status: 201 })
  } finally { await pool.end() }
}
