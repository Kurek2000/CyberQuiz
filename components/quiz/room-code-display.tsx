"use client"

import { cn } from "@/lib/utils"

interface RoomCodeDisplayProps {
  code: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function RoomCodeDisplay({
  code,
  size = "lg",
  className,
}: RoomCodeDisplayProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <span
        className={cn(
          "text-muted-foreground font-medium uppercase tracking-widest",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base"
        )}
      >
        Kod pokoju
      </span>
      <div
        className={cn(
          "font-mono font-black tracking-[0.3em] tabular-nums",
          size === "sm" && "text-2xl",
          size === "md" && "text-4xl",
          size === "lg" && "text-6xl md:text-8xl"
        )}
      >
        {code.split("").map((digit, i) => (
          <span
            key={i}
            className="inline-block mx-0.5"
          >
            {digit}
          </span>
        ))}
      </div>
    </div>
  )
}
