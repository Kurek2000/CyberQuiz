"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UseGameTimerOptions {
  /** Timestamp (ms) kiedy pytanie się kończy */
  endsAt: number | null
  /** Callback wywoływany gdy timer osiągnie 0 */
  onTimeUp?: () => void
}

interface UseGameTimerReturn {
  /** Pozostały czas w sekundach (zaokrąglony w górę) */
  secondsLeft: number
  /** Ułamek 0-1 postępu (1 = pełny czas, 0 = koniec) */
  progress: number
  /** Czy czas minął */
  isExpired: boolean
  /** Totalny czas pytania w sekundach */
  totalSeconds: number
}

/**
 * Hook do countdown'u opartego na requestAnimationFrame.
 * Używa server timestamp (endsAt) zamiast lokalnego timera - 
 * eliminuje problemy z synchronizacją.
 */
export function useGameTimer({
  endsAt,
  onTimeUp,
}: UseGameTimerOptions): UseGameTimerReturn {
  const [state, setState] = useState<{
    secondsLeft: number
    progress: number
    isExpired: boolean
  }>({
    secondsLeft: 0,
    progress: 0,
    isExpired: true,
  })

  const startedAtRef = useRef<number | null>(null)
  const totalMsRef = useRef(0)
  const onTimeUpRef = useRef(onTimeUp)
  const firedRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  onTimeUpRef.current = onTimeUp

  // Zapamiętaj moment startu
  useEffect(() => {
    if (endsAt) {
      const now = Date.now()
      startedAtRef.current = now
      totalMsRef.current = Math.max(0, endsAt - now)
      firedRef.current = false
    } else {
      startedAtRef.current = null
      totalMsRef.current = 0
    }
  }, [endsAt])

  const tick = useCallback(() => {
    if (!endsAt) {
      setState({ secondsLeft: 0, progress: 0, isExpired: true })
      return
    }

    const now = Date.now()
    const remainingMs = Math.max(0, endsAt - now)
    const secondsLeft = Math.ceil(remainingMs / 1000)
    const totalMs = totalMsRef.current
    const progress = totalMs > 0 ? remainingMs / totalMs : 0
    const isExpired = remainingMs <= 0

    setState({ secondsLeft, progress, isExpired })

    if (isExpired && !firedRef.current) {
      firedRef.current = true
      onTimeUpRef.current?.()
    }

    if (!isExpired) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [endsAt])

  useEffect(() => {
    if (!endsAt) {
      setState({ secondsLeft: 0, progress: 0, isExpired: true })
      return
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [endsAt, tick])

  return {
    ...state,
    totalSeconds: Math.ceil(totalMsRef.current / 1000),
  }
}
