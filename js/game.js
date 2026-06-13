(function () {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const hud = document.getElementById("hud");
  const gameOverEl = document.getElementById("game-over");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const finalScoreEl = document.getElementById("final-score");
  const newRecordEl = document.getElementById("new-record");
  const startBtn = document.getElementById("start-btn");
  const retryBtn = document.getElementById("retry-btn");
  const charBtns = document.querySelectorAll(".char-btn");

  const W = canvas.width;
  const H = canvas.height;
  const GRAVITY = 0.42;
  const PLATFORM_COUNT = 10;
  const HIGH_SCORE_KEY = "tuckCharlieHighScore";

  const CHARACTERS = {
    tuck: {
      name: "Tuck",
      fur: "#8b5a2b",
      furLight: "#c49a6c",
      belly: "#f5e6d3",
      jumpPower: -11.5,
      boostPower: -6,
    },
    charlie: {
      name: "Charlie",
      fur: "#4a4a4a",
      furLight: "#9e9e9e",
      belly: "#e8e8e8",
      jumpPower: -13,
      boostPower: -7,
    },
  };

  let selectedChar = "tuck";
  let running = false;
  let score = 0;
  let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
  let cameraY = 0;
  let maxHeight = 0;

  const keys = { left: false, right: false, boost: false };

  const player = {
    x: W / 2,
    y: H - 120,
    vx: 0,
    vy: 0,
    width: 36,
    height: 36,
    onPlatform: false,
  };

  let platforms = [];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function initPlatforms() {
    platforms = [];
    for (let i = 0; i < PLATFORM_COUNT; i++) {
      platforms.push(makePlatform(H - 80 - i * 55));
    }
  }

  function makePlatform(y) {
    const types = ["normal", "normal", "normal", "spring", "moving"];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      x: rand(40, W - 100),
      y,
      width: type === "spring" ? 70 : rand(65, 90),
      height: 12,
      type,
      moveDir: Math.random() < 0.5 ? -1 : 1,
      moveSpeed: rand(1.2, 2.2),
    };
  }

  function resetGame() {
    const char = CHARACTERS[selectedChar];
    player.x = W / 2;
    player.y = H - 120;
    player.vx = 0;
    player.vy = char.jumpPower;
    player.onPlatform = false;
    cameraY = 0;
    score = 0;
    maxHeight = 0;
    initPlatforms();
    scoreEl.textContent = "0";
    highScoreEl.textContent = `Best: ${highScore}`;
  }

  function startGame() {
    resetGame();
    overlay.classList.add("hidden");
    gameOverEl.classList.add("hidden");
    hud.classList.remove("hidden");
    running = true;
  }

  function endGame() {
    running = false;
    const isNewRecord = score > highScore;
    if (isNewRecord) {
      highScore = score;
      localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
    }
    finalScoreEl.textContent = `Score: ${score}`;
    newRecordEl.classList.toggle("hidden", !isNewRecord);
    hud.classList.add("hidden");
    gameOverEl.classList.remove("hidden");
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#5dade2");
    gradient.addColorStop(0.6, "#87ceeb");
    gradient.addColorStop(1, "#b8e0f0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const clouds = [
      [60, 80, 50], [200, 140, 40], [320, 60, 55], [150, 220, 35],
    ];
    for (const [cx, cy, size] of clouds) {
      const screenY = ((cy - cameraY * 0.3) % (H + 100) + H + 100) % (H + 100) - 50;
      ctx.beginPath();
      ctx.arc(cx, screenY, size * 0.5, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.4, screenY - 8, size * 0.35, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.8, screenY, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlatform(p) {
    const screenY = p.y - cameraY;
    if (screenY < -30 || screenY > H + 30) return;

    const colors = {
      normal: ["#5cb85c", "#449d44"],
      spring: ["#f0ad4e", "#ec971f"],
      moving: ["#5bc0de", "#31b0d5"],
    };
    const [top, bottom] = colors[p.type];
    const grad = ctx.createLinearGradient(p.x, screenY, p.x, screenY + p.height);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(p.x, screenY, p.width, p.height, 4);
    ctx.fill();

    if (p.type === "spring") {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("↑", p.x + p.width / 2, screenY + 10);
    }
  }

  function drawDog(x, y, charKey) {
    const c = CHARACTERS[charKey];
    const w = player.width;
    const h = player.height;
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    if (player.vy < -2) ctx.rotate(-0.08);
    else if (player.vy > 2) ctx.rotate(0.08);

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
    const legOffset = Math.sin(Date.now() / 80) * 3;
    ctx.beginPath();
    ctx.moveTo(-8, 14);
    ctx.lineTo(-10, 22 + legOffset);
    ctx.moveTo(8, 14);
    ctx.lineTo(10, 22 - legOffset);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(c.name, 0, -24);

    ctx.restore();
  }

  function updatePlatforms() {
    for (const p of platforms) {
      if (p.type === "moving") {
        p.x += p.moveDir * p.moveSpeed;
        if (p.x < 10 || p.x + p.width > W - 10) p.moveDir *= -1;
      }
    }

    const lowest = Math.max(...platforms.map((p) => p.y));
    if (lowest > cameraY + H + 40) {
      const highest = Math.min(...platforms.map((p) => p.y));
      platforms.push(makePlatform(highest - rand(45, 70)));
      if (platforms.length > PLATFORM_COUNT + 4) {
        platforms.shift();
      }
    }
  }

  function checkPlatformCollision() {
    if (player.vy <= 0) return;

    for (const p of platforms) {
      const screenY = p.y - cameraY;
      const feet = player.y + player.height;
      const prevFeet = feet - player.vy;

      if (
        feet >= screenY &&
        prevFeet <= screenY + p.height &&
        player.x + player.width > p.x &&
        player.x < p.x + p.width
      ) {
        const char = CHARACTERS[selectedChar];
        player.vy = p.type === "spring" ? char.jumpPower * 1.35 : char.jumpPower;
        player.onPlatform = true;
        player.y = screenY - player.height;
        return;
      }
    }
    player.onPlatform = false;
  }

  function updatePlayer() {
    const char = CHARACTERS[selectedChar];
    const moveSpeed = 5.5;

    if (keys.left) player.vx = -moveSpeed;
    else if (keys.right) player.vx = moveSpeed;
    else player.vx *= 0.85;

    if (keys.boost && player.onPlatform) {
      player.vy = char.boostPower;
      player.onPlatform = false;
    }

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    if (player.x + player.width < 0) player.x = W;
    else if (player.x > W) player.x = -player.width;

    const worldY = player.y + cameraY;
    if (worldY < maxHeight) {
      maxHeight = worldY;
      score = Math.floor(-maxHeight / 10);
      scoreEl.textContent = String(score);
    }

    if (player.y < H * 0.35) {
      const shift = H * 0.35 - player.y;
      cameraY += shift;
      player.y = H * 0.35;
    }

    checkPlatformCollision();

    if (player.y > H + 20) {
      endGame();
    }
  }

  function gameLoop() {
    if (!running) return;

    updatePlatforms();
    updatePlayer();

    drawBackground();
    for (const p of platforms) drawPlatform(p);
    drawDog(player.x, player.y, selectedChar);

    requestAnimationFrame(gameLoop);
  }

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

  startBtn.addEventListener("click", () => {
    startGame();
    requestAnimationFrame(gameLoop);
  });

  retryBtn.addEventListener("click", () => {
    startGame();
    requestAnimationFrame(gameLoop);
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
    if (e.code === "Space") {
      keys.boost = true;
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    if (e.code === "Space") keys.boost = false;
  });

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    keys.left = x < W / 2;
    keys.right = x >= W / 2;
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    keys.left = false;
    keys.right = false;
  });

  highScoreEl.textContent = `Best: ${highScore}`;
})();
