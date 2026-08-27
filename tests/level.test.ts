import { describe, expect, it } from 'vitest'
import { latestCheckpoint } from '../src/game/level'

describe('latestCheckpoint', () => {
  it('returns the most recent safe checkpoint behind the player', () => {
    expect(latestCheckpoint(3400)).toMatchObject({ id: 'outpost', x: 2780 })
  })

  it('returns insertion before the outpost checkpoint', () => {
    expect(latestCheckpoint(1200)).toMatchObject({ id: 'insertion', x: 180 })
  })
})
