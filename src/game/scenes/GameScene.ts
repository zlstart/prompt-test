import Phaser from 'phaser'
import { audioEngine } from '../systems/audio'
import { WEAPONS, projectileAngles, scoreForKill } from '../systems/combat'
import { aimVector, touchInput, type InputFrame } from '../systems/input'
import { gameEvents } from '../events'
import { LEVEL, WORLD_HEIGHT, WORLD_WIDTH, latestCheckpoint } from '../level'
import type { GameCommand, GameStatus, WeaponKind } from '../state'
import { Boss } from '../entities/Boss'
import { Enemy } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { ProjectilePool } from '../entities/ProjectilePool'

interface SceneData { autoStart?: boolean }
type DebugWindow = Window & {
  __NEON_DEBUG__?: {
    enterBossFinalHit(): void
    enterEnemyFinalHit(): void
  }
}

export class GameScene extends Phaser.Scene {
  private player!: Player
  private boss!: Boss
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private enemies!: Phaser.Physics.Arcade.Group
  private pickups!: Phaser.Physics.Arcade.Group
  private playerShots!: ProjectilePool
  private hostileShots!: ProjectilePool
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private status: GameStatus = 'title'
  private score = 0
  private combo = 0
  private maxCombo = 0
  private lastShot = 0
  private lastJump = false
  private lastSnapshot = 0
  private checkpointX = LEVEL.checkpoints[0].x
  private checkpointY = LEVEL.checkpoints[0].y
  private startedAt = 0
  private autoStart = false
  private commandCleanup?: () => void

  constructor() {
    super('game')
  }

  init(data: SceneData) {
    this.autoStart = Boolean(data?.autoStart)
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.createEnvironment()
    this.createActors()
    this.createCollisions()
    this.bindInput()
    this.commandCleanup = gameEvents.onCommand((command) => this.handleCommand(command))
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.commandCleanup?.()
      delete (window as DebugWindow).__NEON_DEBUG__
    })

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, -180, 20)
    this.cameras.main.setDeadzone(260, 160)
    this.cameras.main.fadeIn(500, 3, 9, 20)

    if (import.meta.env.DEV) {
      ;(window as DebugWindow).__NEON_DEBUG__ = {
        enterBossFinalHit: () => {
          this.player.setPosition(this.boss.x - 250, this.boss.y).setVelocity(0, 0)
          this.player.facing = 1
          this.player.setFlipX(false)
          this.boss.health = 1
          this.boss.activeFight = true
          this.cameras.main.centerOn(this.player.x, this.player.y)
          this.emitSnapshot(true)
        },
        enterEnemyFinalHit: () => {
          const enemy = this.enemies.getChildren().find((entry) => (entry as Enemy).active) as Enemy | undefined
          if (!enemy) return
          enemy.health = 1
          enemy.setVelocity(0, 0)
          this.player.setPosition(enemy.x - 170, enemy.y + 16).setVelocity(0, 0)
          this.player.facing = 1
          this.player.setFlipX(false)
          this.cameras.main.centerOn(this.player.x, this.player.y)
        },
      }
    }

    if (this.autoStart) this.beginMission()
    else {
      this.status = 'title'
      this.physics.world.pause()
      this.emitSnapshot(true)
    }
  }

  update(time: number) {
    if (this.status !== 'playing') return
    const input = this.readInput()
    const jumpTriggered = input.jumpPressed && !this.lastJump
    this.lastJump = input.jumpPressed
    this.player.applyInput(input, jumpTriggered)
    if (jumpTriggered) audioEngine.jump()
    if (input.shootHeld) this.firePlayerWeapon(time, input)

    this.enemies.children.each((entry) => {
      const enemy = entry as Enemy
      if (!enemy.active) return true
      if (enemy.tick(this.player, time)) this.fireHostile(enemy.x, enemy.y - 10, 390)
      return true
    })

    if (this.player.x > 4380 && !this.boss.activeFight) {
      this.boss.activeFight = true
      this.cameras.main.flash(350, 110, 30, 150)
    }
    if (this.boss.shouldFire(time)) this.fireBossPattern()

    this.playerShots.update(time)
    this.hostileShots.update(time)
    this.checkCheckpoint()
    if (this.player.y > WORLD_HEIGHT - 4) this.damagePlayer(true)
    this.emitSnapshot()
  }

  private createEnvironment() {
    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'mission-panorama')
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setScrollFactor(0.88, 1)
      .setDepth(-10)

    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT - 20, WORLD_WIDTH, 90, 0x02070c, 0.42).setDepth(1)
    for (let i = 0; i < 70; i += 1) {
      const mote = this.add.circle(Phaser.Math.Between(0, WORLD_WIDTH), Phaser.Math.Between(80, 610), Phaser.Math.Between(1, 3), 0x39e6ff, Phaser.Math.FloatBetween(0.08, 0.28))
      mote.setDepth(2)
      this.tweens.add({ targets: mote, y: mote.y - Phaser.Math.Between(40, 110), alpha: 0, duration: Phaser.Math.Between(2400, 5200), repeat: -1, delay: Phaser.Math.Between(0, 3000) })
    }

    this.platforms = this.physics.add.staticGroup()
    LEVEL.platforms.forEach((data, index) => {
      const platform = this.add.rectangle(data.x + data.width / 2, data.y + data.height / 2, data.width, data.height, index === 0 ? 0x061017 : 0x0a1a22, index === 0 ? 0.5 : 0.92)
        .setStrokeStyle(2, data.x > 3600 ? 0xc12cff : 0x28d8c4, index === 0 ? 0.32 : 0.72)
        .setDepth(8)
      this.physics.add.existing(platform, true)
      this.platforms.add(platform)
    })
  }

  private createActors() {
    this.player = new Player(this, LEVEL.checkpoints[0].x, LEVEL.checkpoints[0].y)
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: false })
    LEVEL.enemies.forEach((spawn) => this.enemies.add(new Enemy(this, spawn.x, spawn.y, spawn.kind)))
    this.boss = new Boss(this, LEVEL.bossX, 515)

    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true })
    const spread = this.physics.add.sprite(1900, 390, 'entities', 'spread-pickup').setScale(0.17).setData('weapon', 'spread')
    const pulse = this.physics.add.sprite(3350, 350, 'entities', 'pulse-pickup').setScale(0.17).setData('weapon', 'pulse')
    this.pickups.addMultiple([spread, pulse])
    this.tweens.add({ targets: [spread, pulse], y: '-=18', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' })

    const checkpoint = this.add.image(LEVEL.checkpoints[1].x, 552, 'entities', 'checkpoint').setScale(0.22).setDepth(12)
    checkpoint.setData('activated', false)

    this.playerShots = new ProjectilePool(this)
    this.hostileShots = new ProjectilePool(this)
  }

  private createCollisions() {
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.collider(this.playerShots.group, this.platforms, (shot) => this.impactAndRelease(shot as Phaser.Physics.Arcade.Sprite, this.playerShots))
    this.physics.add.collider(this.hostileShots.group, this.platforms, (shot) => this.impactAndRelease(shot as Phaser.Physics.Arcade.Sprite, this.hostileShots))
    this.physics.add.overlap(this.playerShots.group, this.enemies, (shot, target) => this.hitEnemy(shot as Phaser.Physics.Arcade.Sprite, target as Enemy))
    this.physics.add.overlap(this.playerShots.group, this.boss, (first, second) => {
      const shot = first === this.boss ? second : first
      this.hitBoss(shot as Phaser.Physics.Arcade.Sprite)
    })
    this.physics.add.overlap(this.hostileShots.group, this.player, (shot) => {
      this.hostileShots.release(shot as Phaser.Physics.Arcade.Sprite)
      this.damagePlayer(false)
    })
    this.physics.add.overlap(this.player, this.enemies, () => this.damagePlayer(false))
    this.physics.add.overlap(this.player, this.pickups, (_player, pickup) => this.collectPickup(pickup as Phaser.Physics.Arcade.Sprite))
  }

  private bindInput() {
    if (!this.input.keyboard) return
    this.keys = this.input.keyboard.addKeys({
      left: 'A', right: 'D', up: 'W', down: 'S',
      arrowLeft: 'LEFT', arrowRight: 'RIGHT', arrowUp: 'UP', arrowDown: 'DOWN',
      jump: 'K', shift: 'SHIFT', shoot: 'J', space: 'SPACE',
    }) as Record<string, Phaser.Input.Keyboard.Key>
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.status === 'playing') this.pauseMission()
      else if (this.status === 'paused') this.resumeMission()
    })
    this.input.keyboard.on('keydown-R', () => this.handleCommand('restart'))
  }

  private readInput(): InputFrame {
    const active = (name: string) => Boolean(this.keys?.[name]?.isDown)
    const left = active('left') || active('arrowLeft') || touchInput.left
    const right = active('right') || active('arrowRight') || touchInput.right
    const up = active('up') || active('arrowUp') || touchInput.up
    const down = active('down') || active('arrowDown') || touchInput.down
    const moveX = left === right ? 0 : left ? -1 : 1
    return {
      moveX,
      aimX: moveX || this.player.facing,
      aimY: up === down ? 0 : up ? -1 : 1,
      jumpPressed: active('jump') || active('shift') || touchInput.jump,
      shootHeld: active('shoot') || active('space') || touchInput.shoot,
      crouch: down,
    }
  }

  private firePlayerWeapon(now: number, input: InputFrame) {
    const spec = WEAPONS[this.player.weapon]
    if (now - this.lastShot < spec.cooldownMs) return
    this.lastShot = now
    const aim = aimVector(input.aimX || this.player.facing, input.aimY)
    const heading = Math.atan2(aim.y, aim.x)
    const muzzle = this.player.muzzlePosition()
    projectileAngles(this.player.weapon, heading).forEach((angle) => {
      this.playerShots.fire({
        x: muzzle.x, y: muzzle.y, angle, speed: spec.speed, damage: spec.damage,
        friendly: true, frame: this.player.weapon === 'pulse' ? 'pulse-shot' : this.player.weapon === 'spread' ? 'spread-shot' : 'muzzle',
        scale: spec.scale, piercing: spec.piercing,
      })
    })
    this.spawnEffect(muzzle.x, muzzle.y, 'muzzle', 0.05, 120)
    audioEngine.shoot(this.player.weapon)
  }

  private fireHostile(x: number, y: number, speed: number) {
    const angle = Phaser.Math.Angle.Between(x, y, this.player.x, this.player.y - 12)
    this.hostileShots.fire({ x, y, angle, speed, damage: 1, friendly: false, frame: 'impact', scale: 0.038 })
  }

  private fireBossPattern() {
    const phase = this.boss.phase()
    const base = Phaser.Math.Angle.Between(this.boss.x - 60, this.boss.y, this.player.x, this.player.y)
    const offsets = phase === 1 ? [0] : phase === 2 ? [-0.16, 0, 0.16] : [-0.34, -0.17, 0, 0.17, 0.34]
    offsets.forEach((offset) => this.hostileShots.fire({
      x: this.boss.x - 76, y: this.boss.y - 10, angle: base + offset, speed: 360 + phase * 45,
      damage: 1, friendly: false, frame: phase === 3 ? 'shockwave' : 'impact', scale: phase === 3 ? 0.072 : 0.043,
    }))
    if (phase === 3) this.cameras.main.shake(120, 0.003)
  }

  private hitEnemy(shot: Phaser.Physics.Arcade.Sprite, enemy: Enemy) {
    if (!shot.active || !enemy.active) return
    enemy.health -= Number(shot.getData('damage'))
    this.spawnEffect(shot.x, shot.y, 'impact', 0.09, 170)
    if (!shot.getData('piercing')) this.playerShots.release(shot)
    if (enemy.health > 0) return
    enemy.disableBody(true, true)
    this.spawnEffect(enemy.x, enemy.y, 'explosion', enemy.kind === 'turret' ? 0.18 : 0.12, 420)
    audioEngine.explode(enemy.kind === 'turret' ? 1.5 : 1)
    this.combo += 1
    this.maxCombo = Math.max(this.maxCombo, this.combo)
    this.score += scoreForKill(enemy.scoreValue, this.combo)
  }

  private hitBoss(shot: Phaser.Physics.Arcade.Sprite) {
    if (!this.boss.activeFight || !shot.active || this.boss.health <= 0) return
    this.boss.health = Math.max(0, this.boss.health - Number(shot.getData('damage')))
    this.spawnEffect(shot.x, shot.y, 'impact', 0.1, 160)
    if (!shot.getData('piercing')) this.playerShots.release(shot)
    if (this.boss.health === 0) this.winMission()
  }

  private damagePlayer(fromFall: boolean) {
    const now = this.time.now
    if (now < this.player.invulnerableUntil || this.status !== 'playing') return
    this.player.health = Math.max(0, this.player.health - 1)
    this.player.weapon = 'rifle'
    this.player.invulnerableUntil = now + 1400
    this.combo = 0
    this.cameras.main.shake(240, 0.012)
    this.cameras.main.flash(120, 255, 65, 30)
    this.spawnEffect(this.player.x, this.player.y, 'shield', 0.16, 360)
    audioEngine.hit()
    if (fromFall && this.player.health > 0) this.player.setPosition(this.checkpointX, this.checkpointY).setVelocity(0, 0)
    if (this.player.health === 0) this.loseMission()
  }

  private collectPickup(pickup: Phaser.Physics.Arcade.Sprite) {
    this.player.weapon = pickup.getData('weapon') as WeaponKind
    this.score += 300
    this.spawnEffect(pickup.x, pickup.y, 'checkpoint-burst', 0.14, 420)
    pickup.disableBody(true, true)
  }

  private checkCheckpoint() {
    if (this.checkpointX > LEVEL.checkpoints[0].x || this.player.x < LEVEL.checkpoints[1].x) return
    const checkpoint = latestCheckpoint(this.player.x)
    this.checkpointX = checkpoint.x
    this.checkpointY = checkpoint.y
    this.score += 500
    this.spawnEffect(checkpoint.x, checkpoint.y, 'checkpoint-burst', 0.2, 720)
    gameEvents.emitSnapshot({ checkpoint: checkpoint.label, score: this.score })
  }

  private impactAndRelease(shot: Phaser.Physics.Arcade.Sprite, pool: ProjectilePool) {
    if (!shot.active) return
    this.spawnEffect(shot.x, shot.y, 'impact', 0.07, 120)
    pool.release(shot)
  }

  private spawnEffect(x: number, y: number, frame: string, scale: number, duration: number) {
    const effect = this.add.image(x, y, 'effects', frame).setScale(scale).setDepth(25).setBlendMode(Phaser.BlendModes.ADD)
    this.tweens.add({ targets: effect, alpha: 0, scale: scale * 1.35, duration, onComplete: () => effect.destroy() })
  }

  private handleCommand(command: GameCommand) {
    if (command === 'start') this.beginMission()
    if (command === 'pause') this.pauseMission()
    if (command === 'resume') this.resumeMission()
    if (command === 'restart') this.scene.restart({ autoStart: true })
    if (command === 'title') this.scene.restart({ autoStart: false })
  }

  private beginMission() {
    this.status = 'playing'
    this.startedAt = this.time.now
    this.physics.world.resume()
    this.player.resetLoadout(LEVEL.checkpoints[0].x, LEVEL.checkpoints[0].y)
    this.emitSnapshot(true)
  }

  private pauseMission() {
    if (this.status !== 'playing') return
    this.status = 'paused'
    this.physics.world.pause()
    this.emitSnapshot(true)
  }

  private resumeMission() {
    if (this.status !== 'paused') return
    this.status = 'playing'
    this.physics.world.resume()
    this.emitSnapshot(true)
  }

  private winMission() {
    this.status = 'victory'
    this.score += 5000
    this.physics.world.pause()
    this.spawnEffect(this.boss.x, this.boss.y, 'explosion', 0.42, 1100)
    this.cameras.main.flash(900, 90, 220, 255)
    audioEngine.explode(2.5)
    this.emitSnapshot(true)
  }

  private loseMission() {
    this.status = 'defeat'
    this.physics.world.pause()
    this.emitSnapshot(true)
  }

  private emitSnapshot(force = false) {
    const now = this.time.now
    if (!force && now - this.lastSnapshot < 70) return
    this.lastSnapshot = now
    gameEvents.emitSnapshot({
      status: this.status,
      health: this.player.health,
      weapon: this.player.weapon,
      score: this.score,
      combo: this.maxCombo,
      bossHealth: this.boss.activeFight ? this.boss.health : null,
      bossMaxHealth: this.boss.activeFight ? this.boss.maxHealth : null,
      elapsedMs: this.startedAt ? now - this.startedAt : 0,
    })
  }
}
