import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Hud } from '../src/ui/Hud'
import { initialSnapshot } from '../src/game/state'

describe('Hud', () => {
  it('renders health, weapon, score, and boss status accessibly', () => {
    render(
      <Hud
        snapshot={{
          ...initialSnapshot,
          health: 2,
          score: 1250,
          weapon: 'pulse',
          bossHealth: 50,
          bossMaxHealth: 100,
        }}
      />,
    )

    expect(screen.getByLabelText('生命值 2/3')).toBeInTheDocument()
    expect(screen.getByText('PULSE')).toBeInTheDocument()
    expect(screen.getByText('001250')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Boss 生命值' })).toHaveAttribute('aria-valuenow', '50')
  })
})
