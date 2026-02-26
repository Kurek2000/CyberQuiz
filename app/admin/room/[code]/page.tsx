"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSSE } from "@/hooks/use-sse"
import { QuizTimer } from "@/components/quiz/quiz-timer"
import { AnswerButton } from "@/components/quiz/answer-button"
import { AnswerStats } from "@/components/quiz/answer-stats"
import { Leaderboard } from "@/components/quiz/leaderboard"
import { RoomCodeDisplay } from "@/components/quiz/room-code-display"
import { ParticipantsList } from "@/components/quiz/participants-list"
import { QuestionDisplay } from "@/components/quiz/question-display"
import { Button } from "@/components/ui/button"
import {
  Play,
  SkipForward,
  Trophy,
  ChevronRight,
  Wifi,
  WifiOff,
  Users,
  Loader2,
} from "lucide-react"
import type {
  RoomPhase,
  SSEEvent,
  PublicParticipant,
  PublicQuestionAdmin,
  RevealResultAdmin,
  LeaderboardEntry,
  AnswerIndex,
} from "@/lib/quiz-types"

interface AdminSession {
  adminSecret: string
  code: string
}

// ============================================================
// Phase Components (Admin/Projector view - dark theme)
// ============================================================

function AdminLobbyPhase({
  code,
  participants,
  quizName,
  onStart,
  starting,
}: {
  code: string
  participants: PublicParticipant[]
  quizName: string
  onStart: () => void
  starting: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto animate-in fade-in duration-500">
      <RoomCodeDisplay code={code} size="lg" />

      <div className="text-center">
        <p className="text-lg text-slate-400">{quizName}</p>
      </div>

      <ParticipantsList participants={participants} className="w-full" />

      <Button
        size="lg"
        onClick={onStart}
        disabled={participants.length === 0 || starting}
        className="h-14 px-10 text-lg font-bold"
      >
        <Play className="size-5" />
        {starting ? "Uruchamianie..." : "Rozpocznij quiz"}
      </Button>
    </div>
  )
}

function AdminQuestionPhase({
  question,
  onSkip,
}: {
  question: PublicQuestionAdmin
  onSkip: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Question text */}
      <QuestionDisplay
        text={question.text}
        index={question.index}
        totalQuestions={question.totalQuestions}
      />

      {/* Timer */}
      <QuizTimer
        endsAt={question.questionEndsAt}
        variant="circle"
        size="lg"
      />

      {/* 4 answer buttons (2x2 grid) */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {([0, 1, 2, 3] as const).map((i) => (
          <AnswerButton
            key={i}
            index={i}
            text={question.answers[i]}
            variant="admin"
            disabled
          />
        ))}
      </div>

      {/* Answer count + skip */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-slate-400">
          <Users className="size-4" />
          <span className="font-mono text-sm">
            {question.answeredCount} / {question.totalParticipants} odpowiedzi
          </span>
        </div>
        <Button variant="outline" onClick={onSkip}>
          <SkipForward className="size-4" />
          Zakończ pytanie
        </Button>
      </div>
    </div>
  )
}

function AdminRevealPhase({
  reveal,
  onShowLeaderboard,
}: {
  reveal: RevealResultAdmin
  onShowLeaderboard: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      {/* Question + correct answer highlight */}
      <h2 className="text-xl md:text-2xl font-bold text-center text-balance">
        {reveal.questionText}
      </h2>

      {/* Answer grid with reveal */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {([0, 1, 2, 3] as const).map((i) => (
          <AnswerButton
            key={i}
            index={i}
            text={reveal.answers[i]}
            variant="admin"
            isCorrect={i === reveal.correctIndex}
            isWrong={i !== reveal.correctIndex}
            answerCount={reveal.answerDistribution[i]}
            disabled
          />
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-slate-400 text-sm">
        <span>
          Poprawne: {reveal.correctCount} / {reveal.totalAnswered}
        </span>
        <span>
          Odpowiedziało: {reveal.totalAnswered} / {reveal.totalParticipants}
        </span>
        <span>Punkty: {reveal.points}x</span>
      </div>

      {/* Answer distribution chart */}
      <AnswerStats
        answers={reveal.answers}
        distribution={reveal.answerDistribution}
        correctIndex={reveal.correctIndex}
        totalAnswered={reveal.totalAnswered}
        className="w-full max-w-lg"
      />

      <Button size="lg" onClick={onShowLeaderboard} className="h-12 px-8">
        <Trophy className="size-5" />
        Pokaż ranking
      </Button>
    </div>
  )
}

function AdminLeaderboardPhase({
  entries,
  isLast,
  onNext,
}: {
  entries: LeaderboardEntry[]
  isLast: boolean
  onNext: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Leaderboard entries={entries} limit={10} />

      <Button size="lg" onClick={onNext} className="h-12 px-8">
        <ChevronRight className="size-5" />
        {isLast ? "Zakończ quiz" : "Następne pytanie"}
      </Button>
    </div>
  )
}

function AdminFinishedPhase({
  entries,
  quizName,
}: {
  entries: LeaderboardEntry[]
  quizName: string
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto animate-in fade-in duration-500">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-3xl font-black">Quiz zakończony!</h2>
        <p className="text-slate-400">{quizName}</p>
      </div>

      {entries.length > 0 && (
        <div className="text-center flex flex-col gap-1">
          <span className="text-sm text-slate-400 uppercase tracking-wider">
            Zwycięzca
          </span>
          <span className="text-4xl font-black text-amber-400">
            {entries[0].name}
          </span>
          <span className="text-lg font-mono text-slate-300">
            {entries[0].score} pkt
          </span>
        </div>
      )}

      <Leaderboard entries={entries} limit={20} />
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function AdminRoomPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [phase, setPhase] = useState<RoomPhase>("lobby")
  const [quizName, setQuizName] = useState("")
  const [participants, setParticipants] = useState<PublicParticipant[]>([])
  const [question, setQuestion] = useState<PublicQuestionAdmin | null>(null)
  const [reveal, setReveal] = useState<RevealResultAdmin | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLastQuestion, setIsLastQuestion] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Odczytaj adminSecret
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`admin-room-${code}`)
      if (stored) {
        const parsed: AdminSession = JSON.parse(stored)
        if (parsed.adminSecret && parsed.code === code) {
          setSession(parsed)
          return
        }
      }
    } catch {
      // ignore
    }
    router.push("/admin")
  }, [code, router])

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case "room-state": {
        const data = event.data as {
          phase: RoomPhase
          quizName: string
          participants: PublicParticipant[]
          question?: PublicQuestionAdmin
          leaderboard?: LeaderboardEntry[]
        }
        setPhase(data.phase)
        setQuizName(data.quizName)
        setParticipants(data.participants)
        if (data.question) setQuestion(data.question)
        if (data.leaderboard) setLeaderboard(data.leaderboard)
        break
      }

      case "participant-joined": {
        const data = event.data as {
          participants: PublicParticipant[]
          participantCount: number
        }
        setParticipants(data.participants)
        break
      }

      case "question-start": {
        const q = event.data as PublicQuestionAdmin
        setPhase("question")
        setQuestion(q)
        setReveal(null)
        break
      }

      case "answer-count": {
        const data = event.data as {
          answeredCount: number
          totalParticipants: number
        }
        setQuestion((prev) =>
          prev
            ? {
                ...prev,
                answeredCount: data.answeredCount,
                totalParticipants: data.totalParticipants,
              }
            : prev
        )
        break
      }

      case "reveal": {
        const r = event.data as RevealResultAdmin
        setPhase("reveal")
        setReveal(r)
        break
      }

      case "leaderboard": {
        const data = event.data as {
          leaderboard: LeaderboardEntry[]
          isLast: boolean
        }
        setPhase("leaderboard")
        setLeaderboard(data.leaderboard)
        setIsLastQuestion(data.isLast)
        break
      }

      case "game-finished": {
        const data = event.data as {
          leaderboard: LeaderboardEntry[]
          quizName: string
        }
        setPhase("finished")
        setLeaderboard(data.leaderboard)
        setQuizName(data.quizName)
        break
      }
    }
  }, [])

  const sseUrl = session
    ? `/api/rooms/${code}/events?adminSecret=${session.adminSecret}`
    : null

  const { connected } = useSSE({
    url: sseUrl,
    onEvent: handleSSEEvent,
    enabled: !!session,
  })

  const sendAction = useCallback(
    async (action: string) => {
      if (!session) return
      setActionLoading(true)

      try {
        await fetch(`/api/rooms/${code}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            adminSecret: session.adminSecret,
          }),
        })
      } catch {
        // Retry once
        try {
          await fetch(`/api/rooms/${code}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action,
              adminSecret: session.adminSecret,
            }),
          })
        } catch {
          // ignore
        }
      } finally {
        setActionLoading(false)
      }
    },
    [code, session]
  )

  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-white flex flex-col">
      {/* Header bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-sm text-slate-400">
            Pokój: {code}
          </span>
          <span className="text-xs text-slate-500 hidden md:inline">
            {quizName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-slate-400" />
            <span className="text-xs font-mono text-slate-400">
              {participants.length}
            </span>
          </div>
          {connected ? (
            <Wifi className="size-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="size-3.5 text-red-500" />
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        {phase === "lobby" && (
          <AdminLobbyPhase
            code={code}
            participants={participants}
            quizName={quizName}
            onStart={() => sendAction("start")}
            starting={actionLoading}
          />
        )}

        {phase === "question" && question && (
          <AdminQuestionPhase
            question={question}
            onSkip={() => sendAction("skip")}
          />
        )}

        {phase === "reveal" && reveal && (
          <AdminRevealPhase
            reveal={reveal}
            onShowLeaderboard={() => sendAction("leaderboard")}
          />
        )}

        {phase === "leaderboard" && (
          <AdminLeaderboardPhase
            entries={leaderboard}
            isLast={isLastQuestion}
            onNext={() => sendAction("next")}
          />
        )}

        {phase === "finished" && (
          <AdminFinishedPhase
            entries={leaderboard}
            quizName={quizName}
          />
        )}
      </main>
    </div>
  )
}
