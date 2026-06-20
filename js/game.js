(function () {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  if (ctx.imageSmoothingQuality) {
    ctx.imageSmoothingQuality = "high";
  }
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
  const pauseMenu = document.getElementById("pause-menu");
  const resumeBtn = document.getElementById("resume-btn");
  const exitBtn = document.getElementById("exit-btn");
  const touchControls = document.getElementById("touch-controls");
  const touchLeftBtn = document.getElementById("touch-left");
  const touchRightBtn = document.getElementById("touch-right");
  const touchJumpBtn = document.getElementById("touch-jump");
  const touchSuperBtn = document.getElementById("touch-super");
  const charBtns = document.querySelectorAll(".char-btn");

  const BASE_W = 800;
  const BASE_H = 450;
  const GAME_SPEED = 1.2;
  const SCROLL_SPEED = 4 * GAME_SPEED;
  const STEP_MS = 1000 / 60;
  const MAX_FRAME_MS = 100;
  const MAX_SIM_STEPS = 5;
  const INITIAL_SPAWN_MS = 2500;
  const MIN_SPAWN_MS = 800;
  const INVINCIBLE_MS = 3000;
  const BEST_TIME_KEY = "tuckerCharlieBestTime";
  const BONE_SPAWN_MS = 4160;
  const BONE_BONUS = 5;
  const BONE_W = 44;
  const BONE_H = 22;

  const CHARACTERS = {
    tucker: {
      name: "Tucker",
      lives: 3,
      moveSpeed: 6,
      jumpPower: -16,
      superJumpPower: -24,
      gravity: 0.66,
      floatGravity: 0.18,
      superJumpCooldown: 8000,
      appearance: {
        body: "#1a1a1a",
        bodyHighlight: "#2e2e3a",
        bodyShade: "#080808",
        tan: "#D2B48C",
        tanLight: "#E8D4B8",
        muzzle: "#D2B48C",
        muzzleGray: null,
        belly: "#2a2a2a",
        ear: "#0e0e0e",
        nose: "#111111",
        eye: "#1a1a1a",
        collar: "#1e3a8a",
        tag: "#c0ccd6",
        grayFace: false,
        pawWhite: false,
      },
    },
    charlie: {
      name: "Charlie",
      lives: 3,
      moveSpeed: 6,
      jumpPower: -16,
      superJumpPower: -24,
      gravity: 0.66,
      floatGravity: 0.18,
      superJumpCooldown: 8000,
      appearance: {
        body: "#4A2306",
        bodyHighlight: "#5C2E0B",
        bodyShade: "#2E1502",
        tan: "#D2B48C",
        tanLight: "#E8D4B8",
        muzzle: "#C4B5A3",
        muzzleGray: "#B8A896",
        belly: "#B8A896",
        ear: "#3A1C04",
        nose: "#111111",
        eye: "#2a1808",
        collar: "#1e3a8a",
        tag: "#c0ccd6",
        grayFace: true,
        pawWhite: true,
      },
    },
  };

  let W = BASE_W;
  let H = BASE_H;
  let groundY = H * 0.85;
  let displayScale = 1;
  let displayOffsetX = 0;
  let displayOffsetY = 0;
  let devicePixelRatio = 1;

  let selectedChar = "tucker";
  let running = false;
  let paused = false;
  let lives = 3;
  let elapsedMs = 0;
  let scoreSeconds = 0;
  let bonusPoints = 0;
  let bestTime = Number(localStorage.getItem(BEST_TIME_KEY) || 0);
  let invincibleUntil = 0;
  let superJumpReadyAt = 0;
  let isSuperJumping = false;
  let spawnTimerMs = 0;
  let currentSpawnInterval = INITIAL_SPAWN_MS;
  let animTime = 0;
  let flashUntil = 0;
  let parallaxOffset = 0;
  let simAccumulator = 0;

  const keys = { left: false, right: false, jump: false, superJump: false };
  const jumpPressed = { jump: false, superJump: false };

  let obstacles = [];
  let bones = [];
  let boneSpawnTimerMs = 0;
  let scorePopups = [];

  const player = {
    x: 120,
    y: 0,
    vx: 0,
    vy: 0,
    width: 75,
    height: 50,
    grounded: true,
  };

  function resizeCanvas() {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    devicePixelRatio = window.devicePixelRatio || 1;

    const controlsReserve = touchControls.classList.contains("visible")
      ? touchControls.offsetHeight
      : 0;
    const availableH = Math.max(120, viewportH - controlsReserve);

    displayScale = Math.min(viewportW / BASE_W, availableH / BASE_H);
    const drawW = BASE_W * displayScale;
    const drawH = BASE_H * displayScale;
    displayOffsetX = (viewportW - drawW) / 2;
    displayOffsetY = (availableH - drawH) / 2;

    canvas.width = Math.max(1, Math.round(viewportW * devicePixelRatio));
    canvas.height = Math.max(1, Math.round(viewportH * devicePixelRatio));
    canvas.style.width = `${viewportW}px`;
    canvas.style.height = `${viewportH}px`;

    W = BASE_W;
    H = BASE_H;
    groundY = H * 0.85;

    if (!running) {
      player.y = groundY - player.height;
    }
  }

  function setTouchControlsVisible(visible) {
    touchControls.classList.toggle("visible", visible);
    resizeCanvas();
  }

  function beginFrame() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0f1418";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(
      displayScale * devicePixelRatio,
      0,
      0,
      displayScale * devicePixelRatio,
      displayOffsetX * devicePixelRatio,
      displayOffsetY * devicePixelRatio
    );
  }

  function showPanel(panel) {
    controlsPanel.classList.toggle("hidden", panel !== "controls");
    selectPanel.classList.toggle("hidden", panel !== "select");
    if (panel === "select") {
      startSelectPreviewLoop();
    } else {
      stopSelectPreviewLoop();
    }
  }

  function getStats() {
    return CHARACTERS[selectedChar];
  }

  function resetGame() {
    const stats = getStats();
    lives = stats.lives;
    elapsedMs = 0;
    scoreSeconds = 0;
    bonusPoints = 0;
    invincibleUntil = 0;
    superJumpReadyAt = 0;
    isSuperJumping = false;
    spawnTimerMs = 0;
    currentSpawnInterval = INITIAL_SPAWN_MS;
    animTime = 0;
    flashUntil = 0;
    parallaxOffset = 0;
    simAccumulator = 0;
    obstacles = [];
    bones = [];
    boneSpawnTimerMs = 0;
    scorePopups = [];

    player.x = W * 0.15;
    player.y = groundY - player.height;
    player.vx = 0;
    player.vy = 0;
    player.grounded = true;

    updateHud();
  }

  function startGame() {
    stopSelectPreviewLoop();
    resetGame();
    paused = false;
    pauseMenu.classList.add("hidden");
    overlay.classList.add("hidden");
    gameOverEl.classList.add("hidden");
    hud.classList.remove("hidden");
    setTouchControlsVisible(true);
    running = true;
    lastFrameTime = 0;
    simAccumulator = 0;
    requestAnimationFrame(gameLoop);
  }

  function endGame() {
    running = false;
    paused = false;
    pauseMenu.classList.add("hidden");
    const isNewRecord = scoreSeconds > bestTime;
    if (isNewRecord) {
      bestTime = scoreSeconds;
      localStorage.setItem(BEST_TIME_KEY, String(bestTime));
    }
    finalScoreEl.textContent = `Time: ${scoreSeconds}s · Bones: +${bonusPoints}`;
    newRecordEl.classList.toggle("hidden", !isNewRecord);
    hud.classList.add("hidden");
    setTouchControlsVisible(false);
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
    scoreEl.textContent = bonusPoints > 0 ? `${scoreSeconds}s (+${bonusPoints})` : `${scoreSeconds}s`;
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
    const typeKey = World.pickRandomObstacleType();
    const def = World.OBSTACLE_TYPES[typeKey];
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

  function makeBone() {
    const elevated = Math.random() < 0.38;
    const centerY = elevated
      ? groundY - 200 - Math.random() * 35
      : groundY - 90 - Math.random() * 30;
    return {
      x: W + 30,
      y: centerY - BONE_H / 2,
      width: BONE_W,
      height: BONE_H,
      elevated,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function spawnBone() {
    bones.push(makeBone());
  }

  function updateBones(dt) {
    for (const bone of bones) {
      bone.x -= SCROLL_SPEED;
    }
    bones = bones.filter((bone) => bone.x + bone.width > -30);

    boneSpawnTimerMs += dt;
    if (boneSpawnTimerMs >= BONE_SPAWN_MS) {
      spawnBone();
      boneSpawnTimerMs = 0;
    }
  }

  function collectBone(bone) {
    bonusPoints += BONE_BONUS;
    scorePopups.push({
      text: "+5",
      x: bone.x + bone.width / 2,
      y: bone.y,
      life: 900,
      duration: 900,
    });
    updateHud();
  }

  function checkBoneCollisions() {
    const hitbox = getPlayerHitbox();
    bones = bones.filter((bone) => {
      if (rectsOverlap(hitbox, bone)) {
        collectBone(bone);
        return false;
      }
      return true;
    });
  }

  function updateScorePopups(dt) {
    for (const popup of scorePopups) {
      popup.life -= dt;
    }
    scorePopups = scorePopups.filter((popup) => popup.life > 0);
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

  function pauseGame() {
    if (!running || paused) return;
    paused = true;
    pauseMenu.classList.remove("hidden");
    setTouchControlsVisible(false);
  }

  function resumeGame() {
    if (!running || !paused) return;
    paused = false;
    pauseMenu.classList.add("hidden");
    setTouchControlsVisible(true);
    lastFrameTime = 0;
    simAccumulator = 0;
  }

  function exitToMenu() {
    running = false;
    paused = false;
    pauseMenu.classList.add("hidden");
    hud.classList.add("hidden");
    setTouchControlsVisible(false);
    overlay.classList.remove("hidden");
    showPanel("select");
  }

  function drawBackground(renderParallax) {
    World.drawBackground(ctx, W, H, groundY, renderParallax, animTime);
  }

  function drawObstacle(obs, renderX) {
    if (renderX === undefined) {
      World.drawObstacle(ctx, obs);
      return;
    }
    World.drawObstacle(ctx, { ...obs, x: renderX });
  }

  // ── DOG DRAWING ────────────────────────────────────────────────────────────
  // Side-profile dachshund facing right, styled after the dachshund-jumper reference.
  function drawDachshund(drawCtx, px, py, w, h, ap, anim) {
    const { animationFrame, moving, airborne } = anim;
    const walking = moving && !airborne;
    const tailSwing = Math.sin(animationFrame * 0.12) * 3 * (w / 60);

    const sx = w / 60;
    const sy = h / 40;
    const tan = ap.tan || ap.muzzle;
    const pawColor = ap.pawWhite ? (ap.muzzleGray || "#F0ECE6") : tan;

    function legBob(phase) {
      if (!walking) return 0;
      return Math.sin(animationFrame * 0.15 + phase) * 3 * sy;
    }

    function drawLeg(legX, phase) {
      const legY = (h - 8 * sy) + legBob(phase);
      drawCtx.fillStyle = ap.body;
      drawCtx.fillRect(legX, legY, 3.5 * sx, 6 * sy);
      drawCtx.fillStyle = pawColor;
      drawCtx.beginPath();
      drawCtx.roundRect(legX - 1 * sx, legY + 5 * sy, 5.5 * sx, 3 * sy, 1);
      drawCtx.fill();
    }

    function paintShadow(centerX, baseY, scale, alpha) {
      drawCtx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      drawCtx.beginPath();
      drawCtx.ellipse(centerX, baseY, (w / 2.2) * scale, 5 * sy * scale, 0, 0, Math.PI * 2);
      drawCtx.fill();
    }

    drawCtx.save();

    if (anim.shadowGroundY !== undefined) {
      const feetY = py + h - 2 * sy;
      const elevation = Math.max(0, anim.shadowGroundY - feetY);
      const t = Math.min(1, elevation / 110);
      const scale = 1 - t * 0.45;
      const alpha = 0.2 * (1 - t * 0.5);
      paintShadow(px + w / 2, anim.shadowGroundY, scale, alpha);
    }

    drawCtx.translate(px, py);

    if (anim.shadowGroundY === undefined) {
      paintShadow(w / 2, h - 2 * sy, 1, 0.2);
    }

    // Tail (behind body)
    const tailGrad = drawCtx.createLinearGradient(5 * sx, 16 * sy, -10 * sx, 25 * sy);
    tailGrad.addColorStop(0, ap.bodyHighlight);
    tailGrad.addColorStop(1, ap.bodyShade);
    drawCtx.strokeStyle = tailGrad;
    drawCtx.lineWidth = 3.5 * sx;
    drawCtx.lineCap = "round";
    drawCtx.beginPath();
    drawCtx.moveTo(6 * sx, 16 * sy);
    drawCtx.quadraticCurveTo(
      (-8 + tailSwing) * sx,
      (14 + tailSwing * 0.5) * sy,
      (-10 + tailSwing) * sx,
      23 * sy
    );
    drawCtx.stroke();

    // Back legs (behind body)
    drawLeg(10 * sx, 0);
    drawLeg(23 * sx, Math.PI / 2);

    // Main body
    const bodyGrad = drawCtx.createLinearGradient(5 * sx, 12 * sy, 5 * sx, (h - 8 * sy));
    bodyGrad.addColorStop(0, ap.bodyHighlight);
    bodyGrad.addColorStop(0.4, ap.body);
    bodyGrad.addColorStop(1, ap.bodyShade);
    drawCtx.fillStyle = bodyGrad;
    drawCtx.beginPath();
    drawCtx.roundRect(5 * sx, 12 * sy, w - 12 * sx, h - 18 * sy, 8 * Math.min(sx, sy));
    drawCtx.fill();

    // Underbelly accent
    drawCtx.fillStyle = ap.belly;
    drawCtx.beginPath();
    drawCtx.roundRect(15 * sx, (h - 9 * sy), w - 35 * sx, 3 * sy, 1);
    drawCtx.fill();

    if (tan && !ap.grayFace) {
      drawCtx.fillStyle = tan;
      drawCtx.beginPath();
      drawCtx.roundRect(15 * sx, (h - 9 * sy), w - 35 * sx, 3 * sy, 1);
      drawCtx.fill();
    }

    // Collar
    drawCtx.fillStyle = ap.collar;
    drawCtx.fillRect(w - 12 * sx, 11 * sy, 4 * sx, 12 * sy);

    // Silver ID tag
    const tagGrad = drawCtx.createRadialGradient(
      w - 10 * sx, 24 * sy, 1,
      w - 10 * sx, 24 * sy, 3 * sx
    );
    tagGrad.addColorStop(0, "#f5f7fa");
    tagGrad.addColorStop(0.45, ap.tag);
    tagGrad.addColorStop(1, "#7a8794");
    drawCtx.fillStyle = tagGrad;
    drawCtx.beginPath();
    drawCtx.arc(w - 10 * sx, 24 * sy, 3 * sx, 0, Math.PI * 2);
    drawCtx.fill();

    // Droopy ear (behind head)
    const earGrad = drawCtx.createLinearGradient(
      w - 12 * sx, 3 * sy,
      w - 12 * sx, 17 * sy
    );
    earGrad.addColorStop(0, ap.ear);
    earGrad.addColorStop(1, ap.bodyShade);
    drawCtx.fillStyle = earGrad;
    drawCtx.beginPath();
    drawCtx.ellipse(w - 11 * sx, 8 * sy, 4.5 * sx, 9 * sy, -0.1, 0, Math.PI * 2);
    drawCtx.fill();
    drawCtx.strokeStyle = ap.bodyShade;
    drawCtx.lineWidth = 1;
    drawCtx.beginPath();
    drawCtx.ellipse(w - 11 * sx, 8 * sy, 2 * sx, 7 * sy, -0.1, 0, Math.PI * 2);
    drawCtx.stroke();

    // Head
    const headGrad = drawCtx.createRadialGradient(
      w - 5 * sx, 10 * sy, 2 * sx,
      w - 5 * sx, 10 * sy, 10 * sx
    );
    headGrad.addColorStop(0, ap.bodyHighlight);
    headGrad.addColorStop(1, ap.bodyShade);
    drawCtx.fillStyle = headGrad;
    drawCtx.beginPath();
    drawCtx.arc(w - 5 * sx, 10 * sy, 9 * sx, 0, Math.PI * 2);
    drawCtx.fill();

    // Charlie: senior gray face
    if (ap.grayFace) {
      drawCtx.fillStyle = ap.muzzleGray;
      drawCtx.beginPath();
      drawCtx.ellipse(w - 2 * sx, 11 * sy, 7 * sx, 8 * sy, 0.05, 0, Math.PI * 2);
      drawCtx.fill();
      drawCtx.fillStyle = ap.muzzle;
      drawCtx.beginPath();
      drawCtx.ellipse(w + 1 * sx, 12 * sy, 4.5 * sx, 4 * sy, 0.1, 0, Math.PI * 2);
      drawCtx.fill();
    }

    // Tucker: tan eyebrow spot
    if (tan && !ap.grayFace) {
      drawCtx.fillStyle = tan;
      drawCtx.beginPath();
      drawCtx.arc(w - 5 * sx, 5 * sy, 1.5 * sx, 0, Math.PI * 2);
      drawCtx.fill();
    }

    // Snout
    drawCtx.fillStyle = ap.grayFace ? ap.muzzle : tan;
    drawCtx.beginPath();
    drawCtx.ellipse(w + 3 * sx, 11 * sy, 4 * sx, 3 * sy, 0.1, 0, Math.PI * 2);
    drawCtx.fill();
    drawCtx.fillStyle = ap.grayFace ? "rgba(74, 35, 6, 0.12)" : ap.bodyShade;
    drawCtx.beginPath();
    drawCtx.ellipse(w + 1 * sx, 9 * sy, 3 * sx, 1.5 * sy, 0.1, 0, Math.PI * 2);
    drawCtx.fill();

    // Eye (on face, forward of ear)
    drawCtx.fillStyle = ap.eye;
    drawCtx.beginPath();
    drawCtx.arc(w - 3.5 * sx, 9 * sy, 2 * sx, 0, Math.PI * 2);
    drawCtx.fill();
    drawCtx.fillStyle = "white";
    drawCtx.beginPath();
    drawCtx.arc(w - 2.5 * sx, 8 * sy, 0.6 * sx, 0, Math.PI * 2);
    drawCtx.fill();

    // Nose
    drawCtx.fillStyle = ap.nose;
    drawCtx.beginPath();
    drawCtx.arc(w + 6 * sx, 10 * sy, 1.5 * sx, 0, Math.PI * 2);
    drawCtx.fill();
    drawCtx.fillStyle = "rgba(255, 255, 255, 0.6)";
    drawCtx.beginPath();
    drawCtx.arc(w + 5.5 * sx, 9.3 * sy, 0.5 * sx, 0, Math.PI * 2);
    drawCtx.fill();

    // Front legs (in front of body)
    drawLeg(38 * sx, Math.PI);
    drawLeg(48 * sx, Math.PI * 1.5);

    drawCtx.restore();
  }

  const PREVIEW_DOG_W = 75;
  const PREVIEW_DOG_H = 50;
  let previewAnimTime = 0;
  let previewLoopId = null;
  const charPreviewCanvases = document.querySelectorAll(".char-preview");

  function drawCharPreview(canvas, charKey, time) {
    const pCtx = canvas.getContext("2d");
    const cw = canvas.width;
    const ch = canvas.height;
    pCtx.clearRect(0, 0, cw, ch);
    const px = (cw - PREVIEW_DOG_W) / 2;
    const py = (ch - PREVIEW_DOG_H) / 2 + 6;
    drawDachshund(pCtx, px, py, PREVIEW_DOG_W, PREVIEW_DOG_H, CHARACTERS[charKey].appearance, {
      animationFrame: time / 16,
      moving: true,
      airborne: false,
    });
  }

  function startSelectPreviewLoop() {
    if (previewLoopId !== null) return;
    let lastTs = 0;

    function previewLoop(timestamp) {
      if (selectPanel.classList.contains("hidden")) {
        stopSelectPreviewLoop();
        return;
      }

      const dt = lastTs ? timestamp - lastTs : 16;
      lastTs = timestamp;
      previewAnimTime += dt;

      charPreviewCanvases.forEach((canvas) => {
        drawCharPreview(canvas, canvas.dataset.char, previewAnimTime);
      });

      previewLoopId = requestAnimationFrame(previewLoop);
    }

    previewLoopId = requestAnimationFrame(previewLoop);
  }

  function stopSelectPreviewLoop() {
    if (previewLoopId !== null) {
      cancelAnimationFrame(previewLoopId);
      previewLoopId = null;
    }
  }

  function drawDog(x, y, charKey, moving, vy) {
    const c = CHARACTERS[charKey];
    const animationFrame = animTime / 16;
    const airborne = !player.grounded;

    drawDachshund(ctx, x, y, player.width, player.height, c.appearance, {
      animationFrame,
      moving,
      airborne,
      vy,
      shadowGroundY: groundY - 2,
    });
  }

  function lerpRenderValue(entity, prevPositions, alpha) {
    const prev = prevPositions.get(entity);
    if (prev === undefined) return entity.x;
    return prev + (entity.x - prev) * alpha;
  }

  function simulationStep() {
    updatePlayer();
    updateObstacles(STEP_MS);
    updateBones(STEP_MS);
    checkCollisions();
    checkBoneCollisions();
    updateScorePopups(STEP_MS);
    parallaxOffset += SCROLL_SPEED * 0.3;

    elapsedMs += STEP_MS;
    const newScore = Math.floor(elapsedMs / 1000);
    if (newScore !== scoreSeconds) {
      scoreSeconds = newScore;
      updateDifficulty();
    }
  }

  let lastFrameTime = 0;

  function gameLoop(timestamp) {
    if (!running) return;

    if (!lastFrameTime) lastFrameTime = timestamp;
    let frameDt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    frameDt = Math.min(frameDt, MAX_FRAME_MS);

    const prevPositions = new Map();
    let renderAlpha = 0;
    let renderParallax = parallaxOffset;
    let renderPlayerX = player.x;
    let renderPlayerY = player.y;

    if (!paused) {
      obstacles.forEach((obs) => prevPositions.set(obs, obs.x));
      bones.forEach((bone) => prevPositions.set(bone, bone.x));
      const prevParallax = parallaxOffset;
      const prevPlayerX = player.x;
      const prevPlayerY = player.y;

      simAccumulator += frameDt;
      animTime += frameDt;

      let steps = 0;
      while (simAccumulator >= STEP_MS && steps < MAX_SIM_STEPS) {
        simulationStep();
        simAccumulator -= STEP_MS;
        steps += 1;
      }

      renderAlpha = simAccumulator / STEP_MS;
      renderParallax = prevParallax + (parallaxOffset - prevParallax) * renderAlpha;
      renderPlayerX = prevPlayerX + (player.x - prevPlayerX) * renderAlpha;
      renderPlayerY = prevPlayerY + (player.y - prevPlayerY) * renderAlpha;

      updateFlash();
      updateHud();
    }

    beginFrame();
    drawBackground(renderParallax);
    for (const obs of obstacles) {
      drawObstacle(obs, lerpRenderValue(obs, prevPositions, renderAlpha));
    }
    for (const bone of bones) {
      World.drawBone(ctx, { ...bone, x: lerpRenderValue(bone, prevPositions, renderAlpha) }, animTime);
    }

    const moving = Math.abs(player.vx) > 0.5;
    const invincible = Date.now() < invincibleUntil;
    const flickerVisible = !invincible || Math.floor(Date.now() / 100) % 2 === 0;
    if (flickerVisible) {
      drawDog(renderPlayerX, renderPlayerY, selectedChar, moving, player.vy);
    }

    for (const popup of scorePopups) World.drawScorePopup(ctx, popup);

    requestAnimationFrame(gameLoop);
  }

  nextBtn.addEventListener("click", () => showPanel("select"));
  backBtn.addEventListener("click", () => showPanel("controls"));
  startBtn.addEventListener("click", startGame);
  resumeBtn.addEventListener("click", resumeGame);
  exitBtn.addEventListener("click", exitToMenu);

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
    if (e.code === "Escape") {
      if (running) {
        if (paused) resumeGame();
        else pauseGame();
      }
      e.preventDefault();
      return;
    }
    if (paused) return;

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
    if (e.code === "Escape") return;
    if (paused) return;

    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    if (e.code === "Space") keys.jump = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.superJump = false;
  });

  function bindTouchButton(button, keyName) {
    const press = (e) => {
      if (!running || paused) return;
      e.preventDefault();
      keys[keyName] = true;
      button.classList.add("pressed");
    };
    const release = (e) => {
      e.preventDefault();
      keys[keyName] = false;
      button.classList.remove("pressed");
    };

    button.addEventListener("touchstart", press, { passive: false });
    button.addEventListener("touchend", release, { passive: false });
    button.addEventListener("touchcancel", release, { passive: false });
    button.addEventListener("mousedown", press);
    button.addEventListener("mouseup", release);
    button.addEventListener("mouseleave", release);
  }

  bindTouchButton(touchLeftBtn, "left");
  bindTouchButton(touchRightBtn, "right");
  bindTouchButton(touchJumpBtn, "jump");
  bindTouchButton(touchSuperBtn, "superJump");

  window.addEventListener("blur", () => {
    keys.left = false;
    keys.right = false;
    keys.jump = false;
    keys.superJump = false;
    jumpPressed.jump = false;
    jumpPressed.superJump = false;
    [touchLeftBtn, touchRightBtn, touchJumpBtn, touchSuperBtn].forEach((btn) => {
      btn.classList.remove("pressed");
    });
  });

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("orientationchange", resizeCanvas);

  canvas.addEventListener("touchstart", (e) => {
    if (running && !paused) e.preventDefault();
  }, { passive: false });

  resizeCanvas();
  showPanel("controls");
  highScoreEl.textContent = `Best: ${bestTime}s`;
})();
