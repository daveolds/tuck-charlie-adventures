#!/usr/bin/env node
/**
 * Headless visual capture for Tucker & Charlie Adventures.
 * Starts a static server, drives the game through key UI states, saves PNGs.
 *
 * Usage:
 *   node scripts/visual-capture/capture.mjs [--port 8765] [--out .visual-screenshots]
 *   node scripts/visual-capture/capture.mjs --states gameplay,character-select
 *   node scripts/visual-capture/capture.mjs --validate   # exit 1 if capture fails
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const DEFAULT_PORT = 8765;
const DEFAULT_OUT = join(ROOT, ".visual-screenshots");
const VIEWPORT = { width: 800, height: 450 };

const ALL_STATES = [
  "controls",
  "character-select",
  "gameplay-tucker",
  "gameplay-charlie",
  "paused",
];

function parseArgs(argv) {
  const opts = {
    port: DEFAULT_PORT,
    out: DEFAULT_OUT,
    states: ALL_STATES,
    validate: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--validate") opts.validate = true;
    else if (arg === "--port") {
      opts.port = Number(argv[++i]);
    } else if (arg === "--out") {
      opts.out = resolve(argv[++i]);
    } else if (arg === "--states") {
      opts.states = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/visual-capture/capture.mjs [options]

Options:
  --port PORT       Static server port (default ${DEFAULT_PORT})
  --out DIR         Output directory (default .visual-screenshots)
  --states LIST     Comma-separated states (${ALL_STATES.join(", ")})
  --validate        Exit 1 on failure
  --help            Show this help
`);
      process.exit(0);
    }
  }

  return opts;
}

function waitForServer(url, timeoutMs = 15000) {
  return new Promise((resolvePromise, reject) => {
    const start = Date.now();
    const tick = async () => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          resolvePromise();
          return;
        }
      } catch {
        // retry
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`));
        return;
      }
      setTimeout(tick, 200);
    };
    tick();
  });
}

function startStaticServer(port) {
  return spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "ignore",
  });
}

async function captureState(page, name, outDir) {
  const fullPath = join(outDir, `${name}.png`);
  const canvasPath = join(outDir, `${name}-canvas.png`);

  await page.waitForSelector("#game-canvas", { state: "visible", timeout: 10000 });
  await page.waitForTimeout(300);

  await page.screenshot({ path: fullPath, fullPage: false });
  const canvas = page.locator("#game-canvas");
  await canvas.screenshot({ path: canvasPath });

  return { name, fullPath, canvasPath };
}

async function driveToState(page, state) {
  const base = `http://127.0.0.1:${page.__port}/index.html`;

  switch (state) {
    case "controls":
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForSelector("#controls-panel:not(.hidden)");
      break;

    case "character-select":
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click("#next-btn");
      await page.waitForSelector("#select-panel:not(.hidden)");
      await page.waitForTimeout(400);
      break;

    case "gameplay-tucker":
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click("#next-btn");
      await page.waitForSelector("#select-panel:not(.hidden)");
      await page.click('.char-btn[data-char="tucker"]');
      await page.click("#start-btn");
      await page.waitForSelector("#hud:not(.hidden)");
      await page.waitForTimeout(2000);
      break;

    case "gameplay-charlie":
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click("#next-btn");
      await page.waitForSelector("#select-panel:not(.hidden)");
      await page.click('.char-btn[data-char="charlie"]');
      await page.click("#start-btn");
      await page.waitForSelector("#hud:not(.hidden)");
      await page.waitForTimeout(2000);
      break;

    case "paused":
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click("#next-btn");
      await page.click("#start-btn");
      await page.waitForSelector("#hud:not(.hidden)");
      await page.waitForTimeout(800);
      await page.keyboard.press("Escape");
      await page.waitForSelector("#pause-menu:not(.hidden)");
      await page.waitForTimeout(300);
      break;

    default:
      throw new Error(`Unknown visual state: ${state}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  await mkdir(opts.out, { recursive: true });

  const url = `http://127.0.0.1:${opts.port}/`;
  const server = startStaticServer(opts.port);
  let browser;

  const cleanup = async () => {
    if (browser) await browser.close().catch(() => {});
    server.kill("SIGTERM");
  };

  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(130);
  });

  try {
    await waitForServer(url);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.__port = opts.port;

    const results = [];
    const errors = [];

    for (const state of opts.states) {
      try {
        await driveToState(page, state);
        const shot = await captureState(page, state, opts.out);
        results.push(shot);
        console.log(`✓ captured ${state} → ${shot.fullPath}`);
      } catch (err) {
        errors.push({ state, message: err.message });
        console.error(`✗ failed ${state}: ${err.message}`);
      }
    }

    const manifest = {
      capturedAt: new Date().toISOString(),
      viewport: VIEWPORT,
      states: results.map(({ name, fullPath, canvasPath }) => ({
        name,
        fullPath,
        canvasPath,
      })),
      errors,
    };

    const manifestPath = join(opts.out, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Manifest: ${manifestPath}`);

    if (errors.length > 0) {
      if (opts.validate) process.exit(1);
      process.exit(0);
    }
  } catch (err) {
    console.error(err.message || err);
    if (opts.validate) process.exit(1);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();
