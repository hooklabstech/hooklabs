"use server"
import { auth } from "@/lib/auth/server"
import { redirect } from "next/navigation"
export async function signIn(_: {error:string}|null, formData:FormData){const {error}=await auth.signIn.email({email:String(formData.get("email")),password:String(formData.get("password"))});if(error)return {error:"Sign-in failed. Check your credentials."};redirect("/admin")}
