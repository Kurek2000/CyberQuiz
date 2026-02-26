"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSSE } from "@/hooks/use-sse"
import { QuizTimer } from "@/components/quiz/quiz-timer"
import { AnswerButton } from "@/components/quiz/answer-button"
import { Leaderboard } from "@/components/quiz/leaderboard"
import { Loader2, CheckCircle2, XCircle, Wifi, WifiOff } from "lucide-react"
import type {
  RoomPhase,
  SSEEvent,
  PublicQuestionParticipant,
  RevealResultParticipant,
  LeaderboardEntry,
} from "@/lib/quiz-types"

interface SessionData {
  participantId: string
  participantName: string
  code: string
}

// ============================================================
// Phase Components
// ============================================================

function LobbyPhase({ quizName }: { quizName: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center px-4 animate-in fade-in duration-500">
      <Loader2 className="size-10 animate-spin text-primary" />
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">{quizName}</h2>
        <p className="text-muted-foreground">
          Czekaj na rozpoczęcie quizu...
        </p>
      </div>
    </div>
  )
}

function QuestionPhase({
  question,
  hasAnswered,
  selectedAnswer,
  onAnswer,
}: {
  question: PublicQuestionParticipant
  hasAnswered: boolean
  selectedAnswer: number | null
  onAnswer: (index: number) => void
}) {
  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300">
      {/* Timer + question counter */}
      <div className="flex items-center justify-between px-2">
        <span className="text-sm font-medium text-muted-foreground">
          {question.index + 1} / {question.totalQuestions}
        </span>
        <QuizTimer
          endsAt={question.questionEndsAt}
          variant="bar"
          size="sm"
          className="flex-1 ml-4"
        />
      </div>

      {/* 4 answer buttons */}
      {hasAnswered ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12 animate-in fade-in duration-300">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-center">
            Odpowiedź zapisana!
          </p>
          <p className="text-muted-foreground text-sm">
            Czekaj na wyniki...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 flex-1">
          {([0, 1, 2, 3] as const).map((i) => (
            <AnswerButton
              key={i}
              index={i}
              variant="participant"
              selected={selectedAnswer === i}
              disabled={hasAnswered}
              onClick={() => onAnswer(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RevealPhase({ result }: { result: RevealResultParticipant }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 animate-in fade-in zoom-in-95 duration-500">
      {/* Big icon */}
      <div
        className={`size-24 rounded-full flex items-center justify-center ${
          result.correct
            ? "bg-emerald-500/20 text-emerald-500"
            : "bg-red-500/20 text-red-500"
        }`}
      >
        {result.correct ? (
          <CheckCircle2 className="size-14" />
        ) : (
          <XCircle className="size-14" />
        )}
      </div>

      {/* Text */}
      <div className="text-center flex flex-col gap-2">
        <h2
          className={`text-2xl font-black ${
            result.correct ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {result.correct ? "Poprawnie!" : "Niepoprawnie"}
        </h2>
        {result.pointsEarned > 0 && (
          <p className="text-lg font-bold">+{result.pointsEarned} pkt</p>
        )}
        <p className="text-muted-foreground text-sm">
          Twój wynik: {result.totalScore} pkt
        </p>
      </div>

      {/* Correct answer */}
      {!result.correct && (
        <div className="w-full max-w-sm rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Poprawna odpowiedź:
          </p>
          <p className="font-semibold text-emerald-500">
            {result.answers[result.correctIndex]}
          </p>
        </div>
      )}
    </div>
  )
}

function LeaderboardPhase({
  entries,
  participantId,
}: {
  entries: LeaderboardEntry[]
  participantId: string
}) {
  return (
    <div className="w-full px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Leaderboard
        entries={entries}
        highlightId={participantId}
        limit={10}
      />
    </div>
  )
}

function FinishedPhase({
  entries,
  participantId,
  quizName,
}: {
  entries: LeaderboardEntry[]
  participantId: string
  quizName: string
}) {
  const myEntry = entries.find((e) => e.participantId === participantId)

  return (
    <div className="w-full flex flex-col items-center gap-6 px-4 animate-in fade-in duration-500">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl font-black">Quiz zakończony!</h2>
        <p className="text-muted-foreground">{quizName}</p>
        {myEntry && (
          <div className="flex flex-col gap-1 mt-2">
            <p className="text-4xl font-black text-primary">
              #{myEntry.rank}
            </p>
            <p className="text-lg font-semibold">{myEntry.score} pkt</p>
          </div>
        )}
      </div>
      <Leaderboard
        entries={entries}
        highlightId={participantId}
        limit={10}
        className="w-full max-w-md"
      />
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function PlayGamePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [phase, setPhase] = useState<RoomPhase>("lobby")
  const [quizName, setQuizName] = useState("")
  const [question, setQuestion] = useState<PublicQuestionParticipant | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [revealResult, setRevealResult] = useState<RevealResultParticipant | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const answerSubmittedRef = useRef(false)

  // Odczytaj sesję z sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`quiz-session-${code}`)
      if (stored) {
        const parsed: SessionData = JSON.parse(stored)
        if (parsed.participantId && parsed.code === code) {
          setSession(parsed)
          return
        }
      }
    } catch {
      // ignore
    }
    // Brak sesji - przekieruj do join
    router.push(`/play?code=${code}`)
  }, [code, router])

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case "room-state": {
        const data = event.data as {
          phase: RoomPhase
          quizName: string
          question?: PublicQuestionParticipant
          hasAnswered?: boolean
          leaderboard?: LeaderboardEntry[]
        }
        setPhase(data.phase)
        setQuizName(data.quizName)
        if (data.question) setQuestion(data.question)
        if (data.hasAnswered) {
          setHasAnswered(true)
          answerSubmittedRef.current = true
        }
        if (data.leaderboard) setLeaderboard(data.leaderboard)
        break
      }

      case "participant-joined":
        break

      case "question-start": {
        const q = event.data as PublicQuestionParticipant
        setPhase("question")
        setQuestion(q)
        setHasAnswered(false)
        setSelectedAnswer(null)
        setRevealResult(null)
        answerSubmittedRef.current = false
        break
      }

      case "reveal": {
        const result = event.data as RevealResultParticipant
        setPhase("reveal")
        setRevealResult(result)
        break
      }

      case "leaderboard": {
        const data = event.data as { leaderboard: LeaderboardEntry[] }
        setPhase("leaderboard")
        setLeaderboard(data.leaderboard)
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
    ? `/api/rooms/${code}/events?participantId=${session.participantId}`
    : null

  const { connected } = useSSE({
    url: sseUrl,
    onEvent: handleSSEEvent,
    enabled: !!session,
  })

  const handleAnswer = async (answerIndex: number) => {
    if (!session || answerSubmittedRef.current) return
    answerSubmittedRef.current = true
    setSelectedAnswer(answerIndex)
    setHasAnswered(true)

    try {
      await fetch(`/api/rooms/${code}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: session.participantId,
          answerIndex,
        }),
      })
    } catch {
      // Retry once
      try {
        await fetch(`/api/rooms/${code}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: session.participantId,
            answerIndex,
          }),
        })
      } catch {
        // Give up silently - answer was recorded optimistically
      }
    }
  }

  if (!session) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <span className="text-sm font-medium truncate">
          {session.participantName}
        </span>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <Wifi className="size-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="size-3.5 text-destructive" />
          )}
          <span className="text-xs font-mono text-muted-foreground">
            {code}
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {phase === "lobby" && <LobbyPhase quizName={quizName} />}

        {phase === "question" && question && (
          <QuestionPhase
            question={question}
            hasAnswered={hasAnswered}
            selectedAnswer={selectedAnswer}
            onAnswer={handleAnswer}
          />
        )}

        {phase === "reveal" && revealResult && (
          <RevealPhase result={revealResult} />
        )}

        {phase === "leaderboard" && (
          <LeaderboardPhase
            entries={leaderboard}
            participantId={session.participantId}
          />
        )}

        {phase === "finished" && (
          <FinishedPhase
            entries={leaderboard}
            participantId={session.participantId}
            quizName={quizName}
          />
        )}
      </div>
    </main>
  )
}
