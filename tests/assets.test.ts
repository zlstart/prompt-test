import { describe, expect, it } from 'vitest'
import { assetManifest } from '../src/assets/manifest'

describe('asset manifest', () => {
  it('exposes the approved concept-derived production assets', () => {
    expect(Object.keys(assetManifest)).toEqual([
      'missionPanorama',
      'entityAtlas',
      'effectsAtlas',
    ])
    expect(Object.values(assetManifest).every((path) => path.endsWith('.webp'))).toBe(true)
  })
})
