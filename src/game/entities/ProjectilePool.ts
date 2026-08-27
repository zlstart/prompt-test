import Phaser from 'phaser'

export interface ProjectileOptions {
  x: number
  y: number
  angle: number
  speed: number
  damage: number
  friendly: boolean
  frame?: string
  scale?: number
  piercing?: boolean
}

export class ProjectilePool {
  readonly group: Phaser.Physics.Arcade.Group

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.group({ maxSize: 80, runChildUpdate: false })
  }

  fire(options: ProjectileOptions) {
    const projectile = this.group.get(options.x, options.y, 'effects', options.frame ?? 'muzzle') as Phaser.Physics.Arcade.Sprite | null
    if (!projectile) return null
    projectile
      .setActive(true)
      .setVisible(true)
      .setDepth(22)
      .setScale(options.scale ?? 0.045)
      .setRotation(options.angle)
      .setDataEnabled()
      .setData('damage', options.damage)
      .setData('friendly', options.friendly)
      .setData('piercing', options.piercing ?? false)
      .setData('bornAt', this.scene.time.now)
    const body = projectile.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setSize(projectile.width * 0.45, projectile.height * 0.32)
    this.scene.physics.velocityFromRotation(options.angle, options.speed, body.velocity)
    return projectile
  }

  update(now: number) {
    this.group.children.each((entry) => {
      const projectile = entry as Phaser.Physics.Arcade.Sprite
      if (projectile.active && now - Number(projectile.getData('bornAt')) > 2400) this.release(projectile)
      return true
    })
  }

  release(projectile: Phaser.Physics.Arcade.Sprite) {
    projectile.disableBody(true, true)
  }
}
