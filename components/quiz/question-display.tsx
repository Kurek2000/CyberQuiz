"use client"

import { cn } from "@/lib/utils"

interface QuestionDisplayProps {
  text: string
  index: number
  totalQuestions: number
  className?: string
}

export function QuestionDisplay({
  text,
  index,
  totalQuestions,
  className,
}: QuestionDisplayProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Pytanie {index + 1} z {totalQuestions}
      </span>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-balance">
        {text}
      </h2>
    </div>
  )
}
