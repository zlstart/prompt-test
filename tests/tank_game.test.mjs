import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rectsOverlap,
  moveTank,
  advanceBullet,
  applyBulletHit,
  chooseEnemyDirection,
} from '../static/tank/game-core.mjs';

const bounds = { width: 640, height: 640 };

test('rectsOverlap detects intersecting rectangles', () => {
  assert.equal(rectsOverlap({x: 0, y: 0, w: 32, h: 32}, {x: 16, y: 16, w: 32, h: 32}), true);
  assert.equal(rectsOverlap({x: 0, y: 0, w: 32, h: 32}, {x: 40, y: 40, w: 32, h: 32}), false);
});

test('moveTank keeps tank inside arena bounds', () => {
  const tank = { x: 4, y: 4, w: 36, h: 36, speed: 10, direction: 'left' };
  const moved = moveTank(tank, 'left', bounds, []);
  assert.equal(moved.x, 0);
  assert.equal(moved.y, 4);
  assert.equal(moved.direction, 'left');
});

test('moveTank blocks movement through solid obstacles', () => {
  const tank = { x: 100, y: 100, w: 36, h: 36, speed: 10, direction: 'right' };
  const walls = [{ x: 140, y: 100, w: 40, h: 40, solid: true }];
  const moved = moveTank(tank, 'right', bounds, walls);
  assert.equal(moved.x, 100);
});

test('advanceBullet moves according to direction', () => {
  const bullet = { x: 100, y: 100, r: 4, speed: 8, direction: 'up' };
  const moved = advanceBullet(bullet);
  assert.equal(moved.y, 92);
  assert.equal(moved.x, 100);
});

test('applyBulletHit destroys brick wall but not steel wall', () => {
  const bullet = { x: 120, y: 120, r: 4 };
  const bricks = [{ id: 'b1', x: 100, y: 100, w: 40, h: 40, type: 'brick', hp: 1 }];
  const steel = [{ id: 's1', x: 100, y: 100, w: 40, h: 40, type: 'steel', hp: Infinity }];
  assert.deepEqual(applyBulletHit(bullet, bricks).remainingWalls, []);
  assert.equal(applyBulletHit(bullet, steel).remainingWalls.length, 1);
});

test('chooseEnemyDirection returns a legal cardinal direction', () => {
  const direction = chooseEnemyDirection(() => 0.74);
  assert.ok(['up', 'down', 'left', 'right'].includes(direction));
});
