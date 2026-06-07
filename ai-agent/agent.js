/**
 * Sky Force Reloaded — Playwright game agent
 *
 * Modes:
 *   node agent.js --heuristic --headless --turns 80 --tick 500
 *   node agent.js --heuristic --stage --stage-id 2 --turns 200 --tick 350
 *   node agent.js --heuristic --tune-after --headless
 *   node agent.js --heuristic --update-memory --headless
 *
 * Self-improve: node improve-loop.js --headless --generations 3
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadConfig } from './lib/config.js';
import { pickHeuristicMove } from './lib/heuristic.js';
import { createLLM, pickLLMMove } from './lib/llm.js';
import { loadPlaybook, playbookVersion, getStageHints } from './lib/memory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAME_PATH = path.resolve(__dirname, '../sky_force_reloaded.html');
const GAME_URL = process.env.GAME_URL || `file://${GAME_PATH}`;
const PROFILE = 'sky-force-reloaded';

const args = process.argv.slice(2);
const HEADLESS = args.includes('--headless');
const STAGE_MODE = args.includes('--stage');
const STAGE_ID = parseInt(args[args.indexOf('--stage-id') + 1], 10) || 1;
const TUNE_AFTER = args.includes('--tune-after');
const UPDATE_MEMORY = args.includes('--update-memory');
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

  event(name, payload = {}) {
    this.write({ type: 'event', event: name, ...payload });
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

function detectEvents(logger, state, ctx) {
  const banner = state.lastBanner;
  if (banner && banner !== ctx.lastBanner) {
    logger.event('section_banner', {
      turn: ctx.turn,
      banner,
      section: state.section ?? state.wave,
      stageId: state.stageId,
    });
    ctx.lastBanner = banner;
  }

  const section = state.section ?? state.wave;
  if (section !== ctx.lastSection) {
    ctx.lastSection = section;
    ctx.sectionStartTurn = ctx.turn;
  }

  if (state.bossActive && !ctx.wasBossActive) {
    logger.event('boss_spawn', {
      turn: ctx.turn,
      bossName: state.bossName,
      section,
    });
  }
  ctx.wasBossActive = !!state.bossActive;

  if (state.lives < ctx.lastLives) {
    logger.event('death', {
      turn: ctx.turn,
      livesLeft: state.lives,
      cause: state.deathCause || 'hit',
      section,
      banner: state.lastBanner,
      runStars: state.runStars,
    });
  }
  ctx.lastLives = state.lives;

  const stars = state.runStars ?? 0;
  if (stars >= ctx.nextStarMilestone) {
    logger.event('star_milestone', { turn: ctx.turn, runStars: stars, milestone: ctx.nextStarMilestone });
    ctx.nextStarMilestone += 25;
  }
  ctx.lastRunStars = stars;

  if (state.outcome === 'stage_clear' && !ctx.reportedClear) {
    logger.event('stage_clear', {
      turn: ctx.turn,
      runStars: state.runStars,
      score: state.score,
      section,
    });
    ctx.reportedClear = true;
  }
  if (state.outcome === 'game_over' && !ctx.reportedGameOver) {
    logger.event('game_over', {
      turn: ctx.turn,
      cause: state.deathCause,
      runStars: state.runStars,
      section,
    });
    ctx.reportedGameOver = true;
  }
}

async function main() {
  const logger = new Logger();
  const config = loadConfig();
  loadPlaybook();
  const pbVersion = playbookVersion();
  const stageHints = STAGE_MODE ? getStageHints(STAGE_ID) : null;
  let llm = null;

  if (!USE_HEURISTIC) {
    llm = await createLLM(MODEL_ARG);
    console.log(`[agent] LLM mode: ${llm.name}`);
  } else {
    console.log(`[agent] Heuristic mode (config gen ${config.tuningGeneration}, playbook v${pbVersion})`);
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();

  page.on('pageerror', (err) => {
    logger.write({ type: 'page_error', kind: 'pageerror', message: err.message });
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      logger.write({ type: 'console_error', kind: 'console', text: msg.text() });
    }
  });

  await page.goto(GAME_URL);
  if (STAGE_MODE) {
    await page.evaluate(({ id }) => {
      window.__SKY_FORCE__?.startStage?.(id, 'normal');
    }, { id: STAGE_ID });
  } else {
    await page.click('#btn-arcade');
  }
  await page.waitForTimeout(400);

  logger.write({
    type: 'session_start',
    url: GAME_URL,
    profile: PROFILE,
    mode: MODE,
    gameMode: STAGE_MODE ? `stage-${STAGE_ID}` : 'arcade',
    stageId: STAGE_MODE ? STAGE_ID : null,
    tick_ms: TICK_MS,
    max_turns: MAX_TURNS,
    configGeneration: config.tuningGeneration,
    playbookVersion: pbVersion,
  });

  let lastScore = 0;
  let lastShield = 100;
  let hits = 0;
  let slowTicks = 0;
  let turnsCompleted = 0;
  let lastAction = null;
  let sameActionStreak = 0;
  let bossTicks = 0;
  let maxSection = 1;

  const ctx = {
    turn: 0,
    lastBanner: null,
    lastSection: 1,
    sectionStartTurn: 1,
    wasBossActive: false,
    lastLives: 3,
    lastRunStars: 0,
    nextStarMilestone: 25,
    reportedClear: false,
    reportedGameOver: false,
  };

  for (let turn = 1; turn <= MAX_TURNS; turn += 1) {
    ctx.turn = turn;
    const state = await readState(page);
    if (!state?.running) {
      detectEvents(logger, state || {}, ctx);
      break;
    }
    turnsCompleted = turn;

    detectEvents(logger, state, ctx);
    maxSection = Math.max(maxSection, state.sectionsReached ?? state.section ?? state.wave ?? 1);

    if (state.shieldPct < lastShield - 1) hits += 1;
    if (state.timeScale < 1) slowTicks += 1;
    if (state.bossActive) bossTicks += 1;
    lastShield = state.shieldPct;
    lastScore = state.score;

    logger.write({
      type: 'tick',
      turn,
      score: state.score,
      runStars: state.runStars,
      wave: state.wave,
      section: state.section ?? state.wave,
      stageId: state.stageId,
      stageName: state.stageName,
      lastBanner: state.lastBanner,
      lives: state.lives,
      shieldPct: state.shieldPct,
      weaponLevel: state.weaponLevel,
      combo: state.combo,
      timeScale: state.timeScale,
      playerY: state.playerY,
      enemyBullets: (state.enemyBullets || []).length,
      bossActive: !!state.bossActive,
      bossHpPct: state.bossHpPct ?? 100,
      hostagesRescued: state.hostagesRescued,
      hostagesTotal: state.hostagesTotal,
      runHits: state.runHits,
    });

    const action = USE_HEURISTIC
      ? pickHeuristicMove(state, turn, config, { lastAction, sameActionStreak, stageHints })
      : await pickLLMMove(state, turn, llm, logger);

    if (action === lastAction) sameActionStreak += 1;
    else sameActionStreak = 1;
    lastAction = action;

    logger.write({ type: 'action', turn, action });
    await applyAction(page, action, TICK_MS);
  }

  const final = await readState(page);
  if (final) detectEvents(logger, final, ctx);

  const stageCleared = final?.outcome === 'stage_clear' || ctx.reportedClear;
  const playDurationSec = Math.round((Date.now() - logger.startTime) / 1000);

  logger.write({
    type: 'session_end',
    turns: turnsCompleted,
    finalScore: final?.score ?? lastScore,
    finalWave: final?.wave ?? 0,
    finalRunStars: final?.runStars ?? ctx.lastRunStars,
    finalLives: final?.lives ?? 0,
    hitsTaken: hits,
    slowMoTicks: slowTicks,
    bossTicks,
    sectionsReached: final?.sectionsReached ?? maxSection,
    stageCleared,
    deathCause: final?.deathCause ?? null,
    running: final?.running ?? false,
    playDurationSec,
  });

  await logger.close();
  await browser.close();

  console.log(`[done] mode=${MODE} score=${final?.score ?? lastScore} runStars=${final?.runStars ?? 0} cleared=${stageCleared} hits=${hits}`);
  console.log(`[log] ${logger.logPath}`);

  if (TUNE_AFTER && USE_HEURISTIC) {
    console.log('[tune] Running auto-tuner...');
    spawnSync('node', ['tune.js', '--log', logger.logPath], { cwd: __dirname, stdio: 'inherit' });
  }

  if (UPDATE_MEMORY) {
    console.log('[memory] Updating playbook + metrics...');
    spawnSync('node', ['memory/update-from-log.js', '--log', logger.logPath, '--backlog'], {
      cwd: __dirname,
      stdio: 'inherit',
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
