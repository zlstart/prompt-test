import type { GameCommand, GameSnapshot } from './state'

type SnapshotListener = (snapshot: Partial<GameSnapshot>) => void
type CommandListener = (command: GameCommand) => void

class GameEventBus {
  private readonly snapshotListeners = new Set<SnapshotListener>()
  private readonly commandListeners = new Set<CommandListener>()

  emitSnapshot(snapshot: Partial<GameSnapshot>) {
    this.snapshotListeners.forEach((listener) => listener(snapshot))
  }

  emitCommand(command: GameCommand) {
    this.commandListeners.forEach((listener) => listener(command))
  }

  onSnapshot(listener: SnapshotListener) {
    this.snapshotListeners.add(listener)
    return () => {
      this.snapshotListeners.delete(listener)
    }
  }

  onCommand(listener: CommandListener) {
    this.commandListeners.add(listener)
    return () => {
      this.commandListeners.delete(listener)
    }
  }
}

export const gameEvents = new GameEventBus()
