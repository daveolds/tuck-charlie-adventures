# Tucker & Charlie Adventures

[![Deploy to GitHub Pages](https://github.com/daveolds/tuck-charlie-adventures/actions/workflows/deploy.yml/badge.svg)](https://github.com/daveolds/tuck-charlie-adventures/actions/workflows/deploy.yml)

A web-based side-scrolling jumper game honoring two very good dachshunds — **Tucker** and **Charlie**.

Run through the neighborhood, jump over obstacles, and survive as long as you can. Your score is the number of seconds you stay in the game.

## Play online

**[Play Tucker & Charlie Adventures](https://daveolds.github.io/tuck-charlie-adventures/)**

Pushes to `main` deploy automatically via GitHub Actions.

## Play locally

No build step required. Open `index.html` in any modern browser, or serve the folder with a simple static server:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## How to play

1. Read the controls on the startup screen and click **Next**
2. Choose **Tucker** (black) or **Charlie** (medium brown)
3. Click **Start Adventure**

## Controls

| Input | Action |
|-------|--------|
| ← → or A D | Move left / right |
| Space | Jump |
| ↑ or W | Super jump (high arc, float down) |

Super jump has an 8-second cooldown. You start with 3 hearts — hitting an obstacle costs one life, flashes the screen red, and gives you 3 seconds of invincibility before you can lose another.

## Characters

- **Tucker** — Black dachshund
- **Charlie** — Medium brown dachshund

Character stats (lives, speed, jump height, etc.) are configured separately and can be tuned per character in future updates.

## Scoring

Score equals whole seconds survived. Your best time is saved locally in the browser.

## Tech

Vanilla HTML, CSS, and JavaScript with Canvas rendering. No dependencies.

## License

MIT — made with love for Tucker and Charlie.
