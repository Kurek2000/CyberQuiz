import { NextResponse } from "next/server"
import { gameEngine } from "@/lib/game-engine"
import { submitAnswerSchema } from "@/lib/validations"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    const body = await request.json()
    const parsed = submitAnswerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = gameEngine.submitAnswer(
      code,
      parsed.data.participantId,
      parsed.data.answerIndex
    )

    if (!result.accepted) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowe dane wejściowe" },
      { status: 400 }
    )
  }
}
