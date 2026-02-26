import { randomUUID } from "crypto"
import type {
  Quiz,
  QuizQuestion,
  QuizInput,
  GameRoom,
  Participant,
  ParticipantAnswer,
  RoomPhase,
  PublicParticipant,
  PublicQuestionParticipant,
  PublicQuestionAdmin,
  RevealResultParticipant,
  RevealResultAdmin,
  LeaderboardEntry,
  SSEEvent,
  SSEEventType,
  CreateRoomResponse,
  JoinRoomResponse,
  SubmitAnswerResponse,
  RoomPublicInfo,
  AnswerIndex,
} from "./quiz-types"
import { seedCybersecurityQuiz } from "./seed-quiz"

// ============================================================
// SSE Client management
// ============================================================

interface SSEClient {
  id: string
  writer: WritableStreamDefaultWriter<Uint8Array>
  participantId: string | null // null = admin
  roomCode: string
}

// ============================================================
// Game Engine Singleton
// ============================================================

class GameEngine {
  private quizzes: Map<string, Quiz> = new Map()
  private rooms: Map<string, GameRoom> = new Map()
  private sseClients: Map<string, Set<SSEClient>> = new Map()
  /** Poprzednie rankingi per pokój (do obliczania rankChange) */
  private previousRanks: Map<string, Map<string, number>> = new Map()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null
  private seeded = false

  constructor() {
    this.startCleanupInterval()
  }

  // ----------------------------------------------------------
  // Initialization
  // ----------------------------------------------------------

  ensureSeeded(): void {
    if (this.seeded) return
    this.seeded = true
    const seedQuiz = seedCybersecurityQuiz()
    this.quizzes.set(seedQuiz.id, seedQuiz)
  }

  // ----------------------------------------------------------
  // Quiz CRUD
  // ----------------------------------------------------------

  createQuiz(input: QuizInput): Quiz {
    const id = randomUUID()
    const now = Date.now()
    const quiz: Quiz = {
      id,
      name: input.name,
      description: input.description,
      questions: input.questions.map((q) => ({
        ...q,
        id: randomUUID(),
      })),
      createdAt: now,
      updatedAt: now,
    }
    this.quizzes.set(id, quiz)
    return quiz
  }

  updateQuiz(id: string, input: QuizInput): Quiz | null {
    const existing = this.quizzes.get(id)
    if (!existing) return null

    const updated: Quiz = {
      ...existing,
      name: input.name,
      description: input.description,
      questions: input.questions.map((q) => ({
        ...q,
        id: randomUUID(),
      })),
      updatedAt: Date.now(),
    }
    this.quizzes.set(id, updated)
    return updated
  }

  deleteQuiz(id: string): boolean {
    // Nie pozwól usunąć quizu jeśli jest aktywny pokój
    for (const room of this.rooms.values()) {
      if (room.quizId === id && room.phase !== "finished") {
        return false
      }
    }
    return this.quizzes.delete(id)
  }

  getQuiz(id: string): Quiz | null {
    return this.quizzes.get(id) ?? null
  }

  listQuizzes(): Quiz[] {
    this.ensureSeeded()
    return Array.from(this.quizzes.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    )
  }

  // ----------------------------------------------------------
  // Room lifecycle
  // ----------------------------------------------------------

  private generateRoomCode(): string {
    let code: string
    do {
      code = String(Math.floor(100000 + Math.random() * 900000))
    } while (this.rooms.has(code))
    return code
  }

  createRoom(quizId: string): CreateRoomResponse | null {
    const quiz = this.quizzes.get(quizId)
    if (!quiz) return null
    if (quiz.questions.length === 0) return null

    const code = this.generateRoomCode()
    const adminSecret = randomUUID()

    const room: GameRoom = {
      code,
      quizId,
      quiz: structuredClone(quiz), // kopia - quiz może być edytowany
      adminSecret,
      phase: "lobby",
      currentQuestionIndex: -1,
      participants: new Map(),
      answers: new Map(),
      scores: new Map(),
      questionStartedAt: null,
      questionEndsAt: null,
      createdAt: Date.now(),
      timerHandle: null,
    }

    this.rooms.set(code, room)
    this.sseClients.set(code, new Set())
    this.previousRanks.set(code, new Map())

    return { code, adminSecret }
  }

  getRoom(code: string): GameRoom | null {
    return this.rooms.get(code) ?? null
  }

  getRoomPublicInfo(code: string): RoomPublicInfo | null {
    const room = this.rooms.get(code)
    if (!room) return null

    return {
      code: room.code,
      quizName: room.quiz.name,
      phase: room.phase,
      participantCount: room.participants.size,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.quiz.questions.length,
    }
  }

  validateAdminSecret(code: string, secret: string): boolean {
    const room = this.rooms.get(code)
    return room !== null && room !== undefined && room.adminSecret === secret
  }

  // ----------------------------------------------------------
  // Join
  // ----------------------------------------------------------

  joinRoom(code: string, name: string): JoinRoomResponse | { error: string } {
    const room = this.rooms.get(code)
    if (!room) return { error: "Pokój nie istnieje" }

    if (room.phase === "finished") {
      return { error: "Quiz już się zakończył" }
    }

    if (room.participants.size >= 200) {
      return { error: "Pokój jest pełny (max 200 uczestników)" }
    }

    // Sprawdź unikalność nicku (case-insensitive)
    const nameLower = name.trim().toLowerCase()
    for (const p of room.participants.values()) {
      if (p.name.toLowerCase() === nameLower) {
        return { error: "Ten nick jest już zajęty" }
      }
    }

    const participantId = randomUUID()
    const participant: Participant = {
      id: participantId,
      name: name.trim(),
      joinedAt: Date.now(),
    }

    room.participants.set(participantId, participant)
    room.scores.set(participantId, 0)

    // Broadcast do pokoju
    this.broadcastToRoom(code, "participant-joined", {
      participant: { id: participantId, name: participant.name },
      participants: this.getPublicParticipants(room),
      participantCount: room.participants.size,
    })

    return {
      participantId,
      participantName: participant.name,
      roomPhase: room.phase,
      participants: this.getPublicParticipants(room),
      quizName: room.quiz.name,
    }
  }

  // ----------------------------------------------------------
  // Admin actions
  // ----------------------------------------------------------

  startQuiz(code: string): { error?: string } {
    const room = this.rooms.get(code)
    if (!room) return { error: "Pokój nie istnieje" }
    if (room.phase !== "lobby") return { error: "Quiz już został rozpoczęty" }
    if (room.participants.size === 0) {
      return { error: "Brak uczestników" }
    }

    this.advanceToQuestion(room)
    return {}
  }

  nextQuestion(code: string): { error?: string } {
    const room = this.rooms.get(code)
    if (!room) return { error: "Pokój nie istnieje" }

    if (
      room.phase !== "reveal" &&
      room.phase !== "leaderboard"
    ) {
      return { error: "Nie można przejść do kolejnego pytania w tej fazie" }
    }

    // Sprawdź czy są kolejne pytania
    if (room.currentQuestionIndex + 1 >= room.quiz.questions.length) {
      this.finishGame(room)
      return {}
    }

    this.advanceToQuestion(room)
    return {}
  }

  skipWaiting(code: string): { error?: string } {
    const room = this.rooms.get(code)
    if (!room) return { error: "Pokój nie istnieje" }
    if (room.phase !== "question") {
      return { error: "Nie trwa żadne pytanie" }
    }

    this.endQuestion(room)
    return {}
  }

  showLeaderboard(code: string): { error?: string } {
    const room = this.rooms.get(code)
    if (!room) return { error: "Pokój nie istnieje" }
    if (room.phase !== "reveal") {
      return { error: "Nie można pokazać rankingu w tej fazie" }
    }

    this.transitionToLeaderboard(room)
    return {}
  }

  // ----------------------------------------------------------
  // Player answer
  // ----------------------------------------------------------

  submitAnswer(
    code: string,
    participantId: string,
    answerIndex: number
  ): SubmitAnswerResponse {
    const room = this.rooms.get(code)
    if (!room) return { accepted: false, reason: "Pokój nie istnieje" }

    if (room.phase !== "question") {
      return { accepted: false, reason: "Pytanie nie jest aktywne" }
    }

    if (!room.participants.has(participantId)) {
      return { accepted: false, reason: "Nie jesteś uczestnikiem tego pokoju" }
    }

    const qi = room.currentQuestionIndex
    if (!room.answers.has(qi)) {
      room.answers.set(qi, new Map())
    }

    const questionAnswers = room.answers.get(qi)!
    if (questionAnswers.has(participantId)) {
      return { accepted: false, reason: "Już odpowiedziałeś na to pytanie" }
    }

    // Sprawdź czas
    const now = Date.now()
    if (room.questionEndsAt && now > room.questionEndsAt + 1000) {
      // +1s grace period na lag sieciowy
      return { accepted: false, reason: "Czas na odpowiedź minął" }
    }

    const answer: ParticipantAnswer = {
      participantId,
      questionIndex: qi,
      answerIndex,
      answeredAt: now,
      responseTimeMs: room.questionStartedAt
        ? now - room.questionStartedAt
        : 0,
    }

    questionAnswers.set(participantId, answer)

    // Oblicz punkty
    const question = room.quiz.questions[qi]
    if (answerIndex === question.correctIndex) {
      const basePoints = question.points * 100
      // Bonus za szybkość: max 50% extra, liniowo malejący z czasem
      const timeLimitMs = question.timeLimit * 1000
      const timeRatio = Math.max(
        0,
        1 - answer.responseTimeMs / timeLimitMs
      )
      const speedBonus = Math.round(basePoints * 0.5 * timeRatio)
      const totalPoints = basePoints + speedBonus

      const currentScore = room.scores.get(participantId) ?? 0
      room.scores.set(participantId, currentScore + totalPoints)
    }

    // Broadcast updated answer count
    this.broadcastAnswerCount(room)

    // Jeśli wszyscy odpowiedzieli - zakończ pytanie wcześniej
    if (questionAnswers.size >= room.participants.size) {
      if (room.timerHandle) {
        clearTimeout(room.timerHandle)
        room.timerHandle = null
      }
      this.endQuestion(room)
    }

    return { accepted: true }
  }

  // ----------------------------------------------------------
  // Game flow internals
  // ----------------------------------------------------------

  private advanceToQuestion(room: GameRoom): void {
    room.currentQuestionIndex++
    const qi = room.currentQuestionIndex
    const question = room.quiz.questions[qi]

    if (!question) {
      this.finishGame(room)
      return
    }

    const now = Date.now()
    room.phase = "question"
    room.questionStartedAt = now
    room.questionEndsAt = now + question.timeLimit * 1000

    // Inicjalizuj mapę odpowiedzi dla tego pytania
    room.answers.set(qi, new Map())

    // Ustaw timer automatycznego zakończenia
    room.timerHandle = setTimeout(() => {
      room.timerHandle = null
      this.endQuestion(room)
    }, question.timeLimit * 1000)

    // Broadcast question start - różne dane dla admina i uczestników
    this.broadcastToRoomSplit(room, "question-start", {
      admin: {
        index: qi,
        totalQuestions: room.quiz.questions.length,
        text: question.text,
        answers: question.answers,
        timeLimit: question.timeLimit,
        questionStartedAt: room.questionStartedAt,
        questionEndsAt: room.questionEndsAt,
        answeredCount: 0,
        totalParticipants: room.participants.size,
      } satisfies PublicQuestionAdmin,
      participant: {
        index: qi,
        totalQuestions: room.quiz.questions.length,
        timeLimit: question.timeLimit,
        questionStartedAt: room.questionStartedAt,
        questionEndsAt: room.questionEndsAt,
      } satisfies PublicQuestionParticipant,
    })
  }

  private endQuestion(room: GameRoom): void {
    if (room.phase !== "question") return

    if (room.timerHandle) {
      clearTimeout(room.timerHandle)
      room.timerHandle = null
    }

    room.phase = "reveal"

    const qi = room.currentQuestionIndex
    const question = room.quiz.questions[qi]
    const questionAnswers = room.answers.get(qi) ?? new Map()

    // Oblicz rozkład odpowiedzi
    const distribution: [number, number, number, number] = [0, 0, 0, 0]
    let correctCount = 0
    for (const answer of questionAnswers.values()) {
      if (answer.answerIndex >= 0 && answer.answerIndex <= 3) {
        distribution[answer.answerIndex]++
      }
      if (answer.answerIndex === question.correctIndex) {
        correctCount++
      }
    }

    // Broadcast reveal z różnymi danymi
    const adminReveal: RevealResultAdmin = {
      correctIndex: question.correctIndex,
      questionText: question.text,
      answers: question.answers,
      points: question.points,
      answerDistribution: distribution,
      correctCount,
      totalAnswered: questionAnswers.size,
      totalParticipants: room.participants.size,
    }

    // Dla każdego uczestnika - indywidualny wynik
    for (const client of this.getSSEClients(room.code)) {
      if (client.participantId) {
        const answer = questionAnswers.get(client.participantId)
        const isCorrect = answer
          ? answer.answerIndex === question.correctIndex
          : false
        const pointsEarned = this.calculatePointsForAnswer(
          room,
          qi,
          client.participantId
        )

        const participantReveal: RevealResultParticipant = {
          correct: isCorrect,
          correctIndex: question.correctIndex,
          yourAnswer: answer ? answer.answerIndex : null,
          pointsEarned,
          totalScore: room.scores.get(client.participantId) ?? 0,
          answers: question.answers,
          questionText: question.text,
        }

        this.sendToClient(client, "reveal", participantReveal)
      } else {
        // Admin
        this.sendToClient(client, "reveal", adminReveal)
      }
    }
  }

  private transitionToLeaderboard(room: GameRoom): void {
    room.phase = "leaderboard"

    const leaderboard = this.buildLeaderboard(room)

    // Zapisz obecne ranki
    const prevRanks = this.previousRanks.get(room.code) ?? new Map()
    const newRanks = new Map<string, number>()
    for (const entry of leaderboard) {
      newRanks.set(entry.participantId, entry.rank)
    }
    this.previousRanks.set(room.code, newRanks)

    // Oblicz rankChange
    const leaderboardWithChange = leaderboard.map((entry) => ({
      ...entry,
      rankChange: prevRanks.has(entry.participantId)
        ? prevRanks.get(entry.participantId)! - entry.rank
        : 0,
    }))

    this.broadcastToRoom(room.code, "leaderboard", {
      leaderboard: leaderboardWithChange,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.quiz.questions.length,
      isLast:
        room.currentQuestionIndex + 1 >= room.quiz.questions.length,
    })
  }

  private finishGame(room: GameRoom): void {
    if (room.timerHandle) {
      clearTimeout(room.timerHandle)
      room.timerHandle = null
    }

    room.phase = "finished"

    const leaderboard = this.buildLeaderboard(room)

    this.broadcastToRoom(room.code, "game-finished", {
      leaderboard,
      quizName: room.quiz.name,
      totalQuestions: room.quiz.questions.length,
    })
  }

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  private calculatePointsForAnswer(
    room: GameRoom,
    questionIndex: number,
    participantId: string
  ): number {
    const questionAnswers = room.answers.get(questionIndex)
    if (!questionAnswers) return 0

    const answer = questionAnswers.get(participantId)
    if (!answer) return 0

    const question = room.quiz.questions[questionIndex]
    if (answer.answerIndex !== question.correctIndex) return 0

    const basePoints = question.points * 100
    const timeLimitMs = question.timeLimit * 1000
    const timeRatio = Math.max(
      0,
      1 - answer.responseTimeMs / timeLimitMs
    )
    const speedBonus = Math.round(basePoints * 0.5 * timeRatio)
    return basePoints + speedBonus
  }

  private buildLeaderboard(room: GameRoom): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = []

    for (const [participantId, score] of room.scores.entries()) {
      const participant = room.participants.get(participantId)
      if (!participant) continue

      entries.push({
        participantId,
        name: participant.name,
        score,
        rank: 0,
        rankChange: 0,
      })
    }

    // Sortuj po score malejąco
    entries.sort((a, b) => b.score - a.score)

    // Przydziel ranki (z obsługą remisów)
    let currentRank = 1
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i].score < entries[i - 1].score) {
        currentRank = i + 1
      }
      entries[i].rank = currentRank
    }

    return entries
  }

  private getPublicParticipants(room: GameRoom): PublicParticipant[] {
    return Array.from(room.participants.values()).map((p) => ({
      id: p.id,
      name: p.name,
    }))
  }

  // ----------------------------------------------------------
  // SSE Management
  // ----------------------------------------------------------

  addSSEClient(
    roomCode: string,
    writer: WritableStreamDefaultWriter<Uint8Array>,
    participantId: string | null
  ): SSEClient {
    const client: SSEClient = {
      id: randomUUID(),
      writer,
      participantId,
      roomCode,
    }

    if (!this.sseClients.has(roomCode)) {
      this.sseClients.set(roomCode, new Set())
    }
    this.sseClients.get(roomCode)!.add(client)

    return client
  }

  removeSSEClient(client: SSEClient): void {
    const clients = this.sseClients.get(client.roomCode)
    if (clients) {
      clients.delete(client)
      if (clients.size === 0) {
        this.sseClients.delete(client.roomCode)
      }
    }
  }

  private getSSEClients(roomCode: string): Set<SSEClient> {
    return this.sseClients.get(roomCode) ?? new Set()
  }

  private sendToClient(
    client: SSEClient,
    type: SSEEventType,
    data: unknown
  ): void {
    const event: SSEEvent = {
      type,
      data,
      timestamp: Date.now(),
    }

    const message = `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`
    const encoder = new TextEncoder()

    try {
      client.writer.write(encoder.encode(message)).catch(() => {
        this.removeSSEClient(client)
      })
    } catch {
      this.removeSSEClient(client)
    }
  }

  broadcastToRoom(
    roomCode: string,
    type: SSEEventType,
    data: unknown
  ): void {
    const clients = this.getSSEClients(roomCode)
    for (const client of clients) {
      this.sendToClient(client, type, data)
    }
  }

  /**
   * Broadcast z różnymi danymi dla admina i uczestników.
   */
  private broadcastToRoomSplit(
    room: GameRoom,
    type: SSEEventType,
    data: { admin: unknown; participant: unknown }
  ): void {
    const clients = this.getSSEClients(room.code)
    for (const client of clients) {
      if (client.participantId) {
        this.sendToClient(client, type, data.participant)
      } else {
        this.sendToClient(client, type, data.admin)
      }
    }
  }

  private broadcastAnswerCount(room: GameRoom): void {
    const qi = room.currentQuestionIndex
    const questionAnswers = room.answers.get(qi) ?? new Map()

    const data = {
      answeredCount: questionAnswers.size,
      totalParticipants: room.participants.size,
    }

    // Tylko admin widzi liczbę odpowiedzi
    const clients = this.getSSEClients(room.code)
    for (const client of clients) {
      if (!client.participantId) {
        this.sendToClient(client, "answer-count", data)
      }
    }
  }

  /**
   * Wysyła pełny stan pokoju do konkretnego klienta SSE
   * (używane przy pierwszym połączeniu)
   */
  sendInitialState(client: SSEClient): void {
    const room = this.rooms.get(client.roomCode)
    if (!room) return

    const isAdmin = !client.participantId

    const baseState = {
      code: room.code,
      phase: room.phase,
      quizName: room.quiz.name,
      participants: this.getPublicParticipants(room),
      participantCount: room.participants.size,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.quiz.questions.length,
    }

    if (room.phase === "lobby") {
      this.sendToClient(client, "room-state", baseState)
      return
    }

    if (room.phase === "question") {
      const qi = room.currentQuestionIndex
      const question = room.quiz.questions[qi]
      const questionAnswers = room.answers.get(qi) ?? new Map()

      if (isAdmin) {
        this.sendToClient(client, "room-state", {
          ...baseState,
          question: {
            index: qi,
            totalQuestions: room.quiz.questions.length,
            text: question.text,
            answers: question.answers,
            timeLimit: question.timeLimit,
            questionStartedAt: room.questionStartedAt,
            questionEndsAt: room.questionEndsAt,
            answeredCount: questionAnswers.size,
            totalParticipants: room.participants.size,
          } satisfies PublicQuestionAdmin,
        })
      } else {
        const hasAnswered = client.participantId
          ? questionAnswers.has(client.participantId)
          : false
        this.sendToClient(client, "room-state", {
          ...baseState,
          question: {
            index: qi,
            totalQuestions: room.quiz.questions.length,
            timeLimit: question.timeLimit,
            questionStartedAt: room.questionStartedAt,
            questionEndsAt: room.questionEndsAt,
          } satisfies PublicQuestionParticipant,
          hasAnswered,
        })
      }
      return
    }

    if (room.phase === "leaderboard" || room.phase === "finished") {
      const leaderboard = this.buildLeaderboard(room)
      this.sendToClient(client, "room-state", {
        ...baseState,
        leaderboard,
      })
      return
    }

    // reveal - wysyłamy baseState, reveal event przyjdzie osobno
    this.sendToClient(client, "room-state", baseState)
  }

  // ----------------------------------------------------------
  // Cleanup
  // ----------------------------------------------------------

  private startCleanupInterval(): void {
    // Czyść pokoje starsze niż 2h
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now()
        const twoHoursAgo = now - 2 * 60 * 60 * 1000

        for (const [code, room] of this.rooms.entries()) {
          if (room.createdAt < twoHoursAgo) {
            // Wyczyść timer
            if (room.timerHandle) {
              clearTimeout(room.timerHandle)
            }
            // Zamknij SSE connections
            const clients = this.sseClients.get(code)
            if (clients) {
              for (const client of clients) {
                try {
                  client.writer.close().catch(() => {})
                } catch {
                  // ignore
                }
              }
            }
            this.rooms.delete(code)
            this.sseClients.delete(code)
            this.previousRanks.delete(code)
          }
        }
      },
      10 * 60 * 1000
    ) // co 10 min
  }

  /** Lista aktywnych pokoi (dla panelu admina) */
  listActiveRooms(): RoomPublicInfo[] {
    return Array.from(this.rooms.values())
      .filter((r) => r.phase !== "finished")
      .map((r) => ({
        code: r.code,
        quizName: r.quiz.name,
        phase: r.phase,
        participantCount: r.participants.size,
        currentQuestionIndex: r.currentQuestionIndex,
        totalQuestions: r.quiz.questions.length,
      }))
  }
}

// ============================================================
// Singleton export
// ============================================================

const globalForEngine = globalThis as unknown as {
  gameEngine: GameEngine | undefined
}

export const gameEngine =
  globalForEngine.gameEngine ?? new GameEngine()

if (process.env.NODE_ENV !== "production") {
  globalForEngine.gameEngine = gameEngine
}
