import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { requireAdmin } from "@/lib/auth/admin"
import { readConfig, writeConfig } from "@/lib/config-store"

export const dynamic = "force-dynamic"
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return NextResponse.json(await readConfig(), { headers: { "Cache-Control": "no-store" } })
}
export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    const body = await request.json()
    const expectedVersion = request.headers.get("if-match") ?? ""
    const result = await writeConfig(body, expectedVersion)
    if (result.conflict) return NextResponse.json({ error: "Configuration changed", current: result.current }, { status: 409 })
    return NextResponse.json(result.config, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid configuration", issues: error.issues }, { status: 400 })
    return NextResponse.json({ error: "Unable to save configuration" }, { status: 500 })
  }
}
