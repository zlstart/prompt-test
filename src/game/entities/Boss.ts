import Phaser from 'phaser'
import { nextBossPhase } from './rules'

export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly maxHealth = 72
  health = this.maxHealth
  lastShot = 0
  activeFight = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'entities', 'boss')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setScale(0.28).setDepth(18).setFlipX(true)
    this.setBodySize(500, 520).setOffset(120, 80)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setImmovable(true)
  }

  phase() {
    return nextBossPhase(this.health, this.maxHealth)
  }

  shouldFire(now: number) {
    const cooldown = this.phase() === 1 ? 900 : this.phase() === 2 ? 650 : 430
    if (!this.activeFight || now - this.lastShot < cooldown) return false
    this.lastShot = now
    return true
  }
}
