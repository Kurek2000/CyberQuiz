import { NextResponse } from "next/server"
import { gameEngine } from "@/lib/game-engine"
import { adminActionSchema } from "@/lib/validations"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    const body = await request.json()
    const parsed = adminActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Walidacja adminSecret
    if (!gameEngine.validateAdminSecret(code, parsed.data.adminSecret)) {
      return NextResponse.json(
        { error: "Brak uprawnień administratora" },
        { status: 403 }
      )
    }

    let result: { error?: string }

    switch (parsed.data.action) {
      case "start":
        result = gameEngine.startQuiz(code)
        break
      case "next":
        result = gameEngine.nextQuestion(code)
        break
      case "skip":
        result = gameEngine.skipWaiting(code)
        break
      case "leaderboard":
        result = gameEngine.showLeaderboard(code)
        break
      default:
        return NextResponse.json(
          { error: "Nieznana akcja" },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowe dane wejściowe" },
      { status: 400 }
    )
  }
}
