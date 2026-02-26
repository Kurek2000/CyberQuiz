"use client"

import { cn } from "@/lib/utils"
import { Users } from "lucide-react"
import type { PublicParticipant } from "@/lib/quiz-types"

interface ParticipantsListProps {
  participants: PublicParticipant[]
  className?: string
}

export function ParticipantsList({
  participants,
  className,
}: ParticipantsListProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="size-5" />
        <span className="font-medium">
          Uczestnicy ({participants.length})
        </span>
      </div>
      {participants.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Brak uczestników. Czekam na dołączenie...
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <div
              key={p.id}
              className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
