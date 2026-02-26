"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QuestionForm, type QuestionFormData } from "./question-form"
import { Plus, Save, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Quiz } from "@/lib/quiz-types"

interface QuizEditorProps {
  /** Istniejący quiz do edycji (null = nowy quiz) */
  initialQuiz?: Quiz | null
}

function createEmptyQuestion(): QuestionFormData {
  return {
    text: "",
    answers: ["", "", "", ""],
    correctIndex: 0,
    points: 1,
    timeLimit: 30,
  }
}

export function QuizEditor({ initialQuiz = null }: QuizEditorProps) {
  const router = useRouter()
  const isEdit = !!initialQuiz

  const [name, setName] = useState(initialQuiz?.name ?? "")
  const [description, setDescription] = useState(
    initialQuiz?.description ?? ""
  )
  const [questions, setQuestions] = useState<QuestionFormData[]>(
    initialQuiz
      ? initialQuiz.questions.map((q) => ({
          text: q.text,
          answers: q.answers,
          correctIndex: q.correctIndex,
          points: q.points,
          timeLimit: q.timeLimit,
        }))
      : [createEmptyQuestion()]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const addQuestion = useCallback(() => {
    setQuestions((prev) => [...prev, createEmptyQuestion()])
  }, [])

  const removeQuestion = useCallback((index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateQuestion = useCallback(
    (index: number, data: QuestionFormData) => {
      setQuestions((prev) => prev.map((q, i) => (i === index ? data : q)))
    },
    []
  )

  const validate = (): string | null => {
    if (name.trim().length < 2)
      return "Nazwa quizu musi mieć min. 2 znaki"
    if (questions.length === 0) return "Dodaj przynajmniej 1 pytanie"

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (q.text.trim().length < 3) {
        return `Pytanie ${i + 1}: treść musi mieć min. 3 znaki`
      }
      for (let j = 0; j < 4; j++) {
        if (q.answers[j].trim().length === 0) {
          return `Pytanie ${i + 1}: odpowiedź ${["A", "B", "C", "D"][j]} nie może być pusta`
        }
      }
    }

    return null
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError("")

    const body = {
      name: name.trim(),
      description: description.trim(),
      questions: questions.map((q) => ({
        text: q.text.trim(),
        answers: q.answers.map((a) => a.trim()) as [
          string,
          string,
          string,
          string,
        ],
        correctIndex: q.correctIndex,
        points: q.points,
        timeLimit: q.timeLimit,
      })),
    }

    try {
      const url = isEdit
        ? `/api/quizzes/${initialQuiz!.id}`
        : "/api/quizzes"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Błąd zapisu")
        setSaving(false)
        return
      }

      router.push("/admin")
    } catch {
      setError("Błąd połączenia z serwerem")
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
          <span className="sr-only">Powrót</span>
        </Link>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edytuj quiz" : "Nowy quiz"}
        </h1>
      </div>

      {/* Quiz metadata */}
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quiz-name">Nazwa quizu</Label>
          <Input
            id="quiz-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError("")
            }}
            placeholder="np. Cyberbezpieczeństwo - Poziom 1"
            className="text-lg"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quiz-desc">Opis (opcjonalny)</Label>
          <Input
            id="quiz-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Krótki opis quizu..."
          />
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Pytania ({questions.length})
          </h2>
          <Button type="button" variant="outline" onClick={addQuestion}>
            <Plus className="size-4" />
            Dodaj pytanie
          </Button>
        </div>

        {questions.map((q, i) => (
          <QuestionForm
            key={i}
            index={i}
            data={q}
            onChange={(data) => updateQuestion(i, data)}
            onRemove={() => removeQuestion(i)}
            canRemove={questions.length > 1}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addQuestion}
          className="border-dashed"
        >
          <Plus className="size-4" />
          Dodaj kolejne pytanie
        </Button>
      </div>

      {/* Error + Save */}
      {error && (
        <p className="text-destructive text-sm text-center">{error}</p>
      )}

      <div className="flex items-center gap-3 justify-end sticky bottom-4 bg-background/80 backdrop-blur-sm py-3 -mx-4 px-4 border-t">
        <Link href="/admin">
          <Button variant="outline">Anuluj</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? "Zapisywanie..." : isEdit ? "Zapisz zmiany" : "Utwórz quiz"}
        </Button>
      </div>
    </div>
  )
}
