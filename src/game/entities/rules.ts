import type { WeaponKind } from '../state'

export function nextBossPhase(health: number, maxHealth: number): 1 | 2 | 3 {
  const ratio = maxHealth > 0 ? health / maxHealth : 0
  return ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3
}

export function takePlayerDamage(state: { health: number; weapon: WeaponKind }) {
  return {
    health: Math.max(0, state.health - 1),
    weapon: 'rifle' as const,
  }
}
