export const DIRECTIONS = ['up', 'down', 'left', 'right'];

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function moveTank(tank, direction, bounds, obstacles = []) {
  const next = { ...tank, direction };
  const delta = tank.speed ?? 0;

  if (direction === 'up') next.y -= delta;
  if (direction === 'down') next.y += delta;
  if (direction === 'left') next.x -= delta;
  if (direction === 'right') next.x += delta;

  next.x = clamp(next.x, 0, bounds.width - next.w);
  next.y = clamp(next.y, 0, bounds.height - next.h);

  const blocked = obstacles.some((obstacle) => obstacle.solid !== false && rectsOverlap(next, obstacle));
  return blocked ? { ...tank, direction } : next;
}

export function advanceBullet(bullet) {
  const next = { ...bullet };
  if (bullet.direction === 'up') next.y -= bullet.speed;
  if (bullet.direction === 'down') next.y += bullet.speed;
  if (bullet.direction === 'left') next.x -= bullet.speed;
  if (bullet.direction === 'right') next.x += bullet.speed;
  return next;
}

export function circleHitsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

export function applyBulletHit(bullet, walls) {
  const hitIndex = walls.findIndex((wall) => circleHitsRect(bullet, wall));
  if (hitIndex === -1) return { hit: false, remainingWalls: walls };

  const hitWall = walls[hitIndex];
  if (hitWall.type === 'steel') {
    return { hit: true, remainingWalls: walls, wall: hitWall };
  }

  const nextWalls = walls
    .map((wall, index) => index === hitIndex ? { ...wall, hp: (wall.hp ?? 1) - 1 } : wall)
    .filter((wall) => (wall.hp ?? 1) > 0);

  return { hit: true, remainingWalls: nextWalls, wall: hitWall };
}

export function chooseEnemyDirection(random = Math.random) {
  const index = Math.min(DIRECTIONS.length - 1, Math.floor(random() * DIRECTIONS.length));
  return DIRECTIONS[index];
}
