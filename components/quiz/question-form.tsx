"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, GripVertical, Check } from "lucide-react"
import type { PointCategory, AnswerIndex } from "@/lib/quiz-types"

interface QuestionFormData {
  text: string
  answers: [string, string, string, string]
  correctIndex: AnswerIndex
  points: PointCategory
  timeLimit: number
}

interface QuestionFormProps {
  index: number
  data: QuestionFormData
  onChange: (data: QuestionFormData) => void
  onRemove: () => void
  canRemove: boolean
  className?: string
}

const ANSWER_COLORS = [
  "border-[#e21b3c]/50 focus-within:border-[#e21b3c]",
  "border-[#1368ce]/50 focus-within:border-[#1368ce]",
  "border-[#26890c]/50 focus-within:border-[#26890c]",
  "border-[#d89e00]/50 focus-within:border-[#d89e00]",
] as const

const ANSWER_BG = [
  "bg-[#e21b3c]/5",
  "bg-[#1368ce]/5",
  "bg-[#26890c]/5",
  "bg-[#d89e00]/5",
] as const

const LABELS = ["A", "B", "C", "D"] as const

export function QuestionForm({
  index,
  data,
  onChange,
  onRemove,
  canRemove,
  className,
}: QuestionFormProps) {
  const updateField = <K extends keyof QuestionFormData>(
    key: K,
    value: QuestionFormData[K]
  ) => {
    onChange({ ...data, [key]: value })
  }

  const updateAnswer = (answerIndex: number, value: string) => {
    const newAnswers = [...data.answers] as [string, string, string, string]
    newAnswers[answerIndex] = value
    updateField("answers", newAnswers)
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 flex flex-col gap-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <GripVertical className="size-4 text-muted-foreground shrink-0 cursor-grab" />
        <span className="font-bold text-sm text-muted-foreground">
          Pytanie {index + 1}
        </span>
        <div className="flex-1" />
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Usuń pytanie</span>
          </Button>
        )}
      </div>

      {/* Treść pytania */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`q-${index}-text`}>Treść pytania</Label>
        <Input
          id={`q-${index}-text`}
          value={data.text}
          onChange={(e) => updateField("text", e.target.value)}
          placeholder="Wpisz treść pytania..."
          className="text-base"
        />
      </div>

      {/* Odpowiedzi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.answers.map((answer, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-lg border p-2 transition-colors",
              ANSWER_COLORS[i],
              ANSWER_BG[i],
              data.correctIndex === i && "ring-2 ring-emerald-500/50"
            )}
          >
            <span className="font-bold text-sm w-5 text-center shrink-0">
              {LABELS[i]}
            </span>
            <Input
              value={answer}
              onChange={(e) => updateAnswer(i, e.target.value)}
              placeholder={`Odpowiedź ${LABELS[i]}`}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-1"
            />
            <button
              type="button"
              onClick={() => updateField("correctIndex", i as AnswerIndex)}
              className={cn(
                "size-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                data.correctIndex === i
                  ? "bg-emerald-500 text-white"
                  : "bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
              )}
              title="Zaznacz jako poprawną"
            >
              <Check className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Punkty i czas */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            Punkty:
          </Label>
          <div className="flex gap-1">
            {([1, 2, 3] as PointCategory[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => updateField("points", p)}
                className={cn(
                  "size-8 rounded-md text-sm font-bold transition-colors",
                  data.points === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label
            htmlFor={`q-${index}-time`}
            className="text-xs text-muted-foreground whitespace-nowrap"
          >
            Czas (s):
          </Label>
          <Input
            id={`q-${index}-time`}
            type="number"
            min={5}
            max={120}
            value={data.timeLimit}
            onChange={(e) =>
              updateField("timeLimit", parseInt(e.target.value) || 30)
            }
            className="w-20"
          />
        </div>
      </div>
    </div>
  )
}

export type { QuestionFormData }
