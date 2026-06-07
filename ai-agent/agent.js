/**
 * Sky Force Reloaded — heuristic Playwright agent
 * Usage: node agent.js --headless --turns 60 --tick 500
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAME_PATH = path.resolve(__dirname, '../sky_force_reloaded.html');
const GAME_URL = process.env.GAME_URL || `file://${GAME_PATH}`;

const args = process.argv.slice(2);
const HEADLESS = args.includes('--headless');
const TICK_MS = parseInt(args[args.indexOf('--tick') + 1], 10) || 500;
const MAX_TURNS = parseInt(args[args.indexOf('--turns') + 1], 10) || 60;

class Logger {
  constructor() {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.logDir = path.resolve(__dirname, 'logs');
    this.logPath = path.join(this.logDir, `run-${ts}.jsonl`);
    fs.mkdirSync(this.logDir, { recursive: true });
    this.stream = fs.createWriteStream(this.logPath, { flags: 'a' });
    this.startTime = Date.now();
    console.log(`[logger] Writing to ${this.logPath}`);
  }

  write(obj) {
    this.stream.write(`${JSON.stringify({
      ...obj,
      ts: new Date().toISOString(),
      elapsed_s: Math.round((Date.now() - this.startTime) / 1000),
    })}\n`);
  }

  close() {
    return new Promise((resolve) => this.stream.end(resolve));
  }
}

function pickMove(state, turn) {
  if (!state || !state.running) return 'wait';
  const { timeScale, shieldPct } = state;
  if (timeScale < 1) return 'hold_slowmo';
  if (shieldPct < 40) return turn % 2 === 0 ? 'move_left' : 'move_right';
  const cycle = ['move_left', 'move_right', 'move_up', 'move_down'];
  return cycle[turn % cycle.length];
}

async function applyAction(page, action) {
  const keys = {
    move_left: 'ArrowLeft',
    move_right: 'ArrowRight',
    move_up: 'ArrowUp',
    move_down: 'ArrowDown',
  };
  if (keys[action]) {
    await page.keyboard.down(keys[action]);
    await page.waitForTimeout(TICK_MS);
    await page.keyboard.up(keys[action]);
    return;
  }
  if (action === 'hold_slowmo') {
    await page.waitForTimeout(TICK_MS);
    return;
  }
  await page.waitForTimeout(TICK_MS);
}

async function readState(page) {
  return page.evaluate(() => (window.__SKY_FORCE__?.getState?.() ?? null));
}

async function main() {
  const logger = new Logger();
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();

  page.on('pageerror', (err) => {
    logger.write({ type: 'page_error', kind: 'pageerror', message: err.message });
  });

  await page.goto(GAME_URL);
  await page.click('#btn-start');
  await page.waitForTimeout(400);

  logger.write({ type: 'session_start', url: GAME_URL, tick_ms: TICK_MS, max_turns: MAX_TURNS });

  let lastScore = 0;
  let lastShield = 100;
  let hits = 0;
  let slowTicks = 0;

  for (let turn = 1; turn <= MAX_TURNS; turn += 1) {
    const state = await readState(page);
    if (!state?.running) break;

    if (state.shieldPct < lastShield - 1) hits += 1;
    if (state.timeScale < 1) slowTicks += 1;
    lastShield = state.shieldPct;
    lastScore = state.score;

    logger.write({
      type: 'tick',
      turn,
      score: state.score,
      runStars: state.runStars,
      wave: state.wave,
      lives: state.lives,
      shieldPct: state.shieldPct,
      weaponLevel: state.weaponLevel,
      combo: state.combo,
      timeScale: state.timeScale,
    });

    const action = pickMove(state, turn);
    logger.write({ type: 'action', turn, action });

    await applyAction(page, action);
  }

  const final = await readState(page);
  logger.write({
    type: 'session_end',
    turns: MAX_TURNS,
    finalScore: final?.score ?? lastScore,
    finalWave: final?.wave ?? 0,
    finalLives: final?.lives ?? 0,
    hitsTaken: hits,
    slowMoTicks: slowTicks,
    running: final?.running ?? false,
  });

  await logger.close();
  await browser.close();

  console.log(`[done] score=${final?.score ?? lastScore} wave=${final?.wave} hits=${hits} slowTicks=${slowTicks}`);
  console.log(`[log] ${logger.logPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
