# Neon Jungle Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a polished, original one-level browser arcade run-and-gun game with desktop/mobile controls, weapon upgrades, checkpoint recovery, and a three-phase boss.

**Architecture:** React owns the app shell, HUD, menus, and touch controls while Phaser owns the fixed-step game simulation, physics, camera, particles, and rendering. A typed event bus carries low-frequency game snapshots from Phaser to React; pure TypeScript reducers and combat helpers keep rules independently testable.

**Tech Stack:** React 19, TypeScript 5, Vite 7, Phaser 3, Vitest, Testing Library, Playwright, Web Audio API, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-08-27-neon-jungle-game-design.md`

## Global Constraints

- Do not use copyrighted Contra characters, logos, level layouts, music, or art assets.
- Preserve the approved original 16-bit palette: deep teal jungle, orange-red explosions, cyan energy, and purple industrial neon.
- The game must work from start through boss victory without a backend or account.
- Desktop controls: WASD/arrows, J/Space shoot, K/Shift jump, Escape pause, R restart.
- Mobile controls: virtual movement pad, jump button, and shoot button.
- Target desktop performance is 60 FPS and mainstream mobile performance is at least 30 FPS.
- Respect `prefers-reduced-motion` and start audio only after user interaction.
- Production handoff requires passing tests, browser verification, a GitHub source commit, and a Vercel deployment in READY state.

---

## File Map

- `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`: build and test entry points.
- `src/App.tsx`, `src/styles.css`: React shell, responsive frame, menus, and global design tokens.
- `src/game/GameHost.tsx`, `src/game/config.ts`: Phaser lifecycle and renderer configuration.
- `src/game/events.ts`, `src/game/state.ts`: typed UI/game boundary and pure game snapshot reducer.
- `src/game/systems/input.ts`: normalized keyboard and touch input.
- `src/game/systems/combat.ts`: weapon definitions, projectile spread, damage, and score rules.
- `src/game/systems/audio.ts`: user-activated Web Audio sound engine.
- `src/game/entities/Player.ts`, `Enemy.ts`, `Boss.ts`: focused entity behavior.
- `src/game/scenes/BootScene.ts`, `GameScene.ts`: asset loading and playable level orchestration.
- `src/game/level.ts`: platforms, spawn points, checkpoints, and zone metadata.
- `src/ui/Hud.tsx`, `Overlay.tsx`, `TouchControls.tsx`: code-native UI and controls.
- `src/assets/generated/`: optimized concept-derived production art.
- `tests/*.test.ts(x)`, `e2e/game.spec.ts`: rules, React boundary, and browser journey tests.

---

### Task 1: Scaffold and Typed Game State

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/game/events.ts`, `src/game/state.ts`
- Test: `tests/state.test.ts`

**Interfaces:**
- Produces: `GameSnapshot`, `GameStatus`, `gameEvents`, `initialSnapshot`, and `reduceGameEvent(snapshot, event)`.
- Consumers: React HUD and Phaser scenes in later tasks.

- [ ] **Step 1: Write the failing reducer test**

```ts
import { describe, expect, it } from 'vitest'
import { initialSnapshot, reduceGameEvent } from '../src/game/state'

describe('reduceGameEvent', () => {
  it('updates score, weapon, health, and boss state without mutating input', () => {
    const next = reduceGameEvent(initialSnapshot, {
      type: 'snapshot',
      payload: { score: 900, weapon: 'spread', health: 2, bossHealth: 70, bossMaxHealth: 100 },
    })
    expect(next).toMatchObject({ score: 900, weapon: 'spread', health: 2, bossHealth: 70 })
    expect(initialSnapshot.score).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `npm test -- --run tests/state.test.ts`

Expected: FAIL because `src/game/state.ts` does not exist.

- [ ] **Step 3: Implement the project shell and reducer**

```ts
export type WeaponKind = 'rifle' | 'spread' | 'pulse'
export type GameStatus = 'title' | 'playing' | 'paused' | 'victory' | 'defeat'

export interface GameSnapshot {
  status: GameStatus
  health: number
  maxHealth: number
  weapon: WeaponKind
  score: number
  combo: number
  bossHealth: number | null
  bossMaxHealth: number | null
  elapsedMs: number
}

export const initialSnapshot: GameSnapshot = {
  status: 'title', health: 3, maxHealth: 3, weapon: 'rifle', score: 0,
  combo: 0, bossHealth: null, bossMaxHealth: null, elapsedMs: 0,
}

export type GameEvent =
  | { type: 'snapshot'; payload: Partial<GameSnapshot> }
  | { type: 'command'; payload: 'start' | 'pause' | 'resume' | 'restart' }

export function reduceGameEvent(state: GameSnapshot, event: GameEvent): GameSnapshot {
  return event.type === 'snapshot' ? { ...state, ...event.payload } : state
}
```

Implement `gameEvents` as a typed `EventTarget` wrapper with `emit(event)` and `subscribe(listener): () => void`. Render the React shell into `#root` from `src/main.tsx`.

- [ ] **Step 4: Run unit tests and production build**

Run: `npm test -- --run tests/state.test.ts && npm run build`

Expected: PASS and Vite emits `dist/`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig*.json index.html src tests/state.test.ts
git commit -m "feat: scaffold typed game shell"
```

---

### Task 2: Approved Concept and Production Asset Pack

**Files:**
- Create: `design/neon-jungle-concept.png`
- Create: `src/assets/generated/background-far.webp`, `background-mid.webp`, `background-near.webp`
- Create: `src/assets/generated/hero-sheet.png`, `enemy-sheet.png`, `boss-sheet.png`
- Create: `src/assets/generated/terrain.png`, `pickups.png`, `effects.png`
- Create: `src/assets/manifest.ts`
- Test: `tests/assets.test.ts`

**Interfaces:**
- Produces: `assetManifest` mapping stable asset keys to imported URLs.
- Consumers: `BootScene` in Task 6.

- [ ] **Step 1: Generate and inspect the complete 16:9 game-screen concept**

Use Image Gen for a readable 1440×900 full primary game screen containing the rain-forest/industrial transition, player, four enemy families, three weapons, checkpoint, three-layer scenery, HUD placement, and distant boss arena. Keep all UI text code-native.

- [ ] **Step 2: Generate the matching asset pass**

Generate transparent, nearest-neighbor-friendly sprite sheets and separable background/terrain assets in the same palette and pixel scale. Require clear gutters between frames and no baked-in UI text.

- [ ] **Step 3: Write the failing asset manifest test**

```ts
import { describe, expect, it } from 'vitest'
import { assetManifest } from '../src/assets/manifest'

describe('asset manifest', () => {
  it('contains every production asset with no temporary paths', () => {
    expect(Object.keys(assetManifest)).toEqual(expect.arrayContaining([
      'backgroundFar', 'backgroundMid', 'backgroundNear', 'hero',
      'enemy', 'boss', 'terrain', 'pickups', 'effects',
    ]))
    expect(Object.values(assetManifest).every((path) => !path.includes('placeholder'))).toBe(true)
  })
})
```

- [ ] **Step 4: Optimize assets and implement the manifest**

```ts
import backgroundFar from './generated/background-far.webp'
import backgroundMid from './generated/background-mid.webp'
import backgroundNear from './generated/background-near.webp'
import hero from './generated/hero-sheet.png'
import enemy from './generated/enemy-sheet.png'
import boss from './generated/boss-sheet.png'
import terrain from './generated/terrain.png'
import pickups from './generated/pickups.png'
import effects from './generated/effects.png'

export const assetManifest = {
  backgroundFar, backgroundMid, backgroundNear, hero, enemy, boss, terrain, pickups, effects,
} as const
```

- [ ] **Step 5: Verify the images visually and run the manifest test**

Run: `npm test -- --run tests/assets.test.ts`

Expected: PASS. Inspect the concept and every sprite sheet with `view_image`; reject clipped frames, inconsistent lighting, unreadable silhouettes, and non-transparent sprite backgrounds.

- [ ] **Step 6: Commit**

```bash
git add design src/assets tests/assets.test.ts
git commit -m "feat: add neon jungle production art"
```

---

### Task 3: Input and Combat Rules

**Files:**
- Create: `src/game/systems/input.ts`, `src/game/systems/combat.ts`
- Test: `tests/input.test.ts`, `tests/combat.test.ts`

**Interfaces:**
- Produces: `InputFrame`, `createInputController()`, `WeaponSpec`, `WEAPONS`, `aimVector()`, `projectileAngles()`, and `scoreForKill()`.
- Consumers: player, enemies, and `GameScene`.

- [ ] **Step 1: Write failing input and combat tests**

```ts
import { describe, expect, it } from 'vitest'
import { aimVector } from '../src/game/systems/input'
import { projectileAngles } from '../src/game/systems/combat'

describe('aimVector', () => {
  it('normalizes diagonal input', () => {
    expect(aimVector(1, -1)).toEqual({ x: Math.SQRT1_2, y: -Math.SQRT1_2 })
  })
})

describe('projectileAngles', () => {
  it('fires three symmetric spread shots', () => {
    expect(projectileAngles('spread', 0)).toEqual([-0.18, 0, 0.18])
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- --run tests/input.test.ts tests/combat.test.ts`

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement normalized input and weapon definitions**

```ts
export interface InputFrame {
  moveX: -1 | 0 | 1
  aimX: -1 | 0 | 1
  aimY: -1 | 0 | 1
  jumpPressed: boolean
  shootHeld: boolean
  crouch: boolean
}

export function aimVector(x: number, y: number) {
  const length = Math.hypot(x, y) || 1
  return { x: x / length, y: y / length }
}
```

Define rifle as one fast shot, spread as three slower shots at `[-0.18, 0, 0.18]`, and pulse as one large piercing shot with a longer cooldown. Map keyboard and touch state into the same `InputFrame`.

- [ ] **Step 4: Run tests**

Run: `npm test -- --run tests/input.test.ts tests/combat.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/systems tests/input.test.ts tests/combat.test.ts
git commit -m "feat: add controls and weapon rules"
```

---

### Task 4: Player, Enemy, and Boss Entities

**Files:**
- Create: `src/game/entities/Player.ts`, `Enemy.ts`, `Boss.ts`, `ProjectilePool.ts`
- Test: `tests/entities.test.ts`

**Interfaces:**
- Consumes: `InputFrame`, `WEAPONS`, `projectileAngles()`.
- Produces: `Player`, `Enemy`, `Boss`, `ProjectilePool`, plus serializable `PlayerState` and `BossState` snapshots.

- [ ] **Step 1: Write failing pure-state tests**

```ts
import { describe, expect, it } from 'vitest'
import { nextBossPhase, takePlayerDamage } from '../src/game/entities/rules'

describe('entity rules', () => {
  it('advances boss phases at 66% and 33%', () => {
    expect(nextBossPhase(65, 100)).toBe(2)
    expect(nextBossPhase(32, 100)).toBe(3)
  })
  it('downgrades a powered weapon when the player is hit', () => {
    expect(takePlayerDamage({ health: 3, weapon: 'spread' })).toMatchObject({ health: 2, weapon: 'rifle' })
  })
})
```

- [ ] **Step 2: Run and verify the missing-module failure**

Run: `npm test -- --run tests/entities.test.ts`

Expected: FAIL because `entities/rules` is missing.

- [ ] **Step 3: Implement entity rules, then Phaser entity classes**

```ts
export function nextBossPhase(health: number, maxHealth: number): 1 | 2 | 3 {
  const ratio = health / maxHealth
  return ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3
}
```

Implement the player with coyote time, buffered jump, crouch hitbox, invulnerability frames, weapon cooldown, and checkpoint respawn. Implement four enemy behavior modes. Implement Boss phase 1 aimed bursts, phase 2 missiles plus drones, and phase 3 ground shockwaves plus faster bursts. Reuse projectiles through `ProjectilePool`.

- [ ] **Step 4: Run tests and type-check**

Run: `npm test -- --run tests/entities.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/entities tests/entities.test.ts
git commit -m "feat: implement arcade combat entities"
```

---

### Task 5: Level Data, Checkpoint, and Game Scene

**Files:**
- Create: `src/game/level.ts`, `src/game/scenes/BootScene.ts`, `src/game/scenes/GameScene.ts`
- Create: `src/game/config.ts`, `src/game/GameHost.tsx`
- Test: `tests/level.test.ts`

**Interfaces:**
- Consumes: production assets, entity classes, combat helpers, `gameEvents`.
- Produces: `LEVEL`, `latestCheckpoint(x)`, `createGame(parent)`, and the complete playable scene.

- [ ] **Step 1: Write the failing level progression test**

```ts
import { describe, expect, it } from 'vitest'
import { latestCheckpoint } from '../src/game/level'

describe('latestCheckpoint', () => {
  it('returns the last activated checkpoint behind the player', () => {
    expect(latestCheckpoint(4600)).toMatchObject({ id: 'outpost', x: 4200 })
  })
  it('returns the insertion point before the outpost', () => {
    expect(latestCheckpoint(1200)).toMatchObject({ id: 'insertion' })
  })
})
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- --run tests/level.test.ts`

Expected: FAIL because `src/game/level.ts` is missing.

- [ ] **Step 3: Implement declarative level data**

Define a 9600-pixel level with three zones, platform rectangles, enemy spawns, spread/pulse pickups, insertion and outpost checkpoints, arena gates, and the boss spawn. `latestCheckpoint(x)` must always return a valid safe location.

- [ ] **Step 4: Implement BootScene and GameScene**

Load manifest assets with a visible progress callback and generated fallback textures. Build three parallax layers, platforms, hazards, enemies, pickups, checkpoints, boss gate, camera follow, and screen effects. Emit UI snapshots at no more than 15 Hz. Handle pause, restart, death, respawn, victory, and cleanup.

- [ ] **Step 5: Wire Phaser into React and run checks**

```tsx
export function GameHost() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!host.current) return
    const game = createGame(host.current)
    return () => game.destroy(true)
  }, [])
  return <div className="game-host" ref={host} />
}
```

Run: `npm test -- --run tests/level.test.ts && npm run build`

Expected: PASS and no duplicate Phaser instance under React Strict Mode.

- [ ] **Step 6: Commit**

```bash
git add src/game tests/level.test.ts
git commit -m "feat: build neon jungle mission"
```

---

### Task 6: HUD, Menus, Touch Controls, and Audio

**Files:**
- Create: `src/ui/Hud.tsx`, `src/ui/Overlay.tsx`, `src/ui/TouchControls.tsx`
- Create: `src/game/systems/audio.ts`
- Modify: `src/App.tsx`, `src/styles.css`
- Test: `tests/ui.test.tsx`, `tests/audio.test.ts`

**Interfaces:**
- Consumes: `GameSnapshot`, `gameEvents`, input touch store.
- Produces: responsive game shell and `AudioEngine` with `activate()`, `shoot(kind)`, `jump()`, `hit()`, `explode(size)`, and `setMuted()`.

- [ ] **Step 1: Write failing UI and audio lifecycle tests**

```tsx
import { render, screen } from '@testing-library/react'
import { Hud } from '../src/ui/Hud'
import { initialSnapshot } from '../src/game/state'

it('shows health, weapon and score using accessible labels', () => {
  render(<Hud snapshot={{ ...initialSnapshot, health: 2, score: 1250, weapon: 'pulse' }} />)
  expect(screen.getByLabelText('生命值 2/3')).toBeInTheDocument()
  expect(screen.getByText('PULSE')).toBeInTheDocument()
  expect(screen.getByText('001250')).toBeInTheDocument()
})
```

Test that `AudioEngine` does not create an `AudioContext` before `activate()` and that mute prevents oscillator creation.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- --run tests/ui.test.tsx tests/audio.test.ts`

Expected: FAIL because UI and audio modules are missing.

- [ ] **Step 3: Implement the concept-derived design system and UI**

Extract exact colors, pixel typography scale, HUD geometry, buttons, overlays, spacing, and mobile breakpoints from the approved concept. Implement title, loading, playing, paused, victory, and defeat states. Keep all labels code-native. Show touch controls only for coarse pointers or narrow viewports.

- [ ] **Step 4: Implement user-activated synthesized audio**

Use short oscillators, filtered noise, gain envelopes, and stereo panning for original effects. Keep nodes short-lived, resume suspended contexts on interaction, and provide a visible mute toggle.

- [ ] **Step 5: Run tests, accessibility check, and build**

Run: `npm test -- --run tests/ui.test.tsx tests/audio.test.ts && npm run build`

Expected: PASS with no axe-critical issues, no horizontal overflow at 390×844, and no audio-autoplay exception.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/styles.css src/ui src/game/systems/audio.ts tests/ui.test.tsx tests/audio.test.ts
git commit -m "feat: add arcade hud controls and audio"
```

---

### Task 7: Browser Journey and Visual Fidelity

**Files:**
- Create: `playwright.config.ts`, `e2e/game.spec.ts`
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: complete local app.
- Produces: repeatable end-to-end verification and project documentation.

- [ ] **Step 1: Write the browser journey test**

```ts
import { expect, test } from '@playwright/test'

test('starts, moves, shoots, pauses and restarts the mission', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '开始任务' }).click()
  await page.keyboard.down('KeyD')
  await page.waitForTimeout(400)
  await page.keyboard.up('KeyD')
  await page.keyboard.press('KeyJ')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: '任务暂停' })).toBeVisible()
  await page.getByRole('button', { name: '继续任务' }).click()
  await expect(page.getByLabel('游戏画布')).toBeVisible()
})
```

- [ ] **Step 2: Run it and record the first failure**

Run: `npm run test:e2e`

Expected: The first run may expose selector, focus, or input timing defects; fix the first broken boundary before continuing.

- [ ] **Step 3: Verify desktop and mobile in the browser**

Use the available browser controller first. Test 1440×900 and 390×844, click the complete menu path, verify movement/jump/shoot/pause/restart, inspect console and failed requests, and capture implementation screenshots.

- [ ] **Step 4: Perform concept-to-render fidelity QA**

Open both `design/neon-jungle-concept.png` and the latest desktop screenshot with `view_image`. Record at least five comparisons covering composition, palette, typography, HUD, asset blending, container geometry, and mobile controls. Fix every material mismatch and rerun the browser test.

- [ ] **Step 5: Document controls and local commands**

README must contain the original-IP notice, feature list, controls table, `npm install`, `npm run dev`, `npm test`, `npm run build`, and deployment notes.

- [ ] **Step 6: Run the complete local verification**

Run: `npm test -- --run && npm run typecheck && npm run build && npm run test:e2e`

Expected: all commands PASS; no browser console errors or failed core assets.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json playwright.config.ts e2e README.md
git commit -m "test: verify complete arcade mission"
```

---

### Task 8: GitHub Publication and Vercel Production Deployment

**Files:**
- Create: `vercel.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: verified repository at the final local commit.
- Produces: accessible GitHub source and a READY Vercel production URL.

- [ ] **Step 1: Add explicit Vercel static configuration**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

- [ ] **Step 2: Run the final pre-publication gate**

Run: `npm test -- --run && npm run typecheck && npm run build && git status --short`

Expected: tests/build PASS; only the intended `vercel.json` and README deployment link changes are pending.

- [ ] **Step 3: Commit deployment configuration**

```bash
git add vercel.json README.md
git commit -m "chore: configure vercel deployment"
```

- [ ] **Step 4: Publish the source through the authorized GitHub connection**

Create or select a user-approved repository, upload the complete final tree in one commit, and confirm the repository default branch points to that commit. Never overwrite unrelated repository contents.

- [ ] **Step 5: Deploy the verified tree to Vercel production**

Deploy the current project with framework `vite`, build command `npm run build`, and output `dist`. Wait for deployment status `READY`; if it fails, inspect build logs and fix only the confirmed failure.

- [ ] **Step 6: Verify production**

Fetch the production URL, open it in the browser, verify HTTP 200, click “开始任务”, move and fire once, inspect console/runtime errors, and confirm assets load from the deployed origin.

- [ ] **Step 7: Record deployment URLs**

Update README with the production URL, commit the link, and publish the final commit if repository write access supports it.

---

## Final Verification Checklist

- [ ] Spec sections 1–9 map to Tasks 1–8 with no unimplemented feature.
- [ ] Unit, component, build, type-check, and end-to-end commands pass from a clean install.
- [ ] The complete game journey is playable on desktop and usable on mobile.
- [ ] Generated assets and implementation screenshots pass direct `view_image` comparison.
- [ ] No copyrighted source art, music, names, or logos are shipped.
- [ ] GitHub source and Vercel production URLs resolve to the verified release.
