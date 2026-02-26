"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, LogIn } from "lucide-react"
import Link from "next/link"

export default function PlayJoinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeParam = searchParams.get("code") ?? ""

  const [code, setCode] = useState(codeParam)
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [quizName, setQuizName] = useState<string | null>(null)

  // Sprawdź pokój gdy kod jest podany
  useEffect(() => {
    if (code.length === 6) {
      fetch(`/api/rooms/${code}`)
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error()
        })
        .then((data) => setQuizName(data.quizName))
        .catch(() => setQuizName(null))
    } else {
      setQuizName(null)
    }
  }, [code])

  // Sprawdź czy w sessionStorage jest zapisana sesja dla tego pokoju
  useEffect(() => {
    if (code.length === 6) {
      try {
        const stored = sessionStorage.getItem(`quiz-session-${code}`)
        if (stored) {
          const session = JSON.parse(stored)
          if (session.participantId && session.code) {
            router.push(`/play/${session.code}`)
          }
        }
      } catch {
        // ignore
      }
    }
  }, [code, router])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Nie udało się dołączyć")
        setLoading(false)
        return
      }

      // Zapisz sesję
      sessionStorage.setItem(
        `quiz-session-${code}`,
        JSON.stringify({
          participantId: data.participantId,
          participantName: data.participantName,
          code,
        })
      )

      router.push(`/play/${code}`)
    } catch {
      setError("Błąd połączenia z serwerem")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="size-4" />
          Powrót
        </Link>

        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold">Dołącz do quizu</h1>
          {quizName && (
            <p className="text-muted-foreground text-sm">{quizName}</p>
          )}
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-5">
          {/* Kod pokoju (jeśli nie podano w URL) */}
          {!codeParam && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Kod pokoju</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setCode(val)
                  setError("")
                }}
                placeholder="6-cyfrowy kod"
                className="text-center text-xl h-12 font-mono tracking-[0.2em]"
              />
            </div>
          )}

          {/* Nick */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Twój nick</Label>
            <Input
              id="name"
              type="text"
              maxLength={30}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              placeholder="Wpisz swój nick"
              className="text-lg h-12"
              autoFocus={!!codeParam}
            />
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={
              code.length !== 6 || name.trim().length === 0 || loading
            }
            className="h-12 text-base font-bold"
          >
            <LogIn className="size-5" />
            {loading ? "Dołączanie..." : "Dołącz"}
          </Button>
        </form>
      </div>
    </main>
  )
}
