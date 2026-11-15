import { auth } from "@/lib/auth/server"

export async function requireAdmin() {
  const { data: session } = await auth.getSession()
  const allowed = (process.env.HOOKLABS_ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
  const user = session?.user
  const email = user?.email?.toLowerCase()
  if (!user || !email || !allowed.includes(email)) return null
  return user
}
