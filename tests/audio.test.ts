import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioEngine } from '../src/game/systems/audio'

describe('AudioEngine', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not create an AudioContext before explicit activation', () => {
    const Context = vi.fn()
    vi.stubGlobal('AudioContext', Context)
    new AudioEngine()
    expect(Context).not.toHaveBeenCalled()
  })

  it('does not create tones while muted', async () => {
    const start = vi.fn()
    const context = {
      state: 'running',
      currentTime: 0,
      destination: {},
      resume: vi.fn(),
      createOscillator: () => ({
        type: 'square',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start,
        stop: vi.fn(),
      }),
      createGain: () => ({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      }),
    }
    vi.stubGlobal('AudioContext', vi.fn(() => context))

    const audio = new AudioEngine()
    await audio.activate()
    audio.setMuted(true)
    audio.shoot('rifle')

    expect(start).not.toHaveBeenCalled()
  })
})
