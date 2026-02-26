import { gameEngine } from "@/lib/game-engine"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const url = new URL(request.url)
  const participantId = url.searchParams.get("participantId")
  const adminSecret = url.searchParams.get("adminSecret")

  // Walidacja pokoju
  const room = gameEngine.getRoom(code)
  if (!room) {
    return new Response("Pokój nie istnieje", { status: 404 })
  }

  // Walidacja uprawnień
  const isAdmin = adminSecret
    ? gameEngine.validateAdminSecret(code, adminSecret)
    : false

  if (!isAdmin && !participantId) {
    return new Response("Brak identyfikatora uczestnika", { status: 400 })
  }

  if (participantId && !room.participants.has(participantId)) {
    return new Response("Uczestnik nie należy do tego pokoju", {
      status: 403,
    })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const writable = new WritableStream<Uint8Array>({
        write(chunk) {
          try {
            controller.enqueue(chunk)
          } catch {
            // Stream closed
          }
        },
        close() {
          try {
            controller.close()
          } catch {
            // Already closed
          }
        },
      })

      const writer = writable.getWriter()

      // Rejestruj klienta SSE
      const client = gameEngine.addSSEClient(
        code,
        writer,
        isAdmin ? null : participantId
      )

      // Wyślij initial state
      gameEngine.sendInitialState(client)

      // Keep-alive ping co 15 sekund
      const pingInterval = setInterval(() => {
        try {
          const ping = encoder.encode(
            `: ping ${Date.now()}\n\n`
          )
          writer.write(ping).catch(() => {
            clearInterval(pingInterval)
            gameEngine.removeSSEClient(client)
          })
        } catch {
          clearInterval(pingInterval)
          gameEngine.removeSSEClient(client)
        }
      }, 15000)

      // Cleanup na abort
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval)
        gameEngine.removeSSEClient(client)
        try {
          writer.close().catch(() => {})
        } catch {
          // ignore
        }
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
