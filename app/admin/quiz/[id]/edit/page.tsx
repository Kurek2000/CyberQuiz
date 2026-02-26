"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { QuizEditor } from "@/components/quiz/quiz-editor"
import { Loader2 } from "lucide-react"
import type { Quiz } from "@/lib/quiz-types"

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Quiz nie znaleziony")
        return res.json()
      })
      .then((data) => {
        setQuiz(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (error || !quiz) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-destructive">{error || "Quiz nie znaleziony"}</p>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-background">
      <QuizEditor initialQuiz={quiz} />
    </main>
  )
}
