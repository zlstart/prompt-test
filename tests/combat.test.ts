import { describe, expect, it } from 'vitest'
import { projectileAngles, scoreForKill } from '../src/game/systems/combat'

describe('projectileAngles', () => {
  it('fires three symmetric spread shots', () => {
    expect(projectileAngles('spread', 0)).toEqual([-0.18, 0, 0.18])
  })

  it('keeps pulse and rifle fire on the requested heading', () => {
    expect(projectileAngles('pulse', 1.25)).toEqual([1.25])
    expect(projectileAngles('rifle', -0.5)).toEqual([-0.5])
  })
})

describe('scoreForKill', () => {
  it('rewards continued combos but caps the multiplier', () => {
    expect(scoreForKill(100, 0)).toBe(100)
    expect(scoreForKill(100, 8)).toBe(300)
    expect(scoreForKill(100, 30)).toBe(400)
  })
})
