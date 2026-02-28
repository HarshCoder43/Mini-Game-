const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

let state = 'menu';
let score = 0, lives = 3, level = 1, hiScore = 0;
let player, bullets, enemies, enemyBullets, particles, stars;
let keys = {}, shootCooldown = 0, enemyShootTimer = 0;
let animId, levelTransition = false;

function initStars() {
  stars = [];
  for (let i = 0; i < 160; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.2,
      speed: 0.25 + Math.random() * 0.8,
      alpha: 0.2 + Math.random() * 0.7
    });
  }
}

function initLevel() {
  bullets = []; enemyBullets = []; particles = [];
  shootCooldown = 0; enemyShootTimer = 0; levelTransition = false;
  player = { x: canvas.width / 2, y: canvas.height - 70, w: 40, h: 36, speed: 4.5, invincible: 0 };
  spawnEnemies();
}

function spawnEnemies() {
  enemies = [];
  const cols = 6, rows = Math.min(2 + level, 5);
  const spacing = 100, startX = (canvas.width - (cols - 1) * spacing) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({ x: startX + c * spacing, y: 55 + r * 72, w: 38, h: 34, dx: 1 + level * 0.28, dir: 1, hp: 1 + Math.floor(level / 3) });
    }
  }
}

function drawStars() {
  stars.forEach(s => {
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    s.y += s.speed;
    if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
  });
}

function drawPlayer(p) {
  if (p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.shadowColor = '#7ec8e3'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#7ec8e3';
  ctx.beginPath();
  ctx.moveTo(0, -18); ctx.lineTo(12, 0); ctx.lineTo(20, 18);
  ctx.lineTo(0, 12); ctx.lineTo(-20, 18); ctx.lineTo(-12, 0);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f0a500';
  ctx.beginPath(); ctx.moveTo(-20, 18); ctx.lineTo(-10, 12); ctx.lineTo(-10, 24); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(20, 18); ctx.lineTo(10, 12); ctx.lineTo(10, 24); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0a1e36';
  ctx.beginPath(); ctx.ellipse(0, 2, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#7ec8e3'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, 2, 7, 9, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = '#8899cc';
  ctx.beginPath();
  ctx.moveTo(0, -17); ctx.lineTo(16, -5); ctx.lineTo(19, 12);
  ctx.lineTo(0, 17); ctx.lineTo(-19, 12); ctx.lineTo(-16, -5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#44506a';
  ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c0d0ee';
  ctx.beginPath(); ctx.ellipse(0, -2, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2, speed = 1 + Math.random() * 3.5;
    particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 35 + Math.random()*20, maxLife: 55, color });
  }
}

function rect(a, b) {
  return a.x-a.w/2 < b.x+b.w/2 && a.x+a.w/2 > b.x-b.w/2 &&
         a.y-a.h/2 < b.y+b.h/2 && a.y+a.h/2 > b.y-b.h/2;
}

function update() {
  if (state !== 'playing' || levelTransition) return;
  if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
  player.x = Math.max(25, Math.min(canvas.width - 25, player.x));
  if (player.invincible > 0) player.invincible--;
  if (shootCooldown > 0) shootCooldown--;
  if ((keys[' '] || keys['ArrowUp'] || keys['w']) && shootCooldown === 0) {
    bullets.push({ x: player.x, y: player.y - 20, w: 4, h: 14 });
    shootCooldown = 12;
  }
  bullets.forEach(b => b.y -= 9);
  bullets = bullets.filter(b => b.y > -20);
  let edgeHit = false;
  enemies.forEach(e => { e.x += e.dx * e.dir; if (e.x > canvas.width-25 || e.x < 25) edgeHit = true; });
  if (edgeHit) enemies.forEach(e => { e.dir *= -1; e.y += 18; });
  enemyShootTimer++;
  const fireRate = Math.max(35, 85 - level * 5);
  if (enemyShootTimer >= fireRate && enemies.length > 0) {
    enemyShootTimer = 0;
    const front = enemies.filter(e => !enemies.some(o => o.y > e.y && Math.abs(o.x-e.x) < 30));
    if (front.length > 0) { const s = front[Math.floor(Math.random()*front.length)]; enemyBullets.push({ x: s.x, y: s.y+20, w: 4, h: 12 }); }
  }
  enemyBullets.forEach(b => b.y += 6);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height+20);
  for (let bi = bullets.length-1; bi >= 0; bi--) {
    for (let ei = enemies.length-1; ei >= 0; ei--) {
      const b = bullets[bi], e = enemies[ei];
      if (b && rect({x:b.x,y:b.y,w:b.w,h:b.h},{x:e.x,y:e.y,w:e.w,h:e.h})) {
        e.hp--; bullets.splice(bi, 1);
        if (e.hp <= 0) { spawnParticles(e.x,e.y,'#8899cc'); enemies.splice(ei,1); score += 10*level; }
        break;
      }
    }
  }
  if (player.invincible === 0) {
    for (let bi = enemyBullets.length-1; bi >= 0; bi--) {
      const b = enemyBullets[bi];
      if (rect({x:b.x,y:b.y,w:b.w,h:b.h},{x:player.x,y:player.y,w:player.w,h:player.h})) {
        enemyBullets.splice(bi,1); lives--; player.invincible = 120;
        spawnParticles(player.x,player.y,'#7ec8e3');
        if (lives <= 0) { state='gameover'; showGameOver(); return; }
      }
    }
    for (const e of enemies) {
      if (e.y > canvas.height-80 || rect({x:e.x,y:e.y,w:e.w,h:e.h},{x:player.x,y:player.y,w:player.w,h:player.h})) { lives=0; state='gameover'; showGameOver(); return; }
    }
  }
  particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.vx*=0.94; p.vy*=0.94; p.life--; });
  particles = particles.filter(p => p.life > 0);
  if (enemies.length === 0) { levelTransition=true; level++; showLevelBanner(); setTimeout(()=>initLevel(),1600); }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars();
  if (state === 'playing' || state === 'gameover') {
    enemies.forEach(drawEnemy);
    bullets.forEach(b => { ctx.shadowColor='#7ec8e3'; ctx.shadowBlur=10; ctx.fillStyle='#7ec8e3'; ctx.fillRect(b.x-2,b.y-7,4,14); ctx.shadowBlur=0; });
    enemyBullets.forEach(b => { ctx.shadowColor='#ff5533'; ctx.shadowBlur=10; ctx.fillStyle='#ff5533'; ctx.fillRect(b.x-2,b.y-6,4,12); ctx.shadowBlur=0; });
    particles.forEach(p => { ctx.globalAlpha=p.life/p.maxLife; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,2.5,0,Math.PI*2); ctx.fill(); });
    ctx.globalAlpha = 1;
    if (player) drawPlayer(player);
    document.getElementById('score-ui').textContent = 'SCORE: ' + score;
    document.getElementById('level-ui').textContent = 'LEVEL: ' + level;
    document.getElementById('lives-ui').textContent = 'LIVES: ' + '♥️'.repeat(Math.max(0,lives));
  }
}

function loop() { update(); draw(); animId = requestAnimationFrame(loop); }

function startGame() {
  score=0; lives=3; level=1;
  document.getElementById('menu').style.display='none';
  document.getElementById('gameover').style.display='none';
  document.getElementById('ui').style.display='flex';
  initStars(); initLevel(); state='playing';
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function showGameOver() {
  document.getElementById('final-score').textContent = 'SCORE: ' + score;
  document.getElementById('gameover').style.display='block';
}

function showLevelBanner() {
  const el = document.getElementById('level-banner');
  el.textContent = 'LEVEL ' + level; el.style.opacity=1;
  setTimeout(() => el.style.opacity=0, 1300);
}

function toggleMoreInfo() {
  const tbl = document.getElementById('more-info-table');
  const arrow = document.getElementById('arrow');
  const visible = tbl.classList.toggle('visible');
  arrow.classList.toggle('open', visible);
}

document.addEventListener('keydown', e => {
  keys[e.key]=true;
  if ([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key]=false; });

document.getElementById('ui').style.display='none';
initStars();
(function menuLoop() {
  if (state !== 'menu') return;
  ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawStars(); requestAnimationFrame(menuLoop);
})();