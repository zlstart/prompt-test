import { expect, test } from '@playwright/test'

test('starts, moves, shoots, pauses, and resumes the mission', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /霓虹丛林/ })).toBeVisible()
  await page.getByRole('button', { name: '开始任务' }).click()
  await expect(page.getByLabel('游戏画布')).toBeVisible()
  await expect(page.locator('[data-game-status="playing"]')).toBeVisible()

  await page.keyboard.down('KeyD')
  await page.waitForTimeout(450)
  await page.keyboard.up('KeyD')
  await page.keyboard.press('KeyJ')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: '任务暂停' })).toBeVisible()
  await page.getByRole('button', { name: '继续任务' }).click()
  await expect(page.locator('[data-game-status="playing"]')).toBeVisible()
  expect(errors).toEqual([])
})

test('defeats the boss with a real projectile and shows victory results', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '开始任务' }).click()
  await page.locator('[data-game-status="playing"]').waitFor()
  await page.evaluate(() => {
    const debug = (window as unknown as { __NEON_DEBUG__?: { enterBossFinalHit(): void } }).__NEON_DEBUG__
    if (!debug) throw new Error('development boss test hook is missing')
    debug.enterBossFinalHit()
  })
  await page.keyboard.down('KeyJ')
  await page.waitForTimeout(900)
  await page.keyboard.up('KeyJ')

  await expect(page.getByRole('heading', { name: '任务完成' })).toBeVisible()
  await expect(page.getByText('CORE NEUTRALIZED')).toBeVisible()
})

test('damages a regular enemy with a real projectile and awards score', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '开始任务' }).click()
  await page.locator('[data-game-status="playing"]').waitFor()
  await page.evaluate(() => {
    const debug = (window as unknown as { __NEON_DEBUG__?: { enterEnemyFinalHit(): void } }).__NEON_DEBUG__
    if (!debug) throw new Error('development enemy test hook is missing')
    debug.enterEnemyFinalHit()
  })
  await page.keyboard.down('KeyJ')
  await page.waitForTimeout(650)
  await page.keyboard.up('KeyJ')

  await expect(page.locator('.hud__cluster--score strong')).not.toHaveText('000000')
})
