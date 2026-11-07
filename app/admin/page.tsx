import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth/admin"
import { readConfig } from "@/lib/config-store"
import { AdminEditor } from "@/components/admin-editor"
export const dynamic = "force-dynamic"
export default async function AdminPage() { if (!await requireAdmin()) redirect("/auth/sign-in?error=admin-required"); return <AdminEditor config={await readConfig()} /> }
