import type { WeaponKind } from '../state'

export interface WeaponSpec {
  cooldownMs: number
  speed: number
  damage: number
  scale: number
  piercing: boolean
}

export const WEAPONS: Record<WeaponKind, WeaponSpec> = {
  rifle: { cooldownMs: 150, speed: 760, damage: 1, scale: 0.055, piercing: false },
  spread: { cooldownMs: 330, speed: 660, damage: 1, scale: 0.052, piercing: false },
  pulse: { cooldownMs: 500, speed: 560, damage: 3, scale: 0.12, piercing: true },
}

export function projectileAngles(weapon: WeaponKind, heading: number) {
  return weapon === 'spread' ? [heading - 0.18, heading, heading + 0.18] : [heading]
}

export function scoreForKill(base: number, combo: number) {
  const multiplier = 1 + Math.min(3, Math.floor(combo / 4))
  return base * multiplier
}
