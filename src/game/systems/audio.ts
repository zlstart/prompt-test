import type { WeaponKind } from '../state'

export class AudioEngine {
  private context: AudioContext | null = null
  private muted = false

  async activate() {
    if (typeof AudioContext === 'undefined') return
    if (!this.context) this.context = new AudioContext()
    if (this.context.state === 'suspended') await this.context.resume()
  }

  setMuted(muted: boolean) {
    this.muted = muted
  }

  shoot(weapon: WeaponKind) {
    const frequencies = { rifle: 240, spread: 150, pulse: 90 }
    this.tone(frequencies[weapon], weapon === 'pulse' ? 0.18 : 0.07, 'square')
  }

  jump() {
    this.tone(180, 0.09, 'triangle', 420)
  }

  hit() {
    this.tone(100, 0.14, 'sawtooth', 50)
  }

  explode(size = 1) {
    this.tone(72 / Math.max(0.5, size), 0.22, 'sawtooth', 32)
  }

  private tone(frequency: number, duration: number, type: OscillatorType, endFrequency = frequency * 0.55) {
    if (this.muted || !this.context) return
    const now = this.context.currentTime
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration)
    gain.gain.setValueAtTime(0.055, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain)
    gain.connect(this.context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration)
  }
}

export const audioEngine = new AudioEngine()
