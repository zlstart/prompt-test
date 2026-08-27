import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { gameEvents } from '../src/game/events'
import { clearTouchInput, touchInput } from '../src/game/systems/input'
import { initialSnapshot } from '../src/game/state'
import { Overlay } from '../src/ui/Overlay'
import { TouchControls } from '../src/ui/TouchControls'

afterEach(() => clearTouchInput())

describe('Overlay', () => {
  it('emits the start command from the title screen', () => {
    let received = ''
    const unsubscribe = gameEvents.onCommand((command) => {
      received = command
    })

    render(<Overlay snapshot={initialSnapshot} muted={false} onToggleMute={() => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: '开始任务' }))

    expect(received).toBe('start')
    unsubscribe()
  })
})

describe('TouchControls', () => {
  it('holds and releases directional input', () => {
    render(<TouchControls />)
    const right = screen.getByRole('button', { name: '向右移动' })

    fireEvent.pointerDown(right)
    expect(touchInput.right).toBe(true)
    fireEvent.pointerUp(right)
    expect(touchInput.right).toBe(false)
  })
})
