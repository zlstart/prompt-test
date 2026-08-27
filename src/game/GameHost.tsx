import { useEffect, useRef } from 'react'
import { createGame } from './config'

export function GameHost() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!host.current) return
    const game = createGame(host.current)
    return () => game.destroy(true)
  }, [])

  return <div className="game-host" ref={host} aria-label="游戏画布" />
}
