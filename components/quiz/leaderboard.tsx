"use client"

import { cn } from "@/lib/utils"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LeaderboardEntry } from "@/lib/quiz-types"

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  /** ID uczestnika (podświetla jego wiersz) */
  highlightId?: string
  /** Ile wpisów pokazać (domyślnie 10) */
  limit?: number
  className?: string
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  2: "bg-slate-300/20 text-slate-300 border-slate-400/30",
  3: "bg-orange-600/20 text-orange-400 border-orange-600/30",
}

export function Leaderboard({
  entries,
  highlightId,
  limit = 10,
  className,
}: LeaderboardProps) {
  const displayed = entries.slice(0, limit)

  // Jeśli uczestnik nie jest w top limit, dodaj go na końcu
  const highlightEntry = highlightId
    ? entries.find((e) => e.participantId === highlightId)
    : null
  const highlightInTop = displayed.some(
    (e) => e.participantId === highlightId
  )

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="size-5 text-amber-400" />
        <h3 className="font-bold text-lg">Ranking</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        {displayed.map((entry, i) => (
          <div
            key={entry.participantId}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-all duration-500",
              "animate-in fade-in slide-in-from-left duration-500",
              entry.participantId === highlightId &&
                "ring-2 ring-primary bg-primary/10 border-primary/30",
              RANK_STYLES[entry.rank] ??
                "bg-card/50 border-border/50 text-foreground"
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Rank */}
            <span
              className={cn(
                "w-8 text-center font-black text-lg tabular-nums",
                entry.rank === 1 && "text-amber-400",
                entry.rank === 2 && "text-slate-300",
                entry.rank === 3 && "text-orange-400"
              )}
            >
              {entry.rank}
            </span>

            {/* Name */}
            <span className="flex-1 font-semibold truncate">
              {entry.name}
            </span>

            {/* Rank change */}
            {entry.rankChange !== 0 && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  entry.rankChange > 0 && "text-emerald-400",
                  entry.rankChange < 0 && "text-red-400"
                )}
              >
                {entry.rankChange > 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(entry.rankChange)}
              </span>
            )}
            {entry.rankChange === 0 && entries.length > 1 && (
              <Minus className="size-3 text-muted-foreground" />
            )}

            {/* Score */}
            <span className="font-mono font-bold tabular-nums text-lg">
              {entry.score}
            </span>
          </div>
        ))}
      </div>

      {/* Uczestnik poza top - pokaż osobno */}
      {highlightEntry && !highlightInTop && (
        <>
          <div className="text-center text-muted-foreground text-sm py-1">
            {"..."}
          </div>
          <div
            className="flex items-center gap-3 rounded-lg border px-4 py-2.5 ring-2 ring-primary bg-primary/10 border-primary/30"
          >
            <span className="w-8 text-center font-black text-lg tabular-nums">
              {highlightEntry.rank}
            </span>
            <span className="flex-1 font-semibold truncate">
              {highlightEntry.name} (Ty)
            </span>
            <span className="font-mono font-bold tabular-nums text-lg">
              {highlightEntry.score}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
