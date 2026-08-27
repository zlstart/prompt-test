import Phaser from 'phaser'
import { assetManifest } from '../../assets/manifest'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  preload() {
    this.load.image('mission-panorama', assetManifest.missionPanorama)
    this.load.image('entities', assetManifest.entityAtlas)
    this.load.image('effects', assetManifest.effectsAtlas)
  }

  create() {
    const entities = this.textures.get('entities')
    entities.add('hero', 0, 18, 15, 335, 390)
    entities.add('soldier', 0, 380, 20, 380, 385)
    entities.add('drone', 0, 760, 65, 360, 315)
    entities.add('charger', 0, 1080, 20, 450, 385)
    entities.add('turret', 0, 0, 430, 405, 585)
    entities.add('boss', 0, 350, 380, 760, 635)
    entities.add('checkpoint', 0, 1080, 420, 295, 580)
    entities.add('spread-pickup', 0, 1360, 420, 175, 290)
    entities.add('pulse-pickup', 0, 1360, 710, 175, 290)

    const effects = this.textures.get('effects')
    const cellWidth = Math.floor(effects.getSourceImage().width / 4)
    const cellHeight = Math.floor(effects.getSourceImage().height / 2)
    const names = ['muzzle', 'spread-shot', 'pulse-shot', 'impact', 'explosion', 'shockwave', 'shield', 'checkpoint-burst']
    names.forEach((name, index) => {
      effects.add(name, 0, (index % 4) * cellWidth, Math.floor(index / 4) * cellHeight, cellWidth, cellHeight)
    })

    const pixel = this.make.graphics({ x: 0, y: 0 }, false)
    pixel.fillStyle(0xffffff).fillRect(0, 0, 8, 8).generateTexture('pixel', 8, 8)
    pixel.destroy()

    this.scene.start('game')
  }
}
