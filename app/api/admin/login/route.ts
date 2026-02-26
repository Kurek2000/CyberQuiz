import { NextResponse } from "next/server"

const ADMIN_CODE = process.env.ADMIN_CODE || "Glynka"

export async function POST(req: Request) {
  const { code } = await req.json()
  if (code !== ADMIN_CODE) return new NextResponse("Unauthorized", { status: 401 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set("admin-auth", "true", { httpOnly: true, path: "/" })
  return res
}
