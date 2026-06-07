/**
 * Sky Force Reloaded — Playwright game agent
 *
 * Modes:
 *   node agent.js --heuristic --headless --turns 80 --tick 500   (default, uses agent-config.json)
 *   node agent.js --model claude --headless --turns 30           (LLM player, needs API key)
 *   node agent.js --model openai --headless --turns 30
 *   node agent.js --heuristic --tune-after --headless            (run then auto-tune config)
 *
 * Self-improve loop: node improve.js --headless --generations 3 --turns 80
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadConfig } from './lib/config.js';
import { pickHeuristicMove } from './lib/heuristic.js';
import { createLLM, pickLLMMove } from './lib/llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAME_PATH = path.resolve(__dirname, '../sky_force_reloaded.html');
const GAME_URL = process.env.GAME_URL || `file://${GAME_PATH}`;

const args = process.argv.slice(2);
const HEADLESS = args.includes('--headless');
const TUNE_AFTER = args.includes('--tune-after');
const TICK_MS = parseInt(args[args.indexOf('--tick') + 1], 10) || 500;
const MAX_TURNS = parseInt(args[args.indexOf('--turns') + 1], 10) || 60;
const MODEL_ARG = args.includes('--model') ? args[args.indexOf('--model') + 1] : null;
const USE_HEURISTIC = args.includes('--heuristic') || !MODEL_ARG;
const MODE = USE_HEURISTIC ? 'heuristic' : `llm:${MODEL_ARG}`;

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

async function applyAction(page, action, tickMs) {
  const keys = {
    move_left: 'ArrowLeft',
    move_right: 'ArrowRight',
    move_up: 'ArrowUp',
    move_down: 'ArrowDown',
  };
  if (keys[action]) {
    await page.keyboard.down(keys[action]);
    await page.waitForTimeout(tickMs);
    await page.keyboard.up(keys[action]);
    return;
  }
  await page.waitForTimeout(tickMs);
}

async function readState(page) {
  return page.evaluate(() => (window.__SKY_FORCE__?.getState?.() ?? null));
}

async function main() {
  const logger = new Logger();
  const config = loadConfig();
  let llm = null;

  if (!USE_HEURISTIC) {
    llm = await createLLM(MODEL_ARG);
    console.log(`[agent] LLM mode: ${llm.name}`);
  } else {
    console.log(`[agent] Heuristic mode (config gen ${config.tuningGeneration})`);
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();

  page.on('pageerror', (err) => {
    logger.write({ type: 'page_error', kind: 'pageerror', message: err.message });
  });

  await page.goto(GAME_URL);
  await page.click('#btn-start');
  await page.waitForTimeout(400);

  logger.write({
    type: 'session_start',
    url: GAME_URL,
    mode: MODE,
    tick_ms: TICK_MS,
    max_turns: MAX_TURNS,
    configGeneration: config.tuningGeneration,
  });

  let lastScore = 0;
  let lastShield = 100;
  let hits = 0;
  let slowTicks = 0;
  let turnsCompleted = 0;
  let lastAction = null;
  let sameActionStreak = 0;

  for (let turn = 1; turn <= MAX_TURNS; turn += 1) {
    const state = await readState(page);
    if (!state?.running) break;
    turnsCompleted = turn;

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
      enemyBullets: (state.enemyBullets || []).length,
    });

    const action = USE_HEURISTIC
      ? pickHeuristicMove(state, turn, config, { lastAction, sameActionStreak })
      : await pickLLMMove(state, turn, llm, logger);

    if (action === lastAction) sameActionStreak += 1;
    else sameActionStreak = 1;
    lastAction = action;

    logger.write({ type: 'action', turn, action });
    await applyAction(page, action, TICK_MS);
  }

  const final = await readState(page);
  logger.write({
    type: 'session_end',
    turns: turnsCompleted,
    finalScore: final?.score ?? lastScore,
    finalWave: final?.wave ?? 0,
    finalLives: final?.lives ?? 0,
    finalRunStars: final?.runStars ?? 0,
    hitsTaken: hits,
    slowMoTicks: slowTicks,
    running: final?.running ?? false,
  });

  await logger.close();
  await browser.close();

  console.log(`[done] mode=${MODE} score=${final?.score ?? lastScore} wave=${final?.wave} hits=${hits}`);
  console.log(`[log] ${logger.logPath}`);

  if (TUNE_AFTER && USE_HEURISTIC) {
    console.log('[tune] Running auto-tuner...');
    spawnSync('node', ['tune.js', '--log', logger.logPath], { cwd: __dirname, stdio: 'inherit' });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
