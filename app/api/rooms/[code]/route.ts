import { NextResponse } from "next/server"
import { gameEngine } from "@/lib/game-engine"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const info = gameEngine.getRoomPublicInfo(code)

  if (!info) {
    return NextResponse.json(
      { error: "Pokój nie istnieje" },
      { status: 404 }
    )
  }

  return NextResponse.json(info)
}
