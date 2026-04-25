import { useState, useEffect } from 'react'
import type { BridgeStatus } from '../types'

export function useAnalysis() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({ status: 'starting' })

  useEffect(() => {
    const unsub = window.api.onBridgeStatus((status: BridgeStatus) => {
      setBridgeStatus(status)
    })
    return unsub
  }, [])

  const analyzeOne = async (id: string) => {
    await window.api.songs.analyze(id)
  }

  const analyzeAll = async () => {
    await window.api.songs.analyzeAll()
  }

  return { bridgeStatus, analyzeOne, analyzeAll }
}
