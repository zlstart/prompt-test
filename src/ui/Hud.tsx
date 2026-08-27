import type { GameSnapshot } from '../game/state'

const weaponLabels = {
  rifle: 'RIFLE',
  spread: 'SPREAD',
  pulse: 'PULSE',
} as const

export function Hud({ snapshot }: { snapshot: GameSnapshot }) {
  const healthCells = Array.from({ length: snapshot.maxHealth }, (_, index) => index < snapshot.health)

  return (
    <div className="hud" aria-label="任务状态">
      <section className="hud__cluster hud__cluster--health" aria-label={`生命值 ${snapshot.health}/${snapshot.maxHealth}`}>
        <span className="hud__label">VITAL</span>
        <span className="health-cells" aria-hidden="true">
          {healthCells.map((filled, index) => (
            <i className={filled ? 'health-cell health-cell--filled' : 'health-cell'} key={index} />
          ))}
        </span>
      </section>

      <section className="hud__cluster hud__cluster--weapon">
        <span className="hud__label">ARMAMENT</span>
        <strong>{weaponLabels[snapshot.weapon]}</strong>
      </section>

      {snapshot.bossHealth !== null && snapshot.bossMaxHealth !== null && (
        <section className="boss-meter">
          <span className="hud__label">WARDEN // CORE</span>
          <div
            className="boss-meter__track"
            role="progressbar"
            aria-label="Boss 生命值"
            aria-valuemin={0}
            aria-valuemax={snapshot.bossMaxHealth}
            aria-valuenow={snapshot.bossHealth}
          >
            <span style={{ width: `${(snapshot.bossHealth / snapshot.bossMaxHealth) * 100}%` }} />
          </div>
        </section>
      )}

      <section className="hud__cluster hud__cluster--score">
        <span className="hud__label">SCORE</span>
        <strong>{snapshot.score.toString().padStart(6, '0')}</strong>
        {snapshot.combo > 1 && <small>CHAIN × {snapshot.combo}</small>}
      </section>
    </div>
  )
}
