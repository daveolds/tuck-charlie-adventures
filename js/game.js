(function () {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const container = document.getElementById("game-container");
  const overlay = document.getElementById("overlay");
  const controlsPanel = document.getElementById("controls-panel");
  const selectPanel = document.getElementById("select-panel");
  const hud = document.getElementById("hud");
  const gameOverEl = document.getElementById("game-over");
  const flashOverlay = document.getElementById("flash-overlay");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const finalScoreEl = document.getElementById("final-score");
  const newRecordEl = document.getElementById("new-record");
  const heartsEl = document.getElementById("hearts");
  const cooldownFillEl = document.getElementById("cooldown-fill");
  const nextBtn = document.getElementById("next-btn");
  const backBtn = document.getElementById("back-btn");
  const startBtn = document.getElementById("start-btn");
  const retryBtn = document.getElementById("retry-btn");
  const charBtns = document.querySelectorAll(".char-btn");

  const BASE_W = 800;
  const BASE_H = 450;
  const SCROLL_SPEED = 4;
  const INITIAL_SPAWN_MS = 2500;
  const MIN_SPAWN_MS = 800;
  const INVINCIBLE_MS = 3000;
  const BEST_TIME_KEY = "tuckerCharlieBestTime";

  const CHARACTERS = {
    tucker: {
      name: "Tucker",
      fur: "#1a1a1a",
      furLight: "#333333",
      belly: "#2a2a2a",
      lives: 3,
      moveSpeed: 5,
      jumpPower: -13,
      superJumpPower: -20,
      gravity: 0.55,
      floatGravity: 0.15,
      superJumpCooldown: 8000,
    },
    charlie: {
      name: "Charlie",
      fur: "#8b5a2b",
      furLight: "#c49a6c",
      belly: "#f5e6d3",
      lives: 3,
      moveSpeed: 5,
      jumpPower: -13,
      superJumpPower: -20,
      gravity: 0.55,
      floatGravity: 0.15,
      superJumpCooldown: 8000,
    },
  };

  const OBSTACLE_TYPES = {
    hydrant: {
      width: 28,
      height: 40,
      draw(ctx, x, y, w, h) {
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x, y + h * 0.15, w, h * 0.85);
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.12, w * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#922b21";
        ctx.fillRect(x + w * 0.15, y + h * 0.45, w * 0.7, h * 0.08);
        ctx.fillRect(x - w * 0.15, y + h * 0.55, w * 0.35, h * 0.06);
        ctx.fillRect(x + w * 0.8, y + h * 0.55, w * 0.35, h * 0.06);
      },
    },
  };

  let W = BASE_W;
  let H = BASE_H;
  let groundY = H * 0.85;

  let selectedChar = "tucker";
  let running = false;
  let lives = 3;
  let elapsedMs = 0;
  let scoreSeconds = 0;
  let bestTime = Number(localStorage.getItem(BEST_TIME_KEY) || 0);
  let invincibleUntil = 0;
  let superJumpReadyAt = 0;
  let isSuperJumping = false;
  let spawnTimerMs = 0;
  let currentSpawnInterval = INITIAL_SPAWN_MS;
  let animTime = 0;
  let flashUntil = 0;
  let parallaxOffset = 0;

  const keys = { left: false, right: false, jump: false, superJump: false };
  const jumpPressed = { jump: false, superJump: false };

  let obstacles = [];

  const player = {
    x: 120,
    y: 0,
    vx: 0,
    vy: 0,
    width: 44,
    height: 36,
    grounded: true,
  };

  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    W = Math.max(320, Math.round(rect.width));
    H = Math.max(180, Math.round(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * 0.85;
  }

  function showPanel(panel) {
    controlsPanel.classList.toggle("hidden", panel !== "controls");
    selectPanel.classList.toggle("hidden", panel !== "select");
  }

  function getStats() {
    return CHARACTERS[selectedChar];
  }

  function resetGame() {
    const stats = getStats();
    lives = stats.lives;
    elapsedMs = 0;
    scoreSeconds = 0;
    invincibleUntil = 0;
    superJumpReadyAt = 0;
    isSuperJumping = false;
    spawnTimerMs = 0;
    currentSpawnInterval = INITIAL_SPAWN_MS;
    animTime = 0;
    flashUntil = 0;
    parallaxOffset = 0;
    obstacles = [];

    player.x = W * 0.15;
    player.y = groundY - player.height;
    player.vx = 0;
    player.vy = 0;
    player.grounded = true;

    updateHud();
  }

  function startGame() {
    resetGame();
    overlay.classList.add("hidden");
    gameOverEl.classList.add("hidden");
    hud.classList.remove("hidden");
    running = true;
    requestAnimationFrame(gameLoop);
  }

  function endGame() {
    running = false;
    const isNewRecord = scoreSeconds > bestTime;
    if (isNewRecord) {
      bestTime = scoreSeconds;
      localStorage.setItem(BEST_TIME_KEY, String(bestTime));
    }
    finalScoreEl.textContent = `Time: ${scoreSeconds}s`;
    newRecordEl.classList.toggle("hidden", !isNewRecord);
    hud.classList.add("hidden");
    gameOverEl.classList.remove("hidden");
  }

  function updateHud() {
    heartsEl.innerHTML = "";
    const stats = getStats();
    for (let i = 0; i < stats.lives; i++) {
      const heart = document.createElement("span");
      heart.className = i < lives ? "heart" : "heart empty";
      heart.textContent = "♥";
      heartsEl.appendChild(heart);
    }
    scoreEl.textContent = `${scoreSeconds}s`;
    highScoreEl.textContent = `Best: ${bestTime}s`;

    const now = Date.now();
    const cooldown = stats.superJumpCooldown;
    let fillPct = 100;
    if (now < superJumpReadyAt) {
      fillPct = Math.max(0, ((superJumpReadyAt - now) / cooldown) * 100);
    }
    cooldownFillEl.style.width = `${100 - fillPct}%`;
  }

  function triggerHitFlash() {
    flashUntil = Date.now() + 600;
    flashOverlay.classList.remove("hidden");
  }

  function updateFlash() {
    if (flashUntil <= 0) return;
    const remaining = flashUntil - Date.now();
    if (remaining <= 0) {
      flashUntil = 0;
      flashOverlay.classList.add("hidden");
      flashOverlay.style.opacity = "";
      return;
    }
    const pulse = Math.sin((600 - remaining) / 80 * Math.PI);
    flashOverlay.style.opacity = pulse > 0 ? "1" : "0.15";
  }

  function makeObstacle() {
    const typeKey = "hydrant";
    const def = OBSTACLE_TYPES[typeKey];
    return {
      type: typeKey,
      x: W + 20,
      y: groundY - def.height,
      width: def.width,
      height: def.height,
    };
  }

  function spawnObstacle() {
    obstacles.push(makeObstacle());
  }

  function updateDifficulty() {
    const shrink = Math.min(elapsedMs / 60000, 1) * (INITIAL_SPAWN_MS - MIN_SPAWN_MS);
    currentSpawnInterval = INITIAL_SPAWN_MS - shrink;
  }

  function updateObstacles(dt) {
    for (const obs of obstacles) {
      obs.x -= SCROLL_SPEED;
    }
    obstacles = obstacles.filter((obs) => obs.x + obs.width > -40);

    spawnTimerMs += dt;
    if (spawnTimerMs >= currentSpawnInterval) {
      spawnObstacle();
      spawnTimerMs = 0;
    }
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function getPlayerHitbox() {
    const padX = 6;
    const padY = 4;
    return {
      x: player.x + padX,
      y: player.y + padY,
      width: player.width - padX * 2,
      height: player.height - padY,
    };
  }

  function checkCollisions() {
    if (Date.now() < invincibleUntil) return;

    const hitbox = getPlayerHitbox();
    for (const obs of obstacles) {
      if (rectsOverlap(hitbox, obs)) {
        lives -= 1;
        invincibleUntil = Date.now() + INVINCIBLE_MS;
        triggerHitFlash();
        updateHud();
        if (lives <= 0) {
          endGame();
        }
        return;
      }
    }
  }

  function tryJump() {
    if (!player.grounded) return;
    const stats = getStats();
    player.vy = stats.jumpPower;
    player.grounded = false;
    isSuperJumping = false;
  }

  function trySuperJump() {
    if (!player.grounded) return;
    const stats = getStats();
    const now = Date.now();
    if (now < superJumpReadyAt) return;

    player.vy = stats.superJumpPower;
    player.grounded = false;
    isSuperJumping = true;
    superJumpReadyAt = now + stats.superJumpCooldown;
    updateHud();
  }

  function updatePlayer() {
    const stats = getStats();

    if (keys.left) player.vx = -stats.moveSpeed;
    else if (keys.right) player.vx = stats.moveSpeed;
    else player.vx *= 0.75;

    if (keys.jump && !jumpPressed.jump) {
      tryJump();
      jumpPressed.jump = true;
    }
    if (!keys.jump) jumpPressed.jump = false;

    if (keys.superJump && !jumpPressed.superJump) {
      trySuperJump();
      jumpPressed.superJump = true;
    }
    if (!keys.superJump) jumpPressed.superJump = false;

    const gravity = isSuperJumping && player.vy > 0 ? stats.floatGravity : stats.gravity;
    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    const minX = 10;
    const maxX = W - player.width - 10;
    if (player.x < minX) player.x = minX;
    if (player.x > maxX) player.x = maxX;

    const floor = groundY - player.height;
    if (player.y >= floor) {
      player.y = floor;
      player.vy = 0;
      player.grounded = true;
      isSuperJumping = false;
    } else {
      player.grounded = false;
    }
  }

  function drawBackground() {
    parallaxOffset += SCROLL_SPEED * 0.3;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#7ec8e3");
    sky.addColorStop(0.55, "#a8d8ea");
    sky.addColorStop(1, "#d4ecf7");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    const cloudSpacing = 200;
    for (let i = -1; i < 6; i++) {
      const cx = ((i * cloudSpacing - parallaxOffset * 0.2) % (W + cloudSpacing) + W + cloudSpacing) % (W + cloudSpacing) - 50;
      const cy = 40 + (i % 3) * 25;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.arc(cx + 18, cy - 8, 16, 0, Math.PI * 2);
      ctx.arc(cx + 36, cy, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    const houseSpacing = 180;
    for (let i = -1; i < 8; i++) {
      const hx = ((i * houseSpacing - parallaxOffset * 0.5) % (W + houseSpacing) + W + houseSpacing) % (W + houseSpacing) - 60;
      const hy = groundY - 90 - (i % 3) * 15;
      const hw = 70 + (i % 2) * 20;
      const hh = 60 + (i % 3) * 10;

      ctx.fillStyle = i % 2 === 0 ? "#b8c5d6" : "#a8b8cc";
      ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = i % 2 === 0 ? "#8a9bb0" : "#7a8da4";
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy);
      ctx.lineTo(hx + hw / 2, hy - 35);
      ctx.lineTo(hx + hw + 8, hy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffd166";
      ctx.fillRect(hx + hw * 0.35, hy + hh * 0.35, hw * 0.2, hh * 0.25);
    }

    ctx.fillStyle = "#6b7b8c";
    ctx.fillRect(0, groundY - 8, W, 8);

    ctx.fillStyle = "#c4b5a0";
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    for (let sx = -((parallaxOffset * 0.8) % 60); sx < W; sx += 60) {
      ctx.beginPath();
      ctx.moveTo(sx, groundY + 12);
      ctx.lineTo(sx + 30, groundY + 12);
      ctx.stroke();
    }
  }

  function drawObstacle(obs) {
    const def = OBSTACLE_TYPES[obs.type];
    if (def && def.draw) {
      def.draw(ctx, obs.x, obs.y, obs.width, obs.height);
    }
  }

  function drawDog(x, y, charKey, moving) {
    const c = CHARACTERS[charKey];
    const w = player.width;
    const h = player.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const legSpeed = moving ? 100 : 160;
    const legOffset = Math.sin(animTime / legSpeed) * (moving ? 5 : 2);
    const tailWag = Math.sin(animTime / 120) * 0.45;
    const lean = moving ? 0.06 : 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(lean);

    ctx.save();
    ctx.translate(-w * 0.38, 4);
    ctx.rotate(tailWag);
    ctx.strokeStyle = c.fur;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-12, -8, -18, 4);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = c.fur;
    ctx.beginPath();
    ctx.ellipse(0, 2, w * 0.42, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c.belly;
    ctx.beginPath();
    ctx.ellipse(0, 6, w * 0.22, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c.furLight;
    ctx.beginPath();
    ctx.ellipse(-14, -6, 9, 12, -0.3, 0, Math.PI * 2);
    ctx.ellipse(14, -6, 9, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c.fur;
    ctx.beginPath();
    ctx.arc(0, -10, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(-5, -12, 3, 0, Math.PI * 2);
    ctx.arc(5, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.ellipse(0, -6, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = c.fur;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, 14);
    ctx.lineTo(-12, 22 + legOffset);
    ctx.moveTo(10, 14);
    ctx.lineTo(12, 22 - legOffset);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(c.name, 0, -24);

    ctx.restore();
  }

  let lastFrameTime = 0;

  function gameLoop(timestamp) {
    if (!running) return;

    const dt = lastFrameTime ? timestamp - lastFrameTime : 16;
    lastFrameTime = timestamp;
    animTime += dt;

    updatePlayer();
    updateObstacles(dt);
    checkCollisions();
    updateFlash();

    elapsedMs += dt;
    const newScore = Math.floor(elapsedMs / 1000);
    if (newScore !== scoreSeconds) {
      scoreSeconds = newScore;
      updateDifficulty();
    }
    updateHud();

    drawBackground();
    for (const obs of obstacles) drawObstacle(obs);

    const moving = Math.abs(player.vx) > 0.5;
    const invincible = Date.now() < invincibleUntil;
    const flickerVisible = !invincible || Math.floor(Date.now() / 100) % 2 === 0;
    if (flickerVisible) {
      drawDog(player.x, player.y, selectedChar, moving || !player.grounded);
    }

    requestAnimationFrame(gameLoop);
  }

  nextBtn.addEventListener("click", () => showPanel("select"));
  backBtn.addEventListener("click", () => showPanel("controls"));
  startBtn.addEventListener("click", startGame);

  retryBtn.addEventListener("click", () => {
    gameOverEl.classList.add("hidden");
    overlay.classList.remove("hidden");
    showPanel("select");
  });

  charBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedChar = btn.dataset.char;
      charBtns.forEach((b) => {
        const selected = b === btn;
        b.classList.toggle("selected", selected);
        b.setAttribute("aria-pressed", String(selected));
      });
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
    if (e.code === "Space") {
      keys.jump = true;
      e.preventDefault();
    }
    if (e.code === "ArrowUp" || e.code === "KeyW") {
      keys.superJump = true;
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    if (e.code === "Space") keys.jump = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.superJump = false;
  });

  window.addEventListener("resize", () => {
    const oldGround = groundY;
    resizeCanvas();
    if (!running) {
      player.y = groundY - player.height;
    } else {
      const ratio = groundY / oldGround;
      player.y *= ratio;
    }
  });

  resizeCanvas();
  showPanel("controls");
  highScoreEl.textContent = `Best: ${bestTime}s`;
})();
