import {
  moveTank,
  advanceBullet,
  applyBulletHit,
  circleHitsRect,
  chooseEnemyDirection,
  rectsOverlap,
} from './game-core.mjs';

const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.querySelector('#restartButton');
const overlayRestartButton = document.querySelector('#overlayRestartButton');
const overlay = document.querySelector('#overlay');
const overlayKicker = document.querySelector('#overlayKicker');
const overlayTitle = document.querySelector('#overlayTitle');
const overlayText = document.querySelector('#overlayText');
const scoreValue = document.querySelector('#scoreValue');
const livesValue = document.querySelector('#livesValue');
const enemiesValue = document.querySelector('#enemiesValue');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TANK_SIZE = 34;
const TOTAL_ENEMIES = 8;
const MAX_ACTIVE_ENEMIES = 3;
const keys = new Set();
let state;
let previousTime = performance.now();

function wall(id, x, y, type = 'brick') {
  return { id, x, y, w: 32, h: 32, type, hp: type === 'steel' ? Infinity : 1, solid: true };
}

function buildWalls() {
  const walls = [];
  const bricks = [
    [96, 96], [128, 96], [256, 96], [288, 96], [480, 96], [512, 96],
    [96, 128], [256, 128], [512, 128],
    [192, 224], [224, 224], [384, 224], [416, 224],
    [64, 320], [96, 320], [256, 320], [288, 320], [448, 320], [480, 320],
    [64, 352], [288, 352], [448, 352],
    [160, 448], [192, 448], [416, 448], [448, 448],
    [160, 480], [448, 480],
  ];
  const steel = [
    [320, 160], [320, 192], [320, 416], [320, 448],
    [32, 224], [576, 224], [32, 416], [576, 416],
  ];

  bricks.forEach(([x, y], index) => walls.push(wall(`b-${index}`, x, y, 'brick')));
  steel.forEach(([x, y], index) => walls.push(wall(`s-${index}`, x, y, 'steel')));
  return walls;
}

function createPlayer() {
  return {
    id: 'player', x: WIDTH / 2 - TANK_SIZE / 2, y: HEIGHT - 62,
    w: TANK_SIZE, h: TANK_SIZE, speed: 2.7, direction: 'up',
    cooldown: 0, invulnerable: 1400,
  };
}

function enemySpawn(index) {
  const slots = [36, WIDTH / 2 - TANK_SIZE / 2, WIDTH - TANK_SIZE - 36];
  return {
    id: `enemy-${crypto.randomUUID?.() ?? `${Date.now()}-${index}`}`,
    x: slots[index % slots.length], y: 34,
    w: TANK_SIZE, h: TANK_SIZE, speed: 1.35 + Math.random() * 0.35,
    direction: 'down', cooldown: 600 + Math.random() * 700,
    decisionTimer: 400 + Math.random() * 900,
  };
}

function resetGame() {
  state = {
    player: createPlayer(),
    enemies: [], bullets: [], particles: [], walls: buildWalls(),
    score: 0, lives: 3, remainingToSpawn: TOTAL_ENEMIES,
    running: true, lastSpawn: -1000,
  };
  overlay.hidden = true;
  updateHud();
  spawnEnemies(true);
}

function spawnEnemies(force = false) {
  const now = performance.now();
  if (!state.running) return;
  if (!force && now - state.lastSpawn < 850) return;

  while (state.enemies.length < MAX_ACTIVE_ENEMIES && state.remainingToSpawn > 0) {
    const enemy = enemySpawn(state.enemies.length + state.remainingToSpawn);
    const collides = [...state.walls, ...state.enemies].some((item) => rectsOverlap(enemy, item));
    if (collides) break;
    state.enemies.push(enemy);
    state.remainingToSpawn -= 1;
    state.lastSpawn = now;
    if (!force) break;
  }
}

function shoot(tank, owner) {
  if (tank.cooldown > 0 || !state.running) return;
  const centerX = tank.x + tank.w / 2;
  const centerY = tank.y + tank.h / 2;
  const bullet = {
    x: centerX, y: centerY, r: 4,
    speed: owner === 'player' ? 6.8 : 4.3,
    direction: tank.direction, owner,
  };
  const offset = tank.w / 2 + 6;
  if (tank.direction === 'up') bullet.y -= offset;
  if (tank.direction === 'down') bullet.y += offset;
  if (tank.direction === 'left') bullet.x -= offset;
  if (tank.direction === 'right') bullet.x += offset;
  state.bullets.push(bullet);
  tank.cooldown = owner === 'player' ? 260 : 820 + Math.random() * 420;
}

function updatePlayer(deltaMs) {
  const player = state.player;
  const directions = [
    ['ArrowUp', 'up'], ['KeyW', 'up'], ['ArrowDown', 'down'], ['KeyS', 'down'],
    ['ArrowLeft', 'left'], ['KeyA', 'left'], ['ArrowRight', 'right'], ['KeyD', 'right'],
  ];
  const selected = directions.find(([key]) => keys.has(key));
  if (selected) {
    const scaled = { ...player, speed: player.speed * Math.min(deltaMs / 16.67, 1.6) };
    const obstacles = [...state.walls, ...state.enemies];
    state.player = { ...moveTank(scaled, selected[1], { width: WIDTH, height: HEIGHT }, obstacles), speed: player.speed };
  }
  state.player.cooldown = Math.max(0, state.player.cooldown - deltaMs);
  state.player.invulnerable = Math.max(0, state.player.invulnerable - deltaMs);
}

function updateEnemies(deltaMs) {
  const allTanks = () => [state.player, ...state.enemies];
  state.enemies.forEach((enemy) => {
    enemy.cooldown = Math.max(0, enemy.cooldown - deltaMs);
    enemy.decisionTimer -= deltaMs;

    if (enemy.decisionTimer <= 0) {
      const alignedX = Math.abs((enemy.x + enemy.w / 2) - (state.player.x + state.player.w / 2)) < 38;
      const alignedY = Math.abs((enemy.y + enemy.h / 2) - (state.player.y + state.player.h / 2)) < 38;
      if (alignedX) enemy.direction = state.player.y > enemy.y ? 'down' : 'up';
      else if (alignedY) enemy.direction = state.player.x > enemy.x ? 'right' : 'left';
      else enemy.direction = chooseEnemyDirection();
      enemy.decisionTimer = 450 + Math.random() * 950;
    }

    const obstacles = [...state.walls, ...allTanks().filter((tank) => tank.id !== enemy.id)];
    const scaled = { ...enemy, speed: enemy.speed * Math.min(deltaMs / 16.67, 1.6) };
    const moved = moveTank(scaled, enemy.direction, { width: WIDTH, height: HEIGHT }, obstacles);
    if (moved.x === enemy.x && moved.y === enemy.y) {
      enemy.direction = chooseEnemyDirection();
      enemy.decisionTimer = 240;
    } else {
      enemy.x = moved.x;
      enemy.y = moved.y;
    }

    const aggressive = Math.random() < 0.012 || enemy.cooldown <= 0 && Math.random() < 0.018;
    if (aggressive) shoot(enemy, 'enemy');
  });
}

function addExplosion(x, y, color = '#d9f256') {
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
    const speed = 1.2 + Math.random() * 2.8;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 360, color });
  }
}

function hitEnemy(bullet) {
  const index = state.enemies.findIndex((enemy) => circleHitsRect(bullet, enemy));
  if (index === -1) return false;
  const [enemy] = state.enemies.splice(index, 1);
  addExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
  state.score += 100;
  updateHud();
  return true;
}

function damagePlayer() {
  if (state.player.invulnerable > 0) return;
  state.lives -= 1;
  addExplosion(state.player.x + state.player.w / 2, state.player.y + state.player.h / 2, '#ff675c');
  updateHud();
  if (state.lives <= 0) {
    endGame(false);
    return;
  }
  state.player = createPlayer();
}

function updateBullets(deltaMs) {
  const nextBullets = [];
  for (const bullet of state.bullets) {
    const scale = Math.min(deltaMs / 16.67, 1.6);
    const moved = advanceBullet({ ...bullet, speed: bullet.speed * scale });
    if (moved.x < -10 || moved.x > WIDTH + 10 || moved.y < -10 || moved.y > HEIGHT + 10) continue;

    const wallResult = applyBulletHit(moved, state.walls);
    if (wallResult.hit) {
      if (wallResult.wall.type === 'brick') {
        addExplosion(moved.x, moved.y, '#f09a67');
        state.walls = wallResult.remainingWalls;
      }
      continue;
    }

    if (moved.owner === 'player' && hitEnemy(moved)) continue;
    if (moved.owner === 'enemy' && circleHitsRect(moved, state.player)) {
      damagePlayer();
      continue;
    }
    nextBullets.push(moved);
  }
  state.bullets = nextBullets;
}

function updateParticles(deltaMs) {
  state.particles = state.particles
    .map((particle) => ({ ...particle, x: particle.x + particle.vx, y: particle.y + particle.vy, life: particle.life - deltaMs }))
    .filter((particle) => particle.life > 0);
}

function updateHud() {
  scoreValue.textContent = String(state.score).padStart(4, '0');
  livesValue.textContent = String(state.lives);
  enemiesValue.textContent = String(state.remainingToSpawn + state.enemies.length);
}

function endGame(won) {
  state.running = false;
  overlayKicker.textContent = won ? 'MISSION COMPLETE' : 'MISSION FAILED';
  overlayTitle.textContent = won ? '任务完成' : '阵地失守';
  overlayText.textContent = won ? `最终得分 ${state.score}。敌军已全部清除。` : `最终得分 ${state.score}。重新整备后再战。`;
  overlay.hidden = false;
}

function update(deltaMs) {
  if (!state.running) return;
  updatePlayer(deltaMs);
  updateEnemies(deltaMs);
  updateBullets(deltaMs);
  updateParticles(deltaMs);
  spawnEnemies();
  if (state.remainingToSpawn === 0 && state.enemies.length === 0) endGame(true);
}

function drawArena() {
  ctx.fillStyle = '#070a08';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = 'rgba(217, 242, 86, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
}

function drawWall(item) {
  if (item.type === 'steel') {
    ctx.fillStyle = '#74817d';
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = '#aeb9b5';
    ctx.fillRect(item.x + 3, item.y + 3, item.w - 6, 4);
    ctx.fillStyle = '#4d5754';
    ctx.fillRect(item.x + 5, item.y + 12, item.w - 10, item.h - 17);
    ctx.fillStyle = '#cbd3d0';
    [[7,7],[25,7],[7,25],[25,25]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(item.x+x,item.y+y,1.8,0,Math.PI*2); ctx.fill(); });
    return;
  }
  ctx.fillStyle = '#8e3f28';
  ctx.fillRect(item.x, item.y, item.w, item.h);
  ctx.fillStyle = '#d06d48';
  ctx.fillRect(item.x + 2, item.y + 2, item.w - 4, 5);
  ctx.strokeStyle = '#5d291d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(item.x, item.y + 16); ctx.lineTo(item.x + item.w, item.y + 16);
  ctx.moveTo(item.x + 16, item.y); ctx.lineTo(item.x + 16, item.y + 16);
  ctx.moveTo(item.x + 8, item.y + 16); ctx.lineTo(item.x + 8, item.y + item.h);
  ctx.stroke();
}

function drawTank(tank, isPlayer) {
  const cx = tank.x + tank.w / 2;
  const cy = tank.y + tank.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  const rotations = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };
  ctx.rotate(rotations[tank.direction] ?? 0);

  if (isPlayer && tank.invulnerable > 0 && Math.floor(tank.invulnerable / 90) % 2 === 0) ctx.globalAlpha = 0.35;
  ctx.fillStyle = isPlayer ? '#d9f256' : '#ff675c';
  ctx.fillRect(-16, -16, 9, 32);
  ctx.fillRect(7, -16, 9, 32);
  ctx.fillStyle = isPlayer ? '#93a83a' : '#a83f39';
  ctx.fillRect(-11, -12, 22, 24);
  ctx.fillStyle = '#111612';
  ctx.fillRect(-6, -7, 12, 12);
  ctx.fillStyle = isPlayer ? '#eafb83' : '#ff938b';
  ctx.fillRect(-2.5, -20, 5, 17);
  ctx.beginPath(); ctx.arc(0, -2, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function render() {
  drawArena();
  state.walls.forEach(drawWall);
  drawTank(state.player, true);
  state.enemies.forEach((enemy) => drawTank(enemy, false));

  state.bullets.forEach((bullet) => {
    ctx.fillStyle = bullet.owner === 'player' ? '#f7ffd0' : '#ffbbb6';
    ctx.beginPath(); ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2); ctx.fill();
  });

  state.particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / 360);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  });
}

function frame(now) {
  const deltaMs = Math.min(now - previousTime, 40);
  previousTime = now;
  update(deltaMs);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR'];
  if (gameKeys.includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === 'Space' && !event.repeat) shoot(state.player, 'player');
  if (event.code === 'KeyR' && !event.repeat) resetGame();
});

window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
restartButton.addEventListener('click', resetGame);
overlayRestartButton.addEventListener('click', resetGame);

resetGame();
requestAnimationFrame((now) => {
  previousTime = now;
  requestAnimationFrame(frame);
});
