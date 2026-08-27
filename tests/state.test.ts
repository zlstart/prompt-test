import { describe, expect, it } from 'vitest'
import { initialSnapshot, reduceGameEvent } from '../src/game/state'

describe('reduceGameEvent', () => {
  it('merges a game snapshot without mutating the previous state', () => {
    const next = reduceGameEvent(initialSnapshot, {
      type: 'snapshot',
      payload: { score: 900, weapon: 'spread', health: 2, bossHealth: 70, bossMaxHealth: 100 },
    })

    expect(next).toMatchObject({ score: 900, weapon: 'spread', health: 2, bossHealth: 70 })
    expect(initialSnapshot.score).toBe(0)
  })
})
