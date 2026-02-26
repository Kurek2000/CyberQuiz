import { z } from "zod"

// ============================================================
// Zod schemas for API validation
// ============================================================

export const questionSchema = z.object({
  text: z
    .string()
    .min(3, "Treść pytania musi mieć min. 3 znaki")
    .max(500, "Treść pytania może mieć max 500 znaków"),
  answers: z.tuple([
    z.string().min(1, "Odpowiedź nie może być pusta").max(200),
    z.string().min(1, "Odpowiedź nie może być pusta").max(200),
    z.string().min(1, "Odpowiedź nie może być pusta").max(200),
    z.string().min(1, "Odpowiedź nie może być pusta").max(200),
  ]),
  correctIndex: z
    .number()
    .int()
    .min(0)
    .max(3) as z.ZodType<0 | 1 | 2 | 3>,
  points: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  timeLimit: z.number().int().min(5).max(120).default(30),
})

export const quizInputSchema = z.object({
  name: z
    .string()
    .min(2, "Nazwa quizu musi mieć min. 2 znaki")
    .max(100, "Nazwa quizu może mieć max 100 znaków"),
  description: z
    .string()
    .max(500, "Opis quizu może mieć max 500 znaków")
    .default(""),
  questions: z
    .array(questionSchema)
    .min(1, "Quiz musi mieć przynajmniej 1 pytanie")
    .max(100, "Quiz może mieć max 100 pytań"),
})

export const joinRoomSchema = z.object({
  name: z
    .string()
    .min(1, "Nick nie może być pusty")
    .max(30, "Nick może mieć max 30 znaków")
    .regex(
      /^[a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ _\-]+$/,
      "Nick może zawierać tylko litery, cyfry, spacje i myślniki"
    ),
})

export const submitAnswerSchema = z.object({
  participantId: z.string().min(1),
  answerIndex: z.number().int().min(0).max(3),
})

export const adminActionSchema = z.object({
  action: z.enum(["start", "next", "skip", "leaderboard"]),
  adminSecret: z.string().min(1),
})

export const createRoomSchema = z.object({
  quizId: z.string().min(1),
})

export type QuizInputData = z.infer<typeof quizInputSchema>
export type QuestionData = z.infer<typeof questionSchema>
