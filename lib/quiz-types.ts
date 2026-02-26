// ============================================================
// Centralne typy TypeScript dla aplikacji Quiz Live
// ============================================================

/** Kategoria punktowa pytania: 1 = łatwe, 2 = średnie, 3 = trudne */
export type PointCategory = 1 | 2 | 3

/** Indeks poprawnej odpowiedzi (0-3) */
export type AnswerIndex = 0 | 1 | 2 | 3

/** Pytanie quizowe */
export interface QuizQuestion {
  id: string
  text: string
  answers: [string, string, string, string]
  correctIndex: AnswerIndex
  points: PointCategory
  /** Czas na odpowiedź w sekundach */
  timeLimit: number
}

/** Quiz (zestaw pytań) */
export interface Quiz {
  id: string
  name: string
  description: string
  questions: QuizQuestion[]
  createdAt: number
  updatedAt: number
}

/** Dane do tworzenia/edycji quizu (bez id i timestamp) */
export interface QuizInput {
  name: string
  description: string
  questions: Omit<QuizQuestion, "id">[]
}

// ============================================================
// Game Room
// ============================================================

/** Fazy gry */
export type RoomPhase =
  | "lobby"
  | "question"
  | "reveal"
  | "leaderboard"
  | "finished"

/** Uczestnik w pokoju */
export interface Participant {
  id: string
  name: string
  joinedAt: number
}

/** Odpowiedź uczestnika na pytanie */
export interface ParticipantAnswer {
  participantId: string
  questionIndex: number
  answerIndex: number
  answeredAt: number
  /** Czas odpowiedzi w ms od startu pytania (do obliczania bonusu) */
  responseTimeMs: number
}

/** Stan pokoju gry (wewnętrzny, pełny) */
export interface GameRoom {
  code: string
  quizId: string
  quiz: Quiz
  adminSecret: string
  phase: RoomPhase
  currentQuestionIndex: number
  participants: Map<string, Participant>
  /** questionIndex -> participantId -> answer */
  answers: Map<number, Map<string, ParticipantAnswer>>
  /** participantId -> total score */
  scores: Map<string, number>
  questionStartedAt: number | null
  questionEndsAt: number | null
  createdAt: number
  /** Timer handle dla automatycznego zakończenia pytania */
  timerHandle: ReturnType<typeof setTimeout> | null
}

// ============================================================
// Public (bezpieczne) stany wysyłane przez SSE
// ============================================================

export interface PublicParticipant {
  id: string
  name: string
}

/** Stan pytania widoczny dla uczestnika (BEZ correctIndex, BEZ points) */
export interface PublicQuestionParticipant {
  index: number
  totalQuestions: number
  timeLimit: number
  questionStartedAt: number
  questionEndsAt: number
}

/** Stan pytania widoczny dla admina (z treścią pytania i odpowiedziami) */
export interface PublicQuestionAdmin {
  index: number
  totalQuestions: number
  text: string
  answers: [string, string, string, string]
  timeLimit: number
  questionStartedAt: number
  questionEndsAt: number
  answeredCount: number
  totalParticipants: number
}

/** Wynik reveal widoczny dla uczestnika */
export interface RevealResultParticipant {
  correct: boolean
  correctIndex: AnswerIndex
  yourAnswer: number | null
  pointsEarned: number
  totalScore: number
  answers: [string, string, string, string]
  questionText: string
}

/** Wynik reveal widoczny dla admina */
export interface RevealResultAdmin {
  correctIndex: AnswerIndex
  questionText: string
  answers: [string, string, string, string]
  points: PointCategory
  answerDistribution: [number, number, number, number]
  correctCount: number
  totalAnswered: number
  totalParticipants: number
}

/** Wpis w tabeli wyników */
export interface LeaderboardEntry {
  participantId: string
  name: string
  score: number
  rank: number
  /** Zmiana pozycji od ostatniego leaderboardu (+ = awans, - = spadek) */
  rankChange: number
}

/** Akcja admina */
export type AdminAction = "start" | "next" | "skip" | "leaderboard"

// ============================================================
// SSE Event types
// ============================================================

export type SSEEventType =
  | "room-state"
  | "participant-joined"
  | "question-start"
  | "answer-count"
  | "question-end"
  | "reveal"
  | "leaderboard"
  | "game-finished"
  | "ping"

export interface SSEEvent {
  type: SSEEventType
  data: unknown
  timestamp: number
}

// ============================================================
// API Response types
// ============================================================

export interface CreateRoomResponse {
  code: string
  adminSecret: string
}

export interface JoinRoomResponse {
  participantId: string
  participantName: string
  roomPhase: RoomPhase
  participants: PublicParticipant[]
  quizName: string
}

export interface SubmitAnswerResponse {
  accepted: boolean
  reason?: string
}

export interface RoomPublicInfo {
  code: string
  quizName: string
  phase: RoomPhase
  participantCount: number
  currentQuestionIndex: number
  totalQuestions: number
}
