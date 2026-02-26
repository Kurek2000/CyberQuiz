"use client"

import { cn } from "@/lib/utils"
import { Triangle, Diamond, Circle, Square } from "lucide-react"

interface AnswerButtonProps {
  index: 0 | 1 | 2 | 3
  /** Tekst odpowiedzi (wyświetlany na ekranie admina) */
  text?: string
  /** Czy przycisk jest wybrany */
  selected?: boolean
  /** Czy przycisk jest zablokowany */
  disabled?: boolean
  /** Czy pokazać jako poprawny */
  isCorrect?: boolean
  /** Czy pokazać jako niepoprawny */
  isWrong?: boolean
  /** Tryb: "participant" = duże przyciski z ikonami, "admin" = z tekstem */
  variant?: "participant" | "admin"
  /** Liczba odpowiedzi (admin mode) */
  answerCount?: number
  onClick?: () => void
  className?: string
}

const ANSWER_COLORS = [
  {
    bg: "bg-[#e21b3c]",
    hover: "hover:bg-[#c8182f]",
    ring: "ring-[#e21b3c]",
    text: "text-white",
  },
  {
    bg: "bg-[#1368ce]",
    hover: "hover:bg-[#1058b0]",
    ring: "ring-[#1368ce]",
    text: "text-white",
  },
  {
    bg: "bg-[#26890c]",
    hover: "hover:bg-[#1f700a]",
    ring: "ring-[#26890c]",
    text: "text-white",
  },
  {
    bg: "bg-[#d89e00]",
    hover: "hover:bg-[#b88600]",
    ring: "ring-[#d89e00]",
    text: "text-white",
  },
] as const

const ANSWER_ICONS = [Triangle, Diamond, Circle, Square] as const
const ANSWER_LABELS = ["A", "B", "C", "D"] as const

export function AnswerButton({
  index,
  text,
  selected = false,
  disabled = false,
  isCorrect,
  isWrong,
  variant = "participant",
  answerCount,
  onClick,
  className,
}: AnswerButtonProps) {
  const color = ANSWER_COLORS[index]
  const Icon = ANSWER_ICONS[index]
  const label = ANSWER_LABELS[index]

  const showCorrectOverlay = isCorrect !== undefined
  const isRevealed = isCorrect !== undefined || isWrong !== undefined

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isRevealed}
      className={cn(
        "relative flex items-center justify-center rounded-lg font-bold transition-all duration-200",
        color.bg,
        color.text,
        !disabled && !isRevealed && color.hover,
        !disabled && !isRevealed && "active:scale-95",
        selected && "ring-4 ring-white ring-offset-2 ring-offset-background scale-95",
        disabled && !isRevealed && "opacity-40 cursor-not-allowed",
        isCorrect && "ring-4 ring-emerald-400 ring-offset-2 ring-offset-background opacity-100",
        isWrong && "opacity-30",
        variant === "participant"
          ? "min-h-[120px] md:min-h-[140px]"
          : "min-h-[80px] p-4",
        className
      )}
      aria-label={`Odpowiedź ${label}${text ? `: ${text}` : ""}`}
    >
      {/* Overlay for correct/wrong */}
      {isCorrect && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-lg">
          <svg className="size-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      <div className={cn(
        "flex items-center gap-3",
        variant === "participant" ? "flex-col" : "flex-row w-full"
      )}>
        <Icon
          className={cn(
            variant === "participant" ? "size-8 md:size-10" : "size-5 shrink-0"
          )}
          fill="currentColor"
        />
        {variant === "admin" && text && (
          <span className="text-lg md:text-xl text-left flex-1 text-balance">
            {text}
          </span>
        )}
        {variant === "participant" && (
          <span className="text-xl md:text-2xl">{label}</span>
        )}
        {variant === "admin" && answerCount !== undefined && (
          <span className="text-2xl font-mono tabular-nums ml-auto shrink-0">
            {answerCount}
          </span>
        )}
      </div>
    </button>
  )
}
