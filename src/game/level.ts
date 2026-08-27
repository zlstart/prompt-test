export const WORLD_WIDTH = 5200
export const WORLD_HEIGHT = 720

export interface Checkpoint {
  id: 'insertion' | 'outpost'
  label: string
  x: number
  y: number
}

export interface PlatformData {
  x: number
  y: number
  width: number
  height: number
}

export interface EnemySpawn {
  x: number
  y: number
  kind: 'soldier' | 'drone' | 'charger' | 'turret'
}

export const LEVEL = {
  checkpoints: [
    { id: 'insertion', label: 'INSERTION', x: 180, y: 560 },
    { id: 'outpost', label: 'OUTPOST', x: 2780, y: 560 },
  ] satisfies Checkpoint[],
  platforms: [
    { x: 0, y: 646, width: 5200, height: 74 },
    { x: 720, y: 510, width: 420, height: 24 },
    { x: 1380, y: 440, width: 360, height: 24 },
    { x: 2040, y: 520, width: 440, height: 24 },
    { x: 2900, y: 470, width: 420, height: 24 },
    { x: 3520, y: 410, width: 360, height: 24 },
    { x: 4200, y: 500, width: 360, height: 24 },
  ] satisfies PlatformData[],
  enemies: [
    { x: 850, y: 440, kind: 'soldier' },
    { x: 1220, y: 310, kind: 'drone' },
    { x: 1600, y: 580, kind: 'charger' },
    { x: 2180, y: 470, kind: 'turret' },
    { x: 2460, y: 580, kind: 'soldier' },
    { x: 3050, y: 400, kind: 'soldier' },
    { x: 3370, y: 300, kind: 'drone' },
    { x: 3820, y: 580, kind: 'charger' },
    { x: 4310, y: 430, kind: 'turret' },
  ] satisfies EnemySpawn[],
  bossX: 4830,
} as const

export function latestCheckpoint(playerX: number) {
  return [...LEVEL.checkpoints].reverse().find((checkpoint) => checkpoint.x <= playerX) ?? LEVEL.checkpoints[0]
}
