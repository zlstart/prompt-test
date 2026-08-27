import { useEffect, useState } from 'react'
import { GameHost } from './game/GameHost'
import { gameEvents } from './game/events'
import { audioEngine } from './game/systems/audio'
import { initialSnapshot, reduceGameEvent } from './game/state'
import { Hud } from './ui/Hud'
import { Overlay } from './ui/Overlay'
import { TouchControls } from './ui/TouchControls'
import './styles.css'

export default function App() {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [muted, setMuted] = useState(false)

  useEffect(() => gameEvents.onSnapshot((payload) => {
    setSnapshot((current) => reduceGameEvent(current, { type: 'snapshot', payload }))
  }), [])

  const toggleMute = () => {
    setMuted((current) => {
      audioEngine.setMuted(!current)
      return !current
    })
  }

  return (
    <main className="app-shell" data-game-status={snapshot.status}>
      <div className="game-frame">
        <div className="frame-corner frame-corner--tl" />
        <div className="frame-corner frame-corner--tr" />
        <div className="frame-corner frame-corner--bl" />
        <div className="frame-corner frame-corner--br" />
        <GameHost />
        {snapshot.status !== 'title' && snapshot.status !== 'loading' && <Hud snapshot={snapshot} />}
        <Overlay snapshot={snapshot} muted={muted} onToggleMute={toggleMute} />
        {snapshot.status === 'playing' && <TouchControls />}
      </div>
      <footer className="mission-footer">
        <span>N-13 // JUNGLE GRID</span>
        <span>{snapshot.checkpoint}</span>
        <span>ESC 暂停 · R 重开</span>
      </footer>
    </main>
  )
}
