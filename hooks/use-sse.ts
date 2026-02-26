"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { SSEEvent, SSEEventType } from "@/lib/quiz-types"

interface UseSSEOptions {
  /** URL endpointu SSE */
  url: string | null
  /** Callback wywoływany przy każdym evencie */
  onEvent: (event: SSEEvent) => void
  /** Czy połączenie jest aktywne */
  enabled?: boolean
}

interface UseSSEReturn {
  /** Czy jest połączony */
  connected: boolean
  /** Błąd połączenia */
  error: string | null
  /** Wymuś reconnect */
  reconnect: () => void
}

/**
 * Hook do Server-Sent Events z automatycznym reconnectem.
 * 
 * EventSource automatycznie reconnectuje po utracie połączenia.
 * Hook obsługuje lifecycle, cleanup i error handling.
 */
export function useSSE({
  url,
  onEvent,
  enabled = true,
}: UseSSEOptions): UseSSEReturn {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const onEventRef = useRef(onEvent)
  const reconnectCountRef = useRef(0)
  const maxReconnects = 10

  // Zawsze aktualizuj ref callbacka (unika stale closure)
  onEventRef.current = onEvent

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!url || !enabled) return

    cleanup()
    setError(null)

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
      setError(null)
      reconnectCountRef.current = 0
    }

    es.onerror = () => {
      setConnected(false)

      // EventSource auto-reconnects, ale limitujemy próby
      if (reconnectCountRef.current >= maxReconnects) {
        setError("Utracono połączenie z serwerem")
        es.close()
        eventSourceRef.current = null
      }
      reconnectCountRef.current++
    }

    // Nasłuchuj na custom event types
    const eventTypes: SSEEventType[] = [
      "room-state",
      "participant-joined",
      "question-start",
      "answer-count",
      "question-end",
      "reveal",
      "leaderboard",
      "game-finished",
      "ping",
    ]

    for (const type of eventTypes) {
      es.addEventListener(type, (event: MessageEvent) => {
        try {
          const parsed: SSEEvent = JSON.parse(event.data)
          onEventRef.current(parsed)
        } catch {
          // Ignore malformed events
        }
      })
    }
  }, [url, enabled, cleanup])

  useEffect(() => {
    connect()
    return cleanup
  }, [connect, cleanup])

  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0
    connect()
  }, [connect])

  return { connected, error, reconnect }
}
