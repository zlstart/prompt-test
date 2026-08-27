import { describe, expect, it } from 'vitest'
import { nextBossPhase, takePlayerDamage } from '../src/game/entities/rules'

describe('entity rules', () => {
  it('advances boss phases at the expected health thresholds', () => {
    expect(nextBossPhase(100, 100)).toBe(1)
    expect(nextBossPhase(65, 100)).toBe(2)
    expect(nextBossPhase(32, 100)).toBe(3)
  })

  it('downgrades powered weapons when the player is hit', () => {
    expect(takePlayerDamage({ health: 3, weapon: 'spread' })).toEqual({ health: 2, weapon: 'rifle' })
  })

  it('never reduces health below zero', () => {
    expect(takePlayerDamage({ health: 0, weapon: 'rifle' })).toEqual({ health: 0, weapon: 'rifle' })
  })
})
