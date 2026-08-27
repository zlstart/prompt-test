import Phaser from 'phaser'
import type { InputFrame } from '../systems/input'
import type { WeaponKind } from '../state'

export class Player extends Phaser.Physics.Arcade.Sprite {
  health = 3
  weapon: WeaponKind = 'rifle'
  facing: -1 | 1 = 1
  invulnerableUntil = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'entities', 'hero')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setScale(0.25)
    this.setDepth(20)
    this.setCollideWorldBounds(true)
    this.setBodySize(155, 350).setOffset(84, 28)
    this.setMaxVelocity(270, 900)
  }

  applyInput(input: InputFrame, jumpTriggered: boolean) {
    const body = this.body as Phaser.Physics.Arcade.Body
    this.setVelocityX(input.moveX * 245)
    if (input.moveX !== 0) this.facing = input.moveX
    this.setFlipX(this.facing < 0)

    if (jumpTriggered && body.blocked.down) this.setVelocityY(-500)
    const crouching = input.crouch && body.blocked.down
    this.setScale(0.25, crouching ? 0.19 : 0.25)
    this.setAlpha(this.scene.time.now < this.invulnerableUntil && Math.floor(this.scene.time.now / 80) % 2 === 0 ? 0.32 : 1)
  }

  muzzlePosition() {
    return {
      x: this.x + this.facing * 44,
      y: this.y - 16,
    }
  }

  resetLoadout(x: number, y: number) {
    this.health = 3
    this.weapon = 'rifle'
    this.invulnerableUntil = 0
    this.setPosition(x, y).setVelocity(0, 0).setAlpha(1)
  }
}
