import Phaser from 'phaser'

export type EnemyKind = 'soldier' | 'drone' | 'charger' | 'turret'

const frameForKind: Record<EnemyKind, string> = {
  soldier: 'soldier',
  drone: 'drone',
  charger: 'charger',
  turret: 'turret',
}

const scaleForKind: Record<EnemyKind, number> = {
  soldier: 0.19,
  drone: 0.16,
  charger: 0.19,
  turret: 0.17,
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: EnemyKind
  health: number
  lastShot = 0
  readonly originY: number
  scoreValue: number

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
    super(scene, x, y, 'entities', frameForKind[kind])
    this.kind = kind
    this.health = kind === 'turret' ? 5 : kind === 'charger' ? 3 : 2
    this.scoreValue = kind === 'turret' ? 500 : kind === 'drone' ? 300 : 200
    this.originY = y
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setScale(scaleForKind[kind]).setDepth(16)
    this.setCollideWorldBounds(true)
    this.setBodySize(this.width * 0.55, this.height * 0.75)
    if (kind === 'turret' || kind === 'drone') {
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false)
      if (kind === 'turret') body.setImmovable(true)
    }
  }

  tick(player: Phaser.Physics.Arcade.Sprite, now: number) {
    const distance = player.x - this.x
    this.setFlipX(distance < 0)
    if (Math.abs(distance) > 850) {
      if (this.kind !== 'drone') this.setVelocityX(0)
      return false
    }

    if (this.kind === 'soldier') this.setVelocityX(Math.sign(distance) * 58)
    if (this.kind === 'charger') this.setVelocityX(Math.sign(distance) * 135)
    if (this.kind === 'drone') {
      this.setVelocityX(Math.sign(distance) * 34)
      this.y = this.originY + Math.sin(now * 0.003 + this.x) * 28
    }

    const cooldown = this.kind === 'turret' ? 1150 : this.kind === 'drone' ? 1500 : 1900
    if (this.kind !== 'charger' && now - this.lastShot > cooldown) {
      this.lastShot = now
      return true
    }
    return false
  }
}
