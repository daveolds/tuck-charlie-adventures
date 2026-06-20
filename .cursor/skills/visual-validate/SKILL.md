---
name: visual-validate
description: >-
  Renders and validates visual/UI changes automatically using headless browser
  screenshots. Use for ANY visual request — layout, colors, sprites, canvas art,
  CSS, menus, HUD, animations, positioning, sizing, or "make it look like X".
  Mandatory after editing html, css, js/world.js, js/game.js, or assets. Never
  ask the user to run the app or provide screenshots.
---

# Visual Validate

The agent owns visual verification. The user should never need to run the game or send screenshots for routine visual work.

## When this applies

Trigger on any request that changes how something **looks**, including:

- Canvas/world rendering (`js/world.js`)
- Game UI, menus, HUD (`index.html`, `css/style.css`, `js/game.js`)
- Sprites, colors, spacing, alignment, typography
- "Move X left", "make Y bigger", "change the sky", "fix overlap"

## Mandatory workflow

Complete **all** steps before telling the user the visual change is done.

```
Visual validation checklist:
- [ ] 1. Define acceptance criteria from the user's request
- [ ] 2. Install capture tooling if missing
- [ ] 3. Capture screenshots
- [ ] 4. Inspect screenshots (Read tool on PNG files)
- [ ] 5. Compare against acceptance criteria
- [ ] 6. Fix and re-capture if needed (max 3 iterations)
- [ ] 7. Report validation results with evidence
```

### Step 1 — Acceptance criteria

Before coding, write 2–5 concrete, observable checks derived from the request.

Example request: *"Move the balloon higher and make it slightly larger"*

```
- Balloon is visibly above its previous position relative to the house roofline
- Balloon sprite is larger than before (roughly 10–20% scale increase)
- Balloon does not overlap the HUD or clip off-screen
- Gameplay still renders at 60fps feel (no obvious layout break)
```

### Step 2 — Install tooling (once per environment)

From repo root, run the capture wrapper — it installs what it needs:

```bash
bash scripts/visual-capture/run.sh --help
python3 scripts/visual-capture/capture.py --help
```

**Preferred:** `bash scripts/visual-capture/run.sh` (uses npm+Playwright if available, otherwise Python+Playwright).

If Python path is used and Playwright is missing:

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
```

If npm is available:

```bash
npm install && npx playwright install chromium
```

### Step 3 — Capture screenshots

Start capture after making changes:

```bash
bash scripts/visual-capture/run.sh
```

**Pick states relevant to the change** (default captures all):

| State | Use when changing… |
|-------|-------------------|
| `controls` | Startup menu, title, buttons |
| `character-select` | Character previews, select UI |
| `gameplay-tucker` | World art, obstacles, Tucker appearance |
| `gameplay-charlie` | Charlie-specific visuals |
| `paused` | Overlays, pause menu, HUD layering |

```bash
bash scripts/visual-capture/run.sh --states gameplay-tucker,gameplay-charlie
```

Output lands in `.visual-screenshots/` with `manifest.json`.

For before/after comparisons, capture baseline **before** editing:

```bash
cp -r .visual-screenshots .visual-screenshots-before   # optional baseline
# make changes
npm run visual:capture
```

### Step 4 — Inspect screenshots

Use the **Read** tool on PNG files — the agent can see images directly:

```
.visual-screenshots/gameplay-tucker.png
.visual-screenshots/gameplay-tucker-canvas.png
```

Prefer `-canvas.png` for pure game rendering; use full-page PNG when menus/overlays/HUD matter.

Also check browser console for errors by re-running capture — failures print to stderr.

### Step 5 — Validate

For each acceptance criterion, mark **pass** or **fail** with a one-line reason referencing what you see in the screenshot.

If any criterion fails → go to Step 6.
If all pass → Step 7.

### Step 6 — Fix loop

1. Diagnose from screenshot evidence (not guesses)
2. Apply a targeted fix
3. Re-run capture for affected states
4. Re-inspect images
5. Repeat until all criteria pass or 3 iterations exhausted

If still failing after 3 iterations, report what was tried, show the latest screenshot paths, and state what remains wrong — still do **not** ask the user to validate manually unless capture tooling is broken.

### Step 7 — Report to user

Include a **Visual validation** section:

```markdown
## Visual validation

**Criteria**
- [x] Balloon sits above roofline — visible gap in gameplay-tucker screenshot
- [x] Balloon ~15% larger — compared to prior capture
- [x] No HUD overlap — clear separation at top-right

**Evidence:** `.visual-screenshots/gameplay-tucker.png`

**Iterations:** 1 (passed on first capture)
```

Do not say "please check in your browser" or "let me know if it looks right."

## Server note

The capture script starts `python3 -m http.server` on port 8765 automatically. If the port is busy:

```bash
bash scripts/visual-capture/run.sh --port 8770
```

## Troubleshooting

| Problem | Action |
|---------|--------|
| `playwright` not found | Run `python3 -m pip install playwright && python3 -m playwright install chromium` or `npm install && npx playwright install chromium` |
| Port in use | Use `--port` with a free port |
| Blank canvas | Wait longer in capture script or check JS errors in terminal output |
| Change only visible in one character | Capture both `gameplay-tucker` and `gameplay-charlie` |
| Menu-only change | Capture `controls` or `character-select` |

## Hard rules

1. **Never** finish a visual task without running capture and reading the PNGs
2. **Never** ask the user to screenshot or confirm visuals unless capture tooling is completely unavailable after install attempts
3. **Always** iterate on failures yourself before responding
4. **Always** cite screenshot paths as evidence in the final response
