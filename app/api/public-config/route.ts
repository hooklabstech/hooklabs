import { NextResponse } from "next/server"
import { readConfig } from "@/lib/config-store"

export const dynamic = "force-dynamic"
export async function GET() {
  return NextResponse.json(await readConfig(), { headers: { "Cache-Control": "no-store, max-age=0" } })
}
