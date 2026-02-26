import { NextResponse } from "next/server"
import { gameEngine } from "@/lib/game-engine"
import { quizInputSchema } from "@/lib/validations"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const quiz = gameEngine.getQuiz(id)

  if (!quiz) {
    return NextResponse.json({ error: "Quiz nie znaleziony" }, { status: 404 })
  }

  return NextResponse.json(quiz)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const parsed = quizInputSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const quiz = gameEngine.updateQuiz(id, parsed.data)
    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz nie znaleziony" },
        { status: 404 }
      )
    }

    return NextResponse.json(quiz)
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowe dane wejściowe" },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const deleted = gameEngine.deleteQuiz(id)

  if (!deleted) {
    return NextResponse.json(
      {
        error:
          "Nie można usunąć quizu (nie istnieje lub jest używany w aktywnym pokoju)",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true })
}
