import { NextResponse } from "next/server"
import { gameEngine } from "@/lib/game-engine"
import { createRoomSchema } from "@/lib/validations"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createRoomSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = gameEngine.createRoom(parsed.data.quizId)
    if (!result) {
      return NextResponse.json(
        { error: "Quiz nie znaleziony lub nie ma pytań" },
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

export async function GET() {
  const rooms = gameEngine.listActiveRooms()
  return NextResponse.json(rooms)
}
