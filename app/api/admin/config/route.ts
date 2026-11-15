import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin"
import { readConfig } from "@/lib/config-store"

export const dynamic = "force-dynamic"
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return NextResponse.json(await readConfig(), { headers: { "Cache-Control": "no-store" } })
}
export async function PATCH() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return NextResponse.json({ error: "Public configuration is source-managed in public/config.json and requires a deployment." }, { status: 405, headers: { Allow: "GET" } })
}
