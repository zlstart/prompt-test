export type WeaponKind = 'rifle' | 'spread' | 'pulse'
export type GameStatus = 'title' | 'loading' | 'playing' | 'paused' | 'victory' | 'defeat'

export interface GameSnapshot {
  status: GameStatus
  health: number
  maxHealth: number
  weapon: WeaponKind
  score: number
  combo: number
  bossHealth: number | null
  bossMaxHealth: number | null
  elapsedMs: number
  checkpoint: string
}

export const initialSnapshot: GameSnapshot = {
  status: 'title',
  health: 3,
  maxHealth: 3,
  weapon: 'rifle',
  score: 0,
  combo: 0,
  bossHealth: null,
  bossMaxHealth: null,
  elapsedMs: 0,
  checkpoint: 'INSERTION',
}

export type GameCommand = 'start' | 'pause' | 'resume' | 'restart' | 'title'

export type GameEvent =
  | { type: 'snapshot'; payload: Partial<GameSnapshot> }
  | { type: 'command'; payload: GameCommand }

export function reduceGameEvent(state: GameSnapshot, event: GameEvent): GameSnapshot {
  return event.type === 'snapshot' ? { ...state, ...event.payload } : state
}
