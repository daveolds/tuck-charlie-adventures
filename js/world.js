(function (global) {
  "use strict";

  const OBSTACLE_TYPES = {
    squirrel: {
      width: 44,
      height: 52,
      draw(c, x, y, w, h) {
        c.save();
        c.fillStyle = "rgba(0, 0, 0, 0.18)";
        c.beginPath();
        c.ellipse(x + w / 2, y + h - 2, w / 2.4, 4, 0, 0, Math.PI * 2);
        c.fill();

        const tailGrad = c.createRadialGradient(x + 10, y + 10, 2, x + 8, y + 2, 24);
        tailGrad.addColorStop(0, "#E67E22");
        tailGrad.addColorStop(0.7, "#D35400");
        tailGrad.addColorStop(1, "#A04000");
        c.fillStyle = tailGrad;
        c.beginPath();
        c.moveTo(x + 18, y + 30);
        c.bezierCurveTo(x - 5, y + 27, x - 12, y - 4, x + 8, y - 10);
        c.bezierCurveTo(x + 24, y - 12, x + 16, y + 12, x + 18, y + 30);
        c.closePath();
        c.fill();
        c.strokeStyle = "rgba(255,255,255,0.15)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(x + 8, y + 10, 10, -Math.PI / 2, Math.PI / 2);
        c.stroke();

        const bodyGrad = c.createLinearGradient(x + w / 2, y + 2, x + w / 2, y + h);
        bodyGrad.addColorStop(0, "#D35400");
        bodyGrad.addColorStop(1, "#873B07");
        c.fillStyle = bodyGrad;
        c.beginPath();
        c.ellipse(x + w / 2 - 2, y + 20, 14, 16, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#F5DEB3";
        c.beginPath();
        c.ellipse(x + w / 2 + 1, y + 22, 7, 10, -0.1, 0, Math.PI * 2);
        c.fill();

        const headGrad = c.createRadialGradient(x + w - 9, y + 7, 2, x + w - 9, y + 7, 10);
        headGrad.addColorStop(0, "#E67E22");
        headGrad.addColorStop(1, "#BA4A00");
        c.fillStyle = headGrad;
        c.beginPath();
        c.arc(x + w - 9, y + 7, 9, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#BA4A00";
        c.beginPath();
        c.ellipse(x + w - 14, y - 1, 3, 6, -0.3, 0, Math.PI * 2);
        c.ellipse(x + w - 5, y - 1, 3, 6, 0.3, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#FFA07A";
        c.beginPath();
        c.ellipse(x + w - 14, y - 1, 1.2, 4, -0.3, 0, Math.PI * 2);
        c.ellipse(x + w - 5, y - 1, 1.2, 4, 0.3, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#FFA07A";
        c.beginPath();
        c.ellipse(x + w - 3, y + 9, 2.5, 2, 0.1, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#0f0f0f";
        c.beginPath();
        c.arc(x + w - 11, y + 5, 2, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#fff";
        c.beginPath();
        c.arc(x + w - 11.5, y + 4.3, 0.6, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "black";
        c.beginPath();
        c.arc(x + w - 2, y + 8, 1, 0, Math.PI * 2);
        c.fill();

        const nutGrad = c.createLinearGradient(x + w - 12, y + 23, x + w - 8, y + 29);
        nutGrad.addColorStop(0, "#D2B48C");
        nutGrad.addColorStop(1, "#8B4513");
        c.fillStyle = nutGrad;
        c.beginPath();
        c.ellipse(x + w - 8, y + 25, 4, 5, 0.4, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#5C2E0B";
        c.beginPath();
        c.arc(x + w - 9, y + 23, 3.5, 0, Math.PI, true);
        c.fill();

        c.fillStyle = "#E67E22";
        c.beginPath();
        c.roundRect(x + w - 14, y + 22, 6, 3, 1.5);
        c.fill();

        c.fillStyle = "#BA4A00";
        c.beginPath();
        c.roundRect(x + 7, y + 31, 6, 4, 1.5);
        c.roundRect(x + 20, y + 31, 6, 4, 1.5);
        c.fill();
        c.restore();
      },
    },

    gnome: {
      width: 36,
      height: 48,
      draw(c, x, y, w, h) {
        c.save();
        c.fillStyle = "rgba(0,0,0,0.16)";
        c.beginPath();
        c.ellipse(x + w / 2, y + h - 1, w / 2.2, 3.5, 0, 0, Math.PI * 2);
        c.fill();

        // Base / grass mound
        c.fillStyle = "#4a7c3f";
        c.beginPath();
        c.ellipse(x + w / 2, y + h - 4, w / 2 + 2, 6, 0, 0, Math.PI * 2);
        c.fill();

        // Body
        const bodyGrad = c.createLinearGradient(x, y + h * 0.45, x, y + h * 0.85);
        bodyGrad.addColorStop(0, "#2563eb");
        bodyGrad.addColorStop(1, "#1e40af");
        c.fillStyle = bodyGrad;
        c.beginPath();
        c.roundRect(x + w * 0.22, y + h * 0.42, w * 0.56, h * 0.38, 4);
        c.fill();

        // Belt
        c.fillStyle = "#1a1a1a";
        c.fillRect(x + w * 0.22, y + h * 0.58, w * 0.56, h * 0.06);
        c.fillStyle = "#fbbf24";
        c.fillRect(x + w * 0.44, y + h * 0.575, w * 0.12, h * 0.07);

        // Beard
        c.fillStyle = "#f5f5f4";
        c.beginPath();
        c.moveTo(x + w * 0.28, y + h * 0.38);
        c.quadraticCurveTo(x + w * 0.5, y + h * 0.58, x + w * 0.72, y + h * 0.38);
        c.quadraticCurveTo(x + w * 0.5, y + h * 0.48, x + w * 0.28, y + h * 0.38);
        c.fill();

        // Face
        c.fillStyle = "#fecaca";
        c.beginPath();
        c.arc(x + w * 0.5, y + h * 0.32, w * 0.18, 0, Math.PI * 2);
        c.fill();

        // Nose
        c.fillStyle = "#f97316";
        c.beginPath();
        c.arc(x + w * 0.5, y + h * 0.34, 2.5, 0, Math.PI * 2);
        c.fill();

        // Eyes
        c.fillStyle = "#1a1a1a";
        c.beginPath();
        c.arc(x + w * 0.42, y + h * 0.28, 1.5, 0, Math.PI * 2);
        c.arc(x + w * 0.58, y + h * 0.28, 1.5, 0, Math.PI * 2);
        c.fill();

        // Hat
        const hatGrad = c.createLinearGradient(x, y, x, y + h * 0.25);
        hatGrad.addColorStop(0, "#ef4444");
        hatGrad.addColorStop(1, "#b91c1c");
        c.fillStyle = hatGrad;
        c.beginPath();
        c.moveTo(x + w * 0.5, y + 2);
        c.lineTo(x + w * 0.18, y + h * 0.22);
        c.lineTo(x + w * 0.82, y + h * 0.22);
        c.closePath();
        c.fill();
        c.fillStyle = "#991b1b";
        c.fillRect(x + w * 0.12, y + h * 0.2, w * 0.76, h * 0.05);

        // Fishing rod
        c.strokeStyle = "#78716c";
        c.lineWidth = 1.5;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(x + w * 0.75, y + h * 0.5);
        c.quadraticCurveTo(x + w + 8, y + h * 0.1, x + w + 14, y + h * 0.35);
        c.stroke();
        c.strokeStyle = "rgba(100,116,139,0.6)";
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(x + w + 14, y + h * 0.35);
        c.lineTo(x + w + 14, y + h * 0.7);
        c.stroke();
        c.restore();
      },
    },

    trashCan: {
      width: 38,
      height: 46,
      draw(c, x, y, w, h) {
        c.save();
        c.fillStyle = "rgba(0,0,0,0.15)";
        c.beginPath();
        c.ellipse(x + w / 2, y + h - 1, w / 2.1, 3.5, 0, 0, Math.PI * 2);
        c.fill();

        const canGrad = c.createLinearGradient(x, y + h * 0.2, x + w, y + h);
        canGrad.addColorStop(0, "#64748b");
        canGrad.addColorStop(0.5, "#475569");
        canGrad.addColorStop(1, "#334155");
        c.fillStyle = canGrad;
        c.beginPath();
        c.roundRect(x + w * 0.12, y + h * 0.22, w * 0.76, h * 0.72, 3);
        c.fill();

        // Rim highlight
        c.strokeStyle = "rgba(255,255,255,0.25)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x + w * 0.18, y + h * 0.28);
        c.lineTo(x + w * 0.18, y + h * 0.85);
        c.stroke();

        // Lid
        c.fillStyle = "#334155";
        c.beginPath();
        c.roundRect(x + w * 0.05, y + h * 0.14, w * 0.9, h * 0.12, 2);
        c.fill();
        c.fillStyle = "#1e293b";
        c.fillRect(x + w * 0.35, y + h * 0.1, w * 0.3, h * 0.06);

        // Handles
        c.strokeStyle = "#94a3b8";
        c.lineWidth = 2;
        c.lineCap = "round";
        c.beginPath();
        c.arc(x + w * 0.28, y + h * 0.42, 4, -Math.PI * 0.8, Math.PI * 0.8);
        c.stroke();
        c.beginPath();
        c.arc(x + w * 0.72, y + h * 0.42, 4, Math.PI * 0.2, Math.PI * 1.8);
        c.stroke();

        // Dent lines
        c.strokeStyle = "rgba(0,0,0,0.2)";
        c.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) {
          const ly = y + h * (0.38 + i * 0.16);
          c.beginPath();
          c.moveTo(x + w * 0.15, ly);
          c.lineTo(x + w * 0.85, ly);
          c.stroke();
        }
        c.restore();
      },
    },

    mailbox: {
      width: 42,
      height: 50,
      draw(c, x, y, w, h) {
        c.save();
        c.fillStyle = "rgba(0,0,0,0.14)";
        c.beginPath();
        c.ellipse(x + w * 0.35, y + h - 1, w / 3, 3, 0, 0, Math.PI * 2);
        c.fill();

        // Post
        const postGrad = c.createLinearGradient(x + w * 0.28, y, x + w * 0.42, y);
        postGrad.addColorStop(0, "#78716c");
        postGrad.addColorStop(1, "#57534e");
        c.fillStyle = postGrad;
        c.fillRect(x + w * 0.3, y + h * 0.38, w * 0.12, h * 0.62);

        // Box
        const boxGrad = c.createLinearGradient(x, y + h * 0.15, x, y + h * 0.45);
        boxGrad.addColorStop(0, "#1d4ed8");
        boxGrad.addColorStop(1, "#1e3a8a");
        c.fillStyle = boxGrad;
        c.beginPath();
        c.roundRect(x + w * 0.08, y + h * 0.12, w * 0.72, h * 0.28, 3);
        c.fill();

        // Curved top
        c.fillStyle = "#2563eb";
        c.beginPath();
        c.arc(x + w * 0.44, y + h * 0.12, w * 0.36, Math.PI, 0);
        c.fill();

        // Flag
        c.strokeStyle = "#dc2626";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x + w * 0.72, y + h * 0.22);
        c.lineTo(x + w * 0.72, y + h * 0.05);
        c.stroke();
        c.fillStyle = "#ef4444";
        c.beginPath();
        c.moveTo(x + w * 0.72, y + h * 0.05);
        c.lineTo(x + w * 0.95, y + h * 0.1);
        c.lineTo(x + w * 0.72, y + h * 0.15);
        c.closePath();
        c.fill();

        // Door seam
        c.strokeStyle = "rgba(0,0,0,0.25)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x + w * 0.44, y + h * 0.18);
        c.lineTo(x + w * 0.44, y + h * 0.38);
        c.stroke();
        c.restore();
      },
    },

    hydrant: {
      width: 34,
      height: 44,
      draw(c, x, y, w, h) {
        c.save();
        c.fillStyle = "rgba(0,0,0,0.16)";
        c.beginPath();
        c.ellipse(x + w / 2, y + h - 1, w / 2.2, 3.5, 0, 0, Math.PI * 2);
        c.fill();

        const bodyGrad = c.createLinearGradient(x, y + h * 0.2, x + w, y + h);
        bodyGrad.addColorStop(0, "#ef4444");
        bodyGrad.addColorStop(0.45, "#dc2626");
        bodyGrad.addColorStop(1, "#991b1b");
        c.fillStyle = bodyGrad;
        c.beginPath();
        c.roundRect(x + w * 0.22, y + h * 0.18, w * 0.56, h * 0.78, 2);
        c.fill();

        // Dome cap
        c.fillStyle = "#b91c1c";
        c.beginPath();
        c.arc(x + w / 2, y + h * 0.18, w * 0.32, Math.PI, 0);
        c.fill();
        c.fillStyle = "#7f1d1d";
        c.beginPath();
        c.arc(x + w / 2, y + h * 0.1, w * 0.14, 0, Math.PI * 2);
        c.fill();

        // Side caps
        c.fillStyle = "#991b1b";
        c.beginPath();
        c.arc(x + w * 0.08, y + h * 0.48, w * 0.12, 0, Math.PI * 2);
        c.arc(x + w * 0.92, y + h * 0.48, w * 0.12, 0, Math.PI * 2);
        c.fill();

        // Bolts
        c.fillStyle = "#fca5a5";
        for (const bx of [0.35, 0.5, 0.65]) {
          c.beginPath();
          c.arc(x + w * bx, y + h * 0.55, 2, 0, Math.PI * 2);
          c.fill();
        }

        // Bands
        c.fillStyle = "#7f1d1d";
        c.fillRect(x + w * 0.2, y + h * 0.42, w * 0.6, h * 0.05);
        c.fillRect(x + w * 0.2, y + h * 0.68, w * 0.6, h * 0.05);

        // Highlight stripe
        c.fillStyle = "rgba(255,255,255,0.15)";
        c.fillRect(x + w * 0.28, y + h * 0.25, w * 0.08, h * 0.55);
        c.restore();
      },
    },

    topiary: {
      width: 40,
      height: 52,
      draw(c, x, y, w, h) {
        c.save();
        c.fillStyle = "rgba(0,0,0,0.14)";
        c.beginPath();
        c.ellipse(x + w / 2, y + h - 1, w / 2.1, 3.5, 0, 0, Math.PI * 2);
        c.fill();

        // Planter
        const potGrad = c.createLinearGradient(x, y + h * 0.72, x, y + h);
        potGrad.addColorStop(0, "#d97706");
        potGrad.addColorStop(1, "#92400e");
        c.fillStyle = potGrad;
        c.beginPath();
        c.moveTo(x + w * 0.15, y + h * 0.72);
        c.lineTo(x + w * 0.85, y + h * 0.72);
        c.lineTo(x + w * 0.78, y + h * 0.98);
        c.lineTo(x + w * 0.22, y + h * 0.98);
        c.closePath();
        c.fill();
        c.fillStyle = "#78350f";
        c.fillRect(x + w * 0.12, y + h * 0.68, w * 0.76, h * 0.06);

        // Soil
        c.fillStyle = "#3f2e22";
        c.fillRect(x + w * 0.18, y + h * 0.64, w * 0.64, h * 0.08);

        // Bush spheres
        const leaf = (cx, cy, r) => {
          const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 1, cx, cy, r);
          g.addColorStop(0, "#4ade80");
          g.addColorStop(0.6, "#16a34a");
          g.addColorStop(1, "#14532d");
          c.fillStyle = g;
          c.beginPath();
          c.arc(cx, cy, r, 0, Math.PI * 2);
          c.fill();
        };
        leaf(x + w * 0.5, y + h * 0.22, w * 0.22);
        leaf(x + w * 0.35, y + h * 0.38, w * 0.17);
        leaf(x + w * 0.65, y + h * 0.38, w * 0.17);
        leaf(x + w * 0.5, y + h * 0.5, w * 0.2);

        // Trim highlight
        c.strokeStyle = "rgba(134,239,172,0.4)";
        c.lineWidth = 1;
        c.beginPath();
        c.arc(x + w * 0.5, y + h * 0.22, w * 0.18, Math.PI * 1.1, Math.PI * 1.7);
        c.stroke();
        c.restore();
      },
    },
  };

  const OBSTACLE_KEYS = Object.keys(OBSTACLE_TYPES);

  function pickRandomObstacleType() {
    return OBSTACLE_KEYS[Math.floor(Math.random() * OBSTACLE_KEYS.length)];
  }

  function drawObstacle(c, obs) {
    const def = OBSTACLE_TYPES[obs.type];
    if (def && def.draw) {
      def.draw(c, obs.x, obs.y, obs.width, obs.height);
    }
  }

  function drawCloud(c, cx, cy, scale, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
    c.arc(cx + 22 * scale, cy - 6 * scale, 14 * scale, 0, Math.PI * 2);
    c.arc(cx + 42 * scale, cy, 16 * scale, 0, Math.PI * 2);
    c.arc(cx + 20 * scale, cy + 4 * scale, 12 * scale, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.5)";
    c.beginPath();
    c.arc(cx + 8 * scale, cy - 2 * scale, 10 * scale, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawBird(c, x, y, scale, wingPhase, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.strokeStyle = "#4a5568";
    c.lineWidth = 1.2 * scale;
    c.lineCap = "round";
    const flap = Math.sin(wingPhase) * 3 * scale;
    c.beginPath();
    c.moveTo(x - 5 * scale, y + flap);
    c.quadraticCurveTo(x - 1 * scale, y - 2 * scale - Math.abs(flap) * 0.3, x, y);
    c.quadraticCurveTo(x + 1 * scale, y - 2 * scale - Math.abs(flap) * 0.3, x + 5 * scale, y + flap);
    c.stroke();
    c.restore();
  }

  function drawBirdFlock(c, originX, originY, count, seed, animTime, alpha) {
    for (let b = 0; b < count; b++) {
      const bx = originX + b * 14 + (seed % 3) * 4;
      const by = originY + Math.sin(b * 1.4 + seed) * 6 + Math.sin(animTime * 0.002 + b + seed) * 4;
      const wingPhase = animTime * 0.012 + b * 0.8 + seed;
      drawBird(c, bx, by, 0.55 + (b % 2) * 0.1, wingPhase, alpha);
    }
  }

  const hotAirBalloonImg = new Image();
  let hotAirBalloonReady = false;
  hotAirBalloonImg.onload = () => {
    hotAirBalloonReady = true;
  };
  hotAirBalloonImg.src = "assets/hot-air-balloon.png";

  function drawHotAirBalloon(c, x, y, scale, alpha) {
    if (!hotAirBalloonReady) return;
    c.save();
    c.globalAlpha = alpha;
    const bob = Math.sin(x * 0.02 + y * 0.01) * 3 * scale;
    const drawW = 72 * scale;
    const drawH = drawW * (hotAirBalloonImg.height / hotAirBalloonImg.width);
    c.drawImage(hotAirBalloonImg, x - drawW / 2, y + bob, drawW, drawH);
    c.restore();
  }

  function drawAirplane(c, x, y, scale, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = "#94a3b8";

    c.beginPath();
    c.ellipse(x, y, 12 * scale, 3 * scale, 0, 0, Math.PI * 2);
    c.fill();

    c.beginPath();
    c.moveTo(x - 2 * scale, y);
    c.lineTo(x - 8 * scale, y - 9 * scale);
    c.lineTo(x + 2 * scale, y - 2 * scale);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(x + 4 * scale, y + 1 * scale);
    c.lineTo(x + 10 * scale, y + 7 * scale);
    c.lineTo(x + 2 * scale, y + 2 * scale);
    c.closePath();
    c.fill();

    c.fillStyle = "#cbd5e1";
    c.beginPath();
    c.moveTo(x + 10 * scale, y);
    c.lineTo(x + 14 * scale, y - 1 * scale);
    c.lineTo(x + 10 * scale, y - 2 * scale);
    c.closePath();
    c.fill();

    c.strokeStyle = "rgba(255,255,255,0.35)";
    c.lineWidth = 1;
    c.setLineDash([4, 6]);
    c.beginPath();
    c.moveTo(x - 30 * scale, y - 1 * scale);
    c.lineTo(x - 8 * scale, y);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  function drawDetailedHouse(c, hx, hy, hw, hh, wallColor, roofColor, trimColor, seed) {
    c.save();

    c.fillStyle = wallColor;
    c.fillRect(hx, hy, hw, hh);

    const peakX = hx + hw / 2;
    const peakY = hy - hh * 0.42;
    const roofLeftX = hx - 8;
    const roofRightX = hx + hw + 8;

    function roofLineY(x) {
      if (x <= peakX) {
        const t = (x - roofLeftX) / (peakX - roofLeftX);
        return hy + t * (peakY - hy);
      }
      const t = (x - peakX) / (roofRightX - peakX);
      return peakY + t * (hy - peakY);
    }

    function drawChimney(centerX, chW, chH) {
      const roofY = roofLineY(centerX);
      const overlap = Math.max(3, hh * 0.025);
      c.fillStyle = trimColor;
      c.fillRect(centerX - chW / 2, roofY - chH, chW, chH + overlap);
    }

    if (seed % 3 !== 0) {
      drawChimney(hx + hw * 0.72, hw * 0.1, hh * 0.14);
    }
    if (seed % 2 === 0) {
      drawChimney(hx + hw * 0.26, hw * 0.08, hh * 0.12);
    }

    c.fillStyle = roofColor;
    c.beginPath();
    c.moveTo(hx - 8, hy);
    c.lineTo(hx + hw / 2, hy - hh * 0.42);
    c.lineTo(hx + hw + 8, hy);
    c.closePath();
    c.fill();

    const doorTop = hy + hh * 0.56;
    const doorLeft = hx + hw * 0.38;
    const doorW = hw * 0.24;
    const winW = hw * 0.14;
    const winH = hh * 0.14;
    const rowGap = hh * 0.10;
    const row1Y = hy + hh * 0.14;

    function drawWindow(wx, wy) {
      c.fillStyle = trimColor;
      c.fillRect(wx, wy, winW, winH);
      c.strokeStyle = roofColor;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(wx + winW / 2, wy);
      c.lineTo(wx + winW / 2, wy + winH);
      c.moveTo(wx, wy + winH / 2);
      c.lineTo(wx + winW, wy + winH / 2);
      c.stroke();
    }

    drawWindow(hx + hw * 0.16, row1Y);
    drawWindow(hx + hw * 0.7, row1Y);

    const row2Y = row1Y + winH + rowGap;
    if (row2Y + winH <= doorTop - hh * 0.03) {
      drawWindow(hx + hw * 0.16, row2Y);
      drawWindow(hx + hw * 0.7, row2Y);
    }

    c.fillStyle = roofColor;
    c.fillRect(doorLeft, doorTop, doorW, hy + hh - doorTop);

    c.strokeStyle = trimColor;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(hx - 4, hy + hh);
    c.lineTo(hx + hw + 4, hy + hh);
    c.stroke();

    c.restore();
  }

  function drawDetailedTree(c, tx, baseY, scale, seed) {
    c.save();
    const trunkH = 28 * scale;
    const trunkW = 7 * scale;

    c.fillStyle = "#5c4636";
    c.fillRect(tx - trunkW / 2, baseY - trunkH, trunkW, trunkH);
    c.fillStyle = "#6b5344";
    c.fillRect(tx - trunkW / 2 + 1, baseY - trunkH, trunkW * 0.35, trunkH);

    c.globalAlpha = 1.0;
    const foliageY = baseY - trunkH - 8 * scale;

    if (seed % 4 === 0) {
      c.fillStyle = "#2d6a3e";
      c.beginPath();
      c.moveTo(tx, foliageY - 28 * scale);
      c.lineTo(tx - 16 * scale, foliageY + 6 * scale);
      c.lineTo(tx + 16 * scale, foliageY + 6 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = "#3d8a52";
      c.beginPath();
      c.moveTo(tx, foliageY - 20 * scale);
      c.lineTo(tx - 12 * scale, foliageY + 2 * scale);
      c.lineTo(tx + 12 * scale, foliageY + 2 * scale);
      c.closePath();
      c.fill();
    } else {
      const blobs = [
        { dx: 0, dy: -10, r: 18 },
        { dx: -10, dy: 2, r: 13 },
        { dx: 10, dy: 0, r: 14 },
      ];
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        const g = c.createRadialGradient(
          tx + b.dx * scale - 3 * scale,
          foliageY + b.dy * scale - 3 * scale,
          1,
          tx + b.dx * scale,
          foliageY + b.dy * scale,
          b.r * scale
        );
        g.addColorStop(0, i === 0 ? "#5ecf7a" : "#4ade80");
        g.addColorStop(0.65, "#2f9e4f");
        g.addColorStop(1, "#1e6b38");
        c.fillStyle = g;
        c.beginPath();
        c.arc(tx + b.dx * scale, foliageY + b.dy * scale, b.r * scale, 0, Math.PI * 2);
        c.fill();
      }
    }

    c.globalAlpha = 0.50;
    c.fillStyle = "#86efac";
    c.beginPath();
    c.arc(tx - 4 * scale, foliageY - 14 * scale, 5 * scale, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  function drawBackground(c, W, H, groundY, parallaxOffset, animTime) {
    const sky = c.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, "#6eb5e0");
    sky.addColorStop(0.55, "#a8d8f0");
    sky.addColorStop(1, "#fdebd3");
    c.fillStyle = sky;
    c.fillRect(0, 0, W, groundY);

    // Soft sun (no heavy glow wash)
    const sunX = W * 0.82;
    const sunY = H * 0.12;
    c.fillStyle = "rgba(255, 244, 190, 0.35)";
    c.beginPath();
    c.arc(sunX, sunY, 28, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff0b3";
    c.beginPath();
    c.arc(sunX, sunY, 14, 0, Math.PI * 2);
    c.fill();

    // Single soft hill
    c.fillStyle = "rgba(110, 160, 100, 0.45)";
    c.beginPath();
    c.moveTo(0, groundY - 20);
    for (let i = 0; i <= W; i += 60) {
      c.lineTo(i, groundY - 48 - Math.sin(i * 0.006) * 12);
    }
    c.lineTo(W, groundY);
    c.lineTo(0, groundY);
    c.closePath();
    c.fill();

    // Distant sky ambience — slow, soft, non-distracting
    const planeX = ((animTime * 0.018 + parallaxOffset * 0.04) % (W + 280)) - 60;
    drawAirplane(c, planeX, H * 0.09, 0.55, 0.32);

    const balloonX = ((parallaxOffset * 0.06 + 340) % (W + 520)) - 80;
    drawHotAirBalloon(c, balloonX, H * 0.16, 0.65, 0.38);
    if (balloonX > W * 0.55) {
      drawHotAirBalloon(c, balloonX - W * 0.72, H * 0.2, 0.5, 0.28);
    }

    const flockSpacing = 380;
    for (let i = 0; i < 5; i++) {
      const flockX = ((i * flockSpacing + 60 - parallaxOffset * (0.06 + (i % 3) * 0.02) + animTime * 0.025) % (W + flockSpacing) + W + flockSpacing) % (W + flockSpacing) - 40;
      const flockY = 48 + (i % 3) * 22 + Math.sin(animTime * 0.0015 + i * 2) * 6;
      drawBirdFlock(c, flockX, flockY, 2 + (i % 3), i * 7 + 3, animTime, 0.38 + (i % 2) * 0.08);
    }

    // One cloud layer, fewer clouds
    const cloudSpacing = 320;
    for (let i = -1; i < 4; i++) {
      const cx = ((i * cloudSpacing - parallaxOffset * 0.12) % (W + cloudSpacing) + W + cloudSpacing) % (W + cloudSpacing) - 30;
      drawCloud(c, cx, 42 + (i % 2) * 20, 0.9, 0.7);
    }

    // Distant houses — fixed slots prevent wrap overlap
    const HOUSE_ROOF_PAD = 8;
    const HOUSE_MAX_W = 88;
    const HOUSE_GAP = 56;
    const housePeriod = HOUSE_MAX_W + HOUSE_ROOF_PAD * 2 + HOUSE_GAP;
    const houseScroll = parallaxOffset * 0.35;
    const houseColors = [
      { wall: "#c4b8ab", roof: "#8a7e72", trim: "#6e645a" },
      { wall: "#ddd0d8", roof: "#968a9a", trim: "#756a78" },
      { wall: "#d0d8e0", roof: "#8a95a8", trim: "#687888" },
    ];
    const firstHouseSlot = Math.floor(houseScroll / housePeriod) - 1;
    const houseCount = Math.ceil(W / housePeriod) + 2;
    for (let n = 0; n < houseCount; n++) {
      const slot = firstHouseSlot + n;
      const hx = slot * housePeriod - houseScroll;
      const hw = 72 + (Math.abs(slot) % 2) * 16;
      const hh = 48 + (Math.abs(slot) % 3) * 6;
      const hy = groundY - hh - 22;
      if (hx + hw + HOUSE_ROOF_PAD < -20 || hx - HOUSE_ROOF_PAD > W + 20) continue;
      const palette = houseColors[Math.abs(slot) % houseColors.length];
      drawDetailedHouse(c, hx, hy, hw, hh, palette.wall, palette.roof, palette.trim, slot);
    }

    // Trees with varied shapes
    const treeSpacing = 200;
    for (let i = 0; i < 5; i++) {
      const tx = ((i * treeSpacing + 60 - parallaxOffset * 0.4) % (W + treeSpacing) + W + treeSpacing) % (W + treeSpacing);
      drawDetailedTree(c, tx, groundY - 12, 0.85 + (i % 3) * 0.12, i + 2);
    }

    // Ground: curb, sidewalk, clean lawn
    c.fillStyle = "#94a3b8";
    c.fillRect(0, groundY - 5, W, 5);
    c.fillStyle = "#cbd5e1";
    c.fillRect(0, groundY, W, Math.min(H - groundY, 22));
    const lawnGrad = c.createLinearGradient(0, groundY + 22, 0, H);
    lawnGrad.addColorStop(0, "#6faa3a");
    lawnGrad.addColorStop(1, "#4a7c28");
    c.fillStyle = lawnGrad;
    c.fillRect(0, groundY + 22, W, H - groundY - 22);
  }

  function drawBone(c, bone, animTime) {
    const bob = Math.sin(animTime * 0.004 + bone.phase) * 3;
    const cx = bone.x + bone.width / 2;
    const cy = bone.y + bone.height / 2 + bob;
    const pulse = 0.45 + Math.sin(animTime * 0.006 + bone.phase) * 0.2;
    const w = bone.width;
    const h = bone.height;

    c.save();
    c.translate(cx, cy);
    c.rotate(Math.sin(animTime * 0.003 + bone.phase) * 0.08);

    const hw = w / 2;
    const hh = h / 2;
    const lobeX = hw * 0.58;
    const lobeR = hh * 0.56;
    const lobeSep = hh * 0.44;
    const shaftHalfH = hh * 0.2;
    const shaftLeft = -lobeX + lobeR * 0.38;
    const shaftWidth = (lobeX - lobeR * 0.38) * 2;

    function traceBone() {
      c.beginPath();
      c.roundRect(shaftLeft, -shaftHalfH, shaftWidth, shaftHalfH * 2, shaftHalfH * 0.45);
      c.arc(-lobeX, -lobeSep, lobeR, 0, Math.PI * 2);
      c.arc(-lobeX, lobeSep, lobeR, 0, Math.PI * 2);
      c.arc(lobeX, -lobeSep, lobeR, 0, Math.PI * 2);
      c.arc(lobeX, lobeSep, lobeR, 0, Math.PI * 2);
    }

    // Soft glow
    c.fillStyle = `rgba(255, 215, 90, ${0.16 * pulse})`;
    c.beginPath();
    c.ellipse(0, 0, hw + 4, hh + 5, 0, 0, Math.PI * 2);
    c.fill();

    // Base fill — warm tan with light top / darker bottom
    traceBone();
    const bodyGrad = c.createLinearGradient(0, -hh, 0, hh);
    bodyGrad.addColorStop(0, "#f2e2c8");
    bodyGrad.addColorStop(0.5, "#e4cfa8");
    bodyGrad.addColorStop(1, "#c4a06a");
    c.fillStyle = bodyGrad;
    c.fill();

    // Bottom shading
    c.save();
    traceBone();
    c.clip();
    c.fillStyle = "rgba(120, 82, 42, 0.16)";
    c.fillRect(-hw, hh * 0.05, w, hh);
    c.restore();

    // Dark tan outline
    traceBone();
    c.strokeStyle = "#8f6840";
    c.lineWidth = 1.6;
    c.lineJoin = "round";
    c.stroke();

    // Cream highlight along top of shaft
    c.save();
    traceBone();
    c.clip();
    c.fillStyle = "rgba(255, 249, 240, 0.9)";
    c.beginPath();
    c.roundRect(shaftLeft + 2, -shaftHalfH * 0.55, shaftWidth - 4, shaftHalfH * 0.42, 1);
    c.fill();

    // Gloss on top-left knuckle
    c.fillStyle = "rgba(255, 249, 240, 0.82)";
    c.beginPath();
    c.ellipse(-lobeX + lobeR * 0.1, -lobeSep - lobeR * 0.12, lobeR * 0.3, lobeR * 0.22, -0.35, 0, Math.PI * 2);
    c.fill();
    c.restore();

    if (bone.elevated) {
      c.fillStyle = `rgba(255, 200, 60, ${0.5 + pulse * 0.3})`;
      c.font = "bold 10px Arial, sans-serif";
      c.textAlign = "center";
      c.fillText("↑", 0, -hh - 10);
    }

    c.restore();
  }

  function drawScorePopup(c, popup) {
    const t = popup.life / popup.duration;
    const alpha = t > 0.7 ? (1 - t) / 0.3 : 1;
    const rise = (1 - t) * 28;
    c.save();
    c.globalAlpha = alpha;
    c.font = "bold 22px Arial, sans-serif";
    c.textAlign = "center";
    c.strokeStyle = "rgba(0, 0, 0, 0.45)";
    c.lineWidth = 3;
    c.strokeText(popup.text, popup.x, popup.y - rise);
    c.fillStyle = "#ffd166";
    c.fillText(popup.text, popup.x, popup.y - rise);
    c.fillStyle = "#fff";
    c.fillText(popup.text, popup.x, popup.y - rise - 1);
    c.restore();
  }

  global.World = {
    OBSTACLE_TYPES,
    pickRandomObstacleType,
    drawObstacle,
    drawBackground,
    drawBone,
    drawScorePopup,
  };
})(window);
