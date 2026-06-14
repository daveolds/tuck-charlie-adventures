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
      lives: 3,
      moveSpeed: 5,
      jumpPower: -13,
      superJumpPower: -20,
      gravity: 0.55,
      floatGravity: 0.15,
      superJumpCooldown: 8000,
      appearance: {
        body: "#1a1a1a",
        bodyHighlight: "#2e2e3a",
        bodyShade: "#080808",
        tan: "#c07830",
        tanLight: "#d49050",
        muzzle: "#b07028",
        muzzleGray: null,
        belly: "#1a1a1a",
        ear: "#0e0e0e",
        nose: "#060404",
        eye: "#2a1608",
        collar: "#2a68c0",
        tag: "#b8ccd4",
        grayFace: false,
        pawWhite: false,
      },
    },
    charlie: {
      name: "Charlie",
      lives: 3,
      moveSpeed: 5,
      jumpPower: -13,
      superJumpPower: -20,
      gravity: 0.55,
      floatGravity: 0.15,
      superJumpCooldown: 8000,
      appearance: {
        body: "#5a3015",
        bodyHighlight: "#784020",
        bodyShade: "#3c1e0a",
        tan: null,
        tanLight: null,
        muzzle: "#e8e0ce",
        muzzleGray: "#c0b8a6",
        belly: "#6a3a1c",
        ear: "#482810",
        nose: "#3a1c08",
        eye: "#2a1808",
        collar: "#2a68c0",
        tag: "#d4b060",
        grayFace: true,
        pawWhite: true,
      },
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
    width: 115,
    height: 50,
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
    return {
      x: player.x + 14,
      y: player.y + 10,
      width: player.width - 24,
      height: player.height - 16,
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

  // ── DOG DRAWING ────────────────────────────────────────────────────────────
  // Draws a side-profile dachshund facing right.
  // px,py = top-left of bounding box; w=115, h=50
  // All design coordinates are in pixels relative to (px, py).
  function drawLegPair(baseX, legTopY, groundY2, swing1, swing2, ap) {
    const lowerColor = ap.tan || ap.bodyHighlight;
    const pawColor   = ap.pawWhite ? "#ede8e0" : lowerColor;
    const legLen     = groundY2 - legTopY;
    const swings     = [swing1, swing2];
    for (let i = 0; i < 2; i++) {
      const xOff = i * 5;
      const s    = swings[i];
      const kx   = baseX + xOff + s * 0.14;
      const ky   = legTopY + legLen * 0.5;
      const fx   = baseX + xOff + s * 0.34;
      const fy   = groundY2 + Math.abs(s) * 0.07;

      ctx.lineCap    = "round";
      ctx.strokeStyle = ap.bodyShade;
      ctx.lineWidth   = 7.5;
      ctx.beginPath();
      ctx.moveTo(baseX + xOff, legTopY);
      ctx.quadraticCurveTo(kx, ky - legLen * 0.1, kx, ky);
      ctx.stroke();

      ctx.strokeStyle = lowerColor;
      ctx.lineWidth   = 6.5;
      ctx.beginPath();
      ctx.moveTo(kx, ky);
      ctx.lineTo(fx, fy);
      ctx.stroke();

      ctx.fillStyle   = pawColor;
      ctx.beginPath();
      ctx.ellipse(fx, fy + 2, 7, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ap.bodyShade;
      ctx.lineWidth   = 0.6;
      ctx.stroke();
    }
  }

  function drawDachshund(px, py, w, h, ap, anim) {
    ctx.fillStyle = "lime";
    ctx.fillRect(px, py, w, h);
    const { legPhase, tailWag, airborne, moving, vy } = anim;
    const LA   = Math.sin(legPhase)             * (moving ? 8 : 0);
    const LB   = Math.sin(legPhase + Math.PI)   * (moving ? 8 : 0);
    const bob  = (moving && !airborne) ? Math.sin(legPhase * 2) * 0.8 : 0;
    const tilt = airborne ? (vy < 0 ? -0.05 : 0.03) : 0;

    ctx.save();
    ctx.translate(px, py + bob);
    if (tilt) {
      ctx.translate(w * 0.44, h * 0.5);
      ctx.rotate(tilt);
      ctx.translate(-w * 0.44, -h * 0.5);
    }

    // Anatomical landmarks (design px, relative to local origin)
    const GY  = h - 3;            // ground / paw level
    const BT  = h * 0.22;         // spine top
    const BB  = h * 0.84;         // belly bottom
    const HCX = w * 0.80;         // head center x
    const HCY = h * 0.40;         // head center y
    const HRX = w * 0.115;        // head rx
    const HRY = h * 0.28;         // head ry
    const FLX = w * 0.67;         // front leg x
    const BLX = w * 0.23;         // back leg x
    const LTY = BB + 1;           // leg top y
    // snout tip extends past right edge of hitbox (visual only)
    const STX = w * 0.98 + 18;    // snout tip x
    const STY = HCY + 2;          // snout tip y

    // ── GROUND SHADOW ─────────────────────────────────────────
    ctx.fillStyle = "rgba(0,0,0,0.13)";
    ctx.beginPath();
    ctx.ellipse(w * 0.48, GY + 5, w * 0.42, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── BACK LEGS ─────────────────────────────────────────────
    drawLegPair(BLX, LTY, GY, LB * 0.55, -LB * 0.45, ap);

    // ── TAIL ──────────────────────────────────────────────────
    ctx.save();
    ctx.translate(w * 0.09, h * 0.46);
    ctx.rotate(-0.25 + tailWag * 0.85);
    ctx.strokeStyle = ap.body;
    ctx.lineWidth   = 5.5;
    ctx.lineCap     = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-10, -12, -22, -5);
    ctx.stroke();
    ctx.strokeStyle = ap.bodyHighlight;
    ctx.lineWidth   = 2.8;
    ctx.beginPath();
    ctx.moveTo(-1, -1);
    ctx.quadraticCurveTo(-8, -9, -17, -4);
    ctx.stroke();
    ctx.restore();

    // ── BODY ──────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    // top spine line: tail → peak → withers
    ctx.moveTo(w * 0.09, h * 0.46);
    ctx.bezierCurveTo(w * 0.10, BT - 3, w * 0.38, BT - 5, w * 0.58, BT - 2);
    ctx.bezierCurveTo(w * 0.68, BT,     w * 0.76, BT + 1, w * 0.80, BT + 2);
    // chest front: curves down steeply (dachshund deep chest)
    ctx.bezierCurveTo(w * 0.84, BT + 4, w * 0.89, h * 0.38, w * 0.89, BB + 2);
    // belly: long flat underline
    ctx.bezierCurveTo(w * 0.87, BB + 9, w * 0.60, BB + 10, w * 0.44, BB + 10);
    ctx.bezierCurveTo(w * 0.24, BB + 9, w * 0.09, BB + 6,  w * 0.05, BB + 2);
    // rump back up to tail base
    ctx.bezierCurveTo(w * 0.03, h * 0.52, w * 0.06, h * 0.48, w * 0.09, h * 0.46);
    ctx.closePath();

    const bG = ctx.createLinearGradient(0, BT - 5, 0, BB + 10);
    bG.addColorStop(0,    ap.bodyHighlight);
    bG.addColorStop(0.38, ap.body);
    bG.addColorStop(1,    ap.bodyShade);
    ctx.fillStyle = bG;
    ctx.fill();
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth   = 1.2;
    ctx.stroke();
    ctx.restore();

    // Coat sheen (highlight stripe on back)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.16, BT);
    ctx.bezierCurveTo(w * 0.33, BT - 7, w * 0.57, BT - 5, w * 0.74, BT + 2);
    ctx.bezierCurveTo(w * 0.62, BT + 7, w * 0.36, BT + 6, w * 0.16, BT + 4);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fill();
    ctx.restore();

    // Belly (lighter underside strip)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(w * 0.46, BB + 9, w * 0.25, 5.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = ap.belly;
    ctx.fill();
    ctx.restore();

    // ── FRONT LEGS ────────────────────────────────────────────
    drawLegPair(FLX, LTY, GY, LA * 0.55, -LA * 0.45, ap);

    // ── NECK ──────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.79, BT + 3);
    ctx.bezierCurveTo(w * 0.83, BT - 3, HCX - HRX + 3, HCY - HRY + 4, HCX - HRX + 2, HCY - HRY + 10);
    ctx.bezierCurveTo(HCX - HRX + 5, HCY + HRY - 3, w * 0.88, BB - 3, w * 0.87, BB + 4);
    ctx.bezierCurveTo(w * 0.83, BB + 2, w * 0.79, BT + 10, w * 0.79, BT + 3);
    ctx.closePath();
    const nG = ctx.createLinearGradient(w * 0.79, BT, w * 0.79, BB);
    nG.addColorStop(0, ap.bodyHighlight);
    nG.addColorStop(1, ap.body);
    ctx.fillStyle   = nG;
    ctx.fill();
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
    ctx.restore();

    // Tan chest patch (Tucker only)
    if (ap.tan) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(w * 0.84, BB - 2, w * 0.055, h * 0.20, -0.1, 0, Math.PI * 2);
      ctx.fillStyle = ap.tan;
      ctx.fill();
      ctx.restore();
    }

    // ── EAR (drawn before head so head overlaps it) ────────────
    ctx.save();
    const EX = HCX - 3;
    const EY = HCY - HRY + 3;
    ctx.beginPath();
    ctx.moveTo(EX,      EY);
    ctx.bezierCurveTo(EX - 5,  EY + 7,  EX - 9,  EY + 18, EX - 6,  EY + 27);
    ctx.bezierCurveTo(EX + 2,  EY + 29, EX + 12, EY + 20, EX + 11, EY + 5);
    ctx.closePath();
    const eG = ctx.createLinearGradient(EX - 9, EY, EX + 12, EY);
    eG.addColorStop(0, ap.ear);
    eG.addColorStop(1, ap.body);
    ctx.fillStyle   = eG;
    ctx.fill();
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
    ctx.restore();

    // ── HEAD ──────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(HCX, HCY, HRX, HRY, 0, 0, Math.PI * 2);
    const hG = ctx.createRadialGradient(HCX - 3, HCY - 5, 2, HCX, HCY, HRX);
    hG.addColorStop(0,   ap.bodyHighlight);
    hG.addColorStop(0.7, ap.body);
    hG.addColorStop(1,   ap.bodyShade);
    ctx.fillStyle   = hG;
    ctx.fill();
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth   = 1.0;
    ctx.stroke();
    ctx.restore();

    // ── CHARLIE: SENIOR GRAY FACE ─────────────────────────────
    if (ap.grayFace) {
      ctx.save();
      // broad gray area covering most of the face
      ctx.beginPath();
      ctx.ellipse(HCX + 5, HCY - 1, HRX * 0.74, HRY * 0.80, 0.05, 0, Math.PI * 2);
      ctx.fillStyle = ap.muzzleGray;
      ctx.fill();
      // brighter white/cream around nose bridge
      ctx.beginPath();
      ctx.ellipse(HCX + 9, HCY + 3, HRX * 0.42, HRY * 0.44, 0.1, 0, Math.PI * 2);
      ctx.fillStyle = ap.muzzle;
      ctx.fill();
      ctx.restore();
    }

    // ── TUCKER: TAN EYEBROW SPOT ──────────────────────────────
    if (ap.tan) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(HCX + 5, HCY - HRY * 0.52, 3.8, 2.8, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = ap.tan;
      ctx.fill();
      ctx.restore();
    }

    // ── SNOUT (long dachshund muzzle) ─────────────────────────
    ctx.save();
    const SBX = HCX + HRX - 1;
    const SBY = HCY;
    ctx.beginPath();
    ctx.moveTo(SBX, SBY - 5);
    ctx.bezierCurveTo(SBX + 7, SBY - 7, STX - 5, STY - 5, STX, STY);
    ctx.bezierCurveTo(STX - 5, STY + 5, SBX + 7, SBY + 7, SBX, SBY + 5);
    ctx.closePath();

    if (ap.grayFace) {
      const g = ctx.createLinearGradient(SBX, 0, STX, 0);
      g.addColorStop(0, ap.muzzleGray);
      g.addColorStop(1, ap.muzzle);
      ctx.fillStyle = g;
    } else if (ap.tan) {
      const g = ctx.createLinearGradient(SBX, 0, STX, 0);
      g.addColorStop(0, ap.tanLight || ap.tan);
      g.addColorStop(1, ap.muzzle);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = ap.muzzle;
    }
    ctx.fill();
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
    ctx.restore();

    // ── EYE ───────────────────────────────────────────────────
    ctx.save();
    const EYX = HCX + 4;
    const EYY = HCY - 2;
    // sclera
    ctx.beginPath();
    ctx.ellipse(EYX, EYY, 4.5, 5.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#d4c898";
    ctx.fill();
    // iris
    ctx.beginPath();
    ctx.ellipse(EYX + 0.5, EYY, 3.4, 4.0, 0, 0, Math.PI * 2);
    ctx.fillStyle = ap.eye;
    ctx.fill();
    // pupil
    ctx.beginPath();
    ctx.ellipse(EYX + 0.5, EYY, 2.0, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#050303";
    ctx.fill();
    // catchlight
    ctx.beginPath();
    ctx.arc(EYX + 1.6, EYY - 1.6, 1.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();
    ctx.restore();

    // ── NOSE ──────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(STX - 1, STY - 1, 6, 5, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = ap.nose;
    ctx.fill();
    // nose highlight
    ctx.beginPath();
    ctx.ellipse(STX - 3, STY - 2.5, 2.0, 1.4, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fill();
    ctx.restore();

    // ── MOUTH LINE ────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.38)";
    ctx.lineWidth   = 1.0;
    ctx.lineCap     = "round";
    ctx.beginPath();
    ctx.moveTo(STX - 6, STY + 5);
    ctx.quadraticCurveTo(STX - 1, STY + 8, STX + 2, STY + 5);
    ctx.stroke();
    ctx.restore();

    // ── COLLAR ────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = ap.collar;
    ctx.lineWidth   = 4.5;
    ctx.lineCap     = "round";
    ctx.beginPath();
    ctx.moveTo(HCX - HRX * 0.82, HCY + HRY * 0.72);
    ctx.bezierCurveTo(HCX - 2, HCY + HRY + 3, HCX + 9, HCY + HRY + 3, HCX + HRX * 0.72, HCY + HRY * 0.72);
    ctx.stroke();
    // Collar highlight
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(HCX - HRX * 0.78, HCY + HRY * 0.68);
    ctx.bezierCurveTo(HCX - 1, HCY + HRY + 1, HCX + 8, HCY + HRY + 1, HCX + HRX * 0.68, HCY + HRY * 0.68);
    ctx.stroke();

    // Bone-shaped tag
    const TX = HCX + 2;
    const TY = HCY + HRY + 3;
    ctx.fillStyle   = ap.tag;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth   = 0.7;
    // four corner circles + central rect
    ctx.beginPath();
    ctx.arc(TX - 3.5, TY + 1.5, 3.2, 0, Math.PI * 2);
    ctx.arc(TX + 4.5, TY + 1.5, 3.2, 0, Math.PI * 2);
    ctx.arc(TX - 3.5, TY + 8,   3.2, 0, Math.PI * 2);
    ctx.arc(TX + 4.5, TY + 8,   3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(TX - 3.5, TY + 1.5, 8, 6.5);
    ctx.strokeRect(TX - 3.5, TY + 1.5, 8, 6.5);
    ctx.restore();

    ctx.restore(); // main save
  }

  // Legacy name kept so game loop call site works unchanged
  function drawLeg(ctx, x, footY, len, ap, freckles, tanLower) {
    const topY = footY - len;
    const midY = footY - len * 0.38;

    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, midY);
    ctx.stroke();

    ctx.strokeStyle = tanLower || ap.bodyHighlight;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, midY);
    ctx.lineTo(x, footY);
    ctx.stroke();

    const pawColor = ap.pawWhite ? "#f0ece6" : (tanLower || ap.bodyHighlight);
    ctx.fillStyle = pawColor;
    ctx.beginPath();
    ctx.ellipse(x, footY + 1.5, 5.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    if (freckles) {
      ctx.fillStyle = ap.bodyShade;
      ctx.beginPath();
      ctx.arc(x - 2, footY, 1, 0, Math.PI * 2);
      ctx.arc(x + 1, footY - 1, 0.8, 0, Math.PI * 2);
      ctx.arc(x + 2, footY + 1, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSideProfileDachshund(x, y, w, h, ap, anim) {
    const { legPhase, tailWag, airborne, moving } = anim;
    const legSwing = moving || !airborne ? Math.sin(legPhase) * 7 : -4;
    const legSwing2 = moving || !airborne ? Math.sin(legPhase + Math.PI) * 7 : -2;
    const bodyBob = moving && !airborne ? Math.sin(legPhase * 2) * 0.8 : 0;
    const jumpTilt = airborne ? (anim.vy < 0 ? -0.06 : 0.04) : 0;

    const ox = x;
    const oy = y + bodyBob;
    const bodyY = oy + h * 0.52;
    const bodyH = h * 0.38;
    const headX = ox + w * 0.82;
    const headY = oy + h * 0.28;
    const tailBaseX = ox + w * 0.06;
    const tailBaseY = oy + h * 0.42;
    const footY = oy + h * 0.88;

    ctx.save();
    ctx.translate(ox + w * 0.45, oy + h * 0.5);
    ctx.rotate(jumpTilt);
    ctx.translate(-(ox + w * 0.45), -(oy + h * 0.5));

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(ox + w * 0.48, footY + 4, w * 0.38, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(tailBaseX, tailBaseY);
    ctx.rotate(tailWag);
    ctx.strokeStyle = ap.body;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-14, -6, -22, 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = ap.bodyHighlight;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-12, -4, -18, 1);
    ctx.stroke();
    ctx.restore();

    const backLegX = ox + w * 0.2;
    const frontLegX = ox + w * 0.58;
    const legTan = ap.tan || null;

    drawLeg(ctx, backLegX, footY, h * 0.3 + legSwing2, ap, ap.freckles && ap.pawWhite, legTan);

    ctx.fillStyle = ap.body;
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox + w * 0.04, bodyY);
    ctx.bezierCurveTo(
      ox + w * 0.15, bodyY - bodyH * 0.9,
      ox + w * 0.55, bodyY - bodyH * 1.05,
      ox + w * 0.72, bodyY - bodyH * 0.35
    );
    ctx.bezierCurveTo(
      ox + w * 0.78, bodyY - bodyH * 0.1,
      ox + w * 0.88, bodyY + bodyH * 0.15,
      ox + w * 0.92, bodyY + bodyH * 0.05
    );
    ctx.bezierCurveTo(
      ox + w * 0.88, bodyY + bodyH * 0.55,
      ox + w * 0.5, bodyY + bodyH * 0.75,
      ox + w * 0.04, bodyY + bodyH * 0.35
    );
    ctx.closePath();
    const bodyGrad = ctx.createLinearGradient(ox, bodyY - bodyH, ox, bodyY + bodyH);
    bodyGrad.addColorStop(0, ap.bodyHighlight);
    bodyGrad.addColorStop(0.5, ap.body);
    bodyGrad.addColorStop(1, ap.bodyShade);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = ap.belly;
    ctx.beginPath();
    ctx.ellipse(ox + w * 0.42, bodyY + bodyH * 0.2, w * 0.22, bodyH * 0.28, 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ap.body;
    ctx.beginPath();
    ctx.moveTo(ox + w * 0.72, bodyY - bodyH * 0.2);
    ctx.quadraticCurveTo(ox + w * 0.78, bodyY - bodyH * 0.45, headX - w * 0.02, headY);
    ctx.lineTo(headX - w * 0.04, headY + h * 0.12);
    ctx.quadraticCurveTo(ox + w * 0.74, bodyY + bodyH * 0.1, ox + w * 0.68, bodyY + bodyH * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = ap.ear;
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headX - w * 0.02, headY + h * 0.01);
    ctx.quadraticCurveTo(headX - w * 0.08, headY + h * 0.24, headX - w * 0.01, headY + h * 0.32);
    ctx.quadraticCurveTo(headX + w * 0.06, headY + h * 0.22, headX + w * 0.04, headY + h * 0.03);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = ap.grayFace ? ap.muzzleGray : ap.muzzle;
    ctx.beginPath();
    ctx.moveTo(headX - w * 0.01, headY - h * 0.04);
    ctx.quadraticCurveTo(headX + w * 0.16, headY + h * 0.01, headX + w * 0.19, headY + h * 0.1);
    ctx.quadraticCurveTo(headX + w * 0.16, headY + h * 0.16, headX - w * 0.01, headY + h * 0.12);
    ctx.quadraticCurveTo(headX - w * 0.05, headY + h * 0.06, headX - w * 0.01, headY - h * 0.04);
    ctx.closePath();
    ctx.fill();

    if (ap.grayFace) {
      ctx.fillStyle = ap.muzzle;
      ctx.beginPath();
      ctx.ellipse(headX + w * 0.04, headY + h * 0.01, w * 0.08, h * 0.09, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ap.muzzleGray;
      ctx.beginPath();
      ctx.ellipse(headX + w * 0.02, headY - h * 0.03, w * 0.05, h * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (ap.tan) {
      ctx.fillStyle = ap.tan;
      ctx.beginPath();
      ctx.ellipse(headX + w * 0.05, headY - h * 0.045, w * 0.028, h * 0.028, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ap.tanLight;
      ctx.beginPath();
      ctx.ellipse(ox + w * 0.66, bodyY + bodyH * 0.08, w * 0.09, bodyH * 0.38, -0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = ap.eye;
    ctx.beginPath();
    ctx.ellipse(headX + w * 0.03, headY + h * 0.01, 3.2, 3.8, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(headX + w * 0.04, headY + h * 0.005, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ap.nose;
    ctx.beginPath();
    ctx.ellipse(headX + w * 0.175, headY + h * 0.075, 5, 3.8, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ap.bodyShade;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(headX + w * 0.12, headY + h * 0.09);
    ctx.lineTo(headX + w * 0.145, headY + h * 0.075);
    ctx.stroke();

    ctx.strokeStyle = ap.collar;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(headX - w * 0.02, headY + h * 0.11);
    ctx.quadraticCurveTo(headX + w * 0.04, headY + h * 0.15, headX + w * 0.06, headY + h * 0.11);
    ctx.stroke();

    ctx.fillStyle = ap.tag;
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(headX + w * 0.01, headY + h * 0.15);
    ctx.lineTo(headX + w * 0.01, headY + h * 0.19);
    ctx.lineTo(headX + w * 0.04, headY + h * 0.21);
    ctx.lineTo(headX + w * 0.07, headY + h * 0.19);
    ctx.lineTo(headX + w * 0.07, headY + h * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawLeg(ctx, frontLegX, footY, h * 0.28 + legSwing, ap, ap.freckles && ap.pawWhite, legTan);

    ctx.restore();
  }

  function drawDog(x, y, charKey, moving, vy) {
    const c        = CHARACTERS[charKey];
    const legSpeed = moving ? 88 : 140;
    const legPhase = animTime / legSpeed;
    const tailWag  = Math.sin(animTime / 100) * 0.60;
    const airborne = !player.grounded;

    drawDachshund(x, y, player.width, player.height, c.appearance, {
      legPhase,
      tailWag,
      airborne,
      moving,
      vy,
    });
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
      drawDog(player.x, player.y, selectedChar, moving || !player.grounded, player.vy);
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
