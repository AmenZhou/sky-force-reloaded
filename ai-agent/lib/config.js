import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONFIG_PATH = path.resolve(__dirname, '../agent-config.json');

const DEFAULTS = {
  version: 1,
  tuningGeneration: 0,
  bulletHellThreshold: 12,
  safeZoneXMin: 150,
  safeZoneXMax: 210,
  safeZoneYMax: 520,
  safeAnchorX: 180,
  safeAnchorY: 560,
  shieldSeekPct: 55,
  shieldPickupRange: 140,
  weaponSeekLevel: 3,
  weaponPickupRange: 120,
  threatAheadYTop: 120,
  threatAheadYBottom: 40,
  threatNearX: 70,
  panicShieldPct: 40,
  targets: { minWave: 3, maxHitsPer80Turns: 12, minScore: 8000 },
  lastTunedFrom: null,
};

export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    saveConfig(DEFAULTS);
    return { ...DEFAULTS };
  }
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  return { ...DEFAULTS, ...raw, targets: { ...DEFAULTS.targets, ...raw.targets } };
}

export function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
}
