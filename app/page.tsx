"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Gamepad2, Settings } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()

    if (!/^\d{6}$/.test(trimmed)) {
      setError("Kod pokoju musi składać się z 6 cyfr")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/rooms/${trimmed}`)
      if (!res.ok) {
        setError("Pokój nie istnieje")
        setLoading(false)
        return
      }
      router.push(`/play?code=${trimmed}`)
    } catch {
      setError("Błąd połączenia z serwerem")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md flex flex-col items-center gap-10">
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="size-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-balance">
            Quiz Live
          </h1>
          <p className="text-muted-foreground text-balance">
            Dołącz do quizu na żywo i sprawdź swoją wiedzę
          </p>
        </div>

        {/* Join form */}
        <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
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
              placeholder="Wpisz 6-cyfrowy kod"
              className="text-center text-2xl h-14 font-mono tracking-[0.3em] placeholder:text-base placeholder:tracking-normal"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={code.length !== 6 || loading}
            className="h-12 text-base font-bold"
          >
            <Gamepad2 className="size-5" />
            {loading ? "Łączenie..." : "Dołącz do quizu"}
          </Button>
        </form>

        {/* Admin link */}
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="size-4" />
          Panel administratora
        </Link>
      </div>
    </main>
  )
}
