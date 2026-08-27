import type { PointerEvent as ReactPointerEvent } from 'react'
import { setTouchInput, type TouchInputState } from '../game/systems/input'

function TouchButton({ input, label, children, className = '' }: {
  input: keyof TouchInputState
  label: string
  children: React.ReactNode
  className?: string
}) {
  const update = (value: boolean) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setTouchInput(input, value)
    if (value) event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  return (
    <button
      className={`touch-button ${className}`}
      aria-label={label}
      onPointerDown={update(true)}
      onPointerUp={update(false)}
      onPointerCancel={update(false)}
      onPointerLeave={update(false)}
    >
      {children}
    </button>
  )
}

export function TouchControls() {
  return (
    <div className="touch-controls" aria-label="触屏控制">
      <div className="touch-pad">
        <TouchButton input="up" label="向上瞄准" className="touch-button--up">↑</TouchButton>
        <TouchButton input="left" label="向左移动" className="touch-button--left">←</TouchButton>
        <TouchButton input="down" label="向下移动" className="touch-button--down">↓</TouchButton>
        <TouchButton input="right" label="向右移动" className="touch-button--right">→</TouchButton>
      </div>
      <div className="touch-actions">
        <TouchButton input="jump" label="跳跃" className="touch-button--jump">JUMP</TouchButton>
        <TouchButton input="shoot" label="射击" className="touch-button--shoot">FIRE</TouchButton>
      </div>
    </div>
  )
}
