import { describe, expect, it } from 'vitest'
import { aimVector } from '../src/game/systems/input'

describe('aimVector', () => {
  it('normalizes diagonal aim input', () => {
    expect(aimVector(1, -1)).toEqual({ x: Math.SQRT1_2, y: -Math.SQRT1_2 })
  })

  it('keeps a zero aim vector stable', () => {
    expect(aimVector(0, 0)).toEqual({ x: 0, y: 0 })
  })
})
