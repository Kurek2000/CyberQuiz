"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Play,
  Pencil,
  Trash2,
  ArrowLeft,
  Users,
  Monitor,
  HelpCircle,
} from "lucide-react"
import type { RoomPublicInfo } from "@/lib/quiz-types"

interface QuizSummary {
  id: string
  name: string
  description: string
  questionCount: number
  createdAt: number
  updatedAt: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: quizzes, mutate: mutateQuizzes } = useSWR<QuizSummary[]>(
    "/api/quizzes",
    fetcher,
    { refreshInterval: 5000 }
  )
  const { data: activeRooms } = useSWR<RoomPublicInfo[]>(
    "/api/rooms",
    fetcher,
    { refreshInterval: 3000 }
  )

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [launchingId, setLaunchingId] = useState<string | null>(null)

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Czy na pewno chcesz usunąć ten quiz?")) return
      setDeletingId(id)

      try {
        const res = await fetch(`/api/quizzes/${id}`, { method: "DELETE" })
        if (res.ok) {
          mutateQuizzes()
        } else {
          const data = await res.json()
          alert(data.error || "Nie udało się usunąć quizu")
        }
      } catch {
        alert("Błąd połączenia z serwerem")
      } finally {
        setDeletingId(null)
      }
    },
    [mutateQuizzes]
  )

  const handleLaunch = useCallback(
    async (quizId: string) => {
      setLaunchingId(quizId)

      try {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId }),
        })

        if (!res.ok) {
          const data = await res.json()
          alert(data.error || "Nie udało się utworzyć pokoju")
          return
        }

        const { code, adminSecret } = await res.json()
        // Zapisz adminSecret w sessionStorage
        sessionStorage.setItem(
          `admin-room-${code}`,
          JSON.stringify({ adminSecret, code })
        )
        router.push(`/admin/room/${code}`)
      } catch {
        alert("Błąd połączenia z serwerem")
      } finally {
        setLaunchingId(null)
      }
    },
    [router]
  )

  const PHASE_LABELS: Record<string, string> = {
    lobby: "Lobby",
    question: "Pytanie",
    reveal: "Wyniki",
    leaderboard: "Ranking",
    finished: "Zakończony",
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-5" />
              <span className="sr-only">Powrót</span>
            </Link>
            <h1 className="text-2xl font-bold">Panel administratora</h1>
          </div>
          <Link href="/admin/quiz/new">
            <Button>
              <Plus className="size-4" />
              Nowy quiz
            </Button>
          </Link>
        </div>

        {/* Active rooms */}
        {activeRooms && activeRooms.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Monitor className="size-5" />
              Aktywne pokoje
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {activeRooms.map((room) => (
                <Card key={room.code} className="py-4">
                  <CardContent className="flex items-center gap-4">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">
                          {room.code}
                        </span>
                        <Badge variant="secondary">
                          {PHASE_LABELS[room.phase] ?? room.phase}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground truncate">
                        {room.quizName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-4" />
                      <span className="font-mono text-sm">
                        {room.participantCount}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Sprawdź czy mamy adminSecret
                        const stored = sessionStorage.getItem(
                          `admin-room-${room.code}`
                        )
                        if (stored) {
                          router.push(`/admin/room/${room.code}`)
                        } else {
                          alert("Brak uprawnień do tego pokoju")
                        }
                      }}
                    >
                      Otwórz
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Quizzes list */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HelpCircle className="size-5" />
            Quizy ({quizzes?.length ?? 0})
          </h2>

          {!quizzes ? (
            <p className="text-muted-foreground text-sm">Ładowanie...</p>
          ) : quizzes.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-muted-foreground">
                <p>Brak quizów. Utwórz pierwszy quiz!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {quiz.name}
                      <Badge variant="outline" className="font-mono text-xs">
                        {quiz.questionCount} pyt.
                      </Badge>
                    </CardTitle>
                    {quiz.description && (
                      <CardDescription className="line-clamp-2">
                        {quiz.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter className="gap-2 flex-wrap">
                    <Button
                      onClick={() => handleLaunch(quiz.id)}
                      disabled={launchingId === quiz.id}
                    >
                      <Play className="size-4" />
                      {launchingId === quiz.id
                        ? "Tworzenie..."
                        : "Uruchom quiz"}
                    </Button>
                    <Link href={`/admin/quiz/${quiz.id}/edit`}>
                      <Button variant="outline">
                        <Pencil className="size-4" />
                        Edytuj
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(quiz.id)}
                      disabled={deletingId === quiz.id}
                    >
                      <Trash2 className="size-4" />
                      {deletingId === quiz.id ? "Usuwanie..." : "Usuń"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
