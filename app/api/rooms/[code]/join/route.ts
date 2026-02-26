import { NextResponse } from "next/server"
import { gameEngine } from "@/lib/game-engine"
import { joinRoomSchema } from "@/lib/validations"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    const body = await request.json()
    const parsed = joinRoomSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = gameEngine.joinRoom(code, parsed.data.name)

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowe dane wejściowe" },
      { status: 400 }
    )
  }
}
