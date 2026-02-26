import { NextResponse } from "next/server"
import { gameEngine } from "@/lib/game-engine"
import { quizInputSchema } from "@/lib/validations"

export async function GET() {
  const quizzes = gameEngine.listQuizzes()

  // Zwracamy listę bez pytań (optymalizacja)
  const summaries = quizzes.map((q) => ({
    id: q.id,
    name: q.name,
    description: q.description,
    questionCount: q.questions.length,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  }))

  return NextResponse.json(summaries)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = quizInputSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const quiz = gameEngine.createQuiz(parsed.data)

    return NextResponse.json(quiz, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowe dane wejściowe" },
      { status: 400 }
    )
  }
}
