"use client"

import { cn } from "@/lib/utils"
import type { AnswerIndex } from "@/lib/quiz-types"

interface AnswerStatsProps {
  answers: [string, string, string, string]
  distribution: [number, number, number, number]
  correctIndex: AnswerIndex
  totalAnswered: number
  className?: string
}

const BAR_COLORS = [
  "bg-[#e21b3c]",
  "bg-[#1368ce]",
  "bg-[#26890c]",
  "bg-[#d89e00]",
] as const

const LABELS = ["A", "B", "C", "D"] as const

export function AnswerStats({
  answers,
  distribution,
  correctIndex,
  totalAnswered,
  className,
}: AnswerStatsProps) {
  const maxCount = Math.max(...distribution, 1)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {distribution.map((count, i) => {
        const percentage =
          totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0
        const barWidth = (count / maxCount) * 100
        const isCorrect = i === correctIndex

        return (
          <div key={i} className="flex items-center gap-3">
            <span
              className={cn(
                "w-6 text-center font-bold text-sm shrink-0",
                isCorrect ? "text-emerald-400" : "text-muted-foreground"
              )}
            >
              {LABELS[i]}
            </span>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm truncate max-w-[200px]",
                    isCorrect && "font-bold text-emerald-400"
                  )}
                >
                  {answers[i]}
                  {isCorrect && " *"}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums ml-2 shrink-0">
                  {count} ({percentage}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    BAR_COLORS[i],
                    isCorrect && "ring-1 ring-emerald-400"
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
