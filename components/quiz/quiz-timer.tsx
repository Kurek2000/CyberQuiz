"use client"

import { cn } from "@/lib/utils"
import { useGameTimer } from "@/hooks/use-game-timer"

interface QuizTimerProps {
  endsAt: number | null
  /** "circle" = okrągły (admin/projektor), "bar" = liniowy (uczestnik) */
  variant?: "circle" | "bar"
  size?: "sm" | "md" | "lg"
  onTimeUp?: () => void
  className?: string
}

export function QuizTimer({
  endsAt,
  variant = "circle",
  size = "md",
  onTimeUp,
  className,
}: QuizTimerProps) {
  const { secondsLeft, progress, isExpired } = useGameTimer({
    endsAt,
    onTimeUp,
  })

  if (variant === "bar") {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "font-mono font-bold tabular-nums",
              size === "sm" && "text-sm",
              size === "md" && "text-lg",
              size === "lg" && "text-2xl",
              secondsLeft <= 5 && !isExpired && "text-red-500 animate-pulse"
            )}
          >
            {secondsLeft}s
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-200 ease-linear",
              progress > 0.5
                ? "bg-emerald-500"
                : progress > 0.2
                  ? "bg-amber-500"
                  : "bg-red-500"
            )}
            style={{ width: `${Math.max(0, progress * 100)}%` }}
          />
        </div>
      </div>
    )
  }

  // Circle variant
  const sizeMap = { sm: 80, md: 120, lg: 160 }
  const dim = sizeMap[size]
  const strokeWidth = size === "sm" ? 4 : size === "md" ? 6 : 8
  const radius = (dim - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: dim, height: dim }}
    >
      <svg width={dim} height={dim} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={cn(
            "transition-all duration-200 ease-linear",
            progress > 0.5
              ? "stroke-emerald-500"
              : progress > 0.2
                ? "stroke-amber-500"
                : "stroke-red-500"
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute font-mono font-bold tabular-nums",
          size === "sm" && "text-lg",
          size === "md" && "text-3xl",
          size === "lg" && "text-5xl",
          secondsLeft <= 5 && !isExpired && "animate-pulse"
        )}
      >
        {secondsLeft}
      </span>
    </div>
  )
}
