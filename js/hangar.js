const HangarSystem = {
  round5(n) {
    return 5 * Math.round(n / 5);
  },

  config() {
    return window.HANGAR_CONFIG;
  },

  moduleIds() {
    return Object.keys(this.config().modules);
  },

  getLevel(save, moduleId) {
    return save.hangar?.[moduleId] ?? 0;
  },

  isModuleUnlocked(save, moduleId) {
    const m = this.config().modules[moduleId];
    if (!m || m.unlock <= 0) return true;
    return !!(save.hangarUnlockPaid?.[moduleId]);
  },

  upgradeCost(save, moduleId) {
    const cfg = this.config();
    const m = cfg.modules[moduleId];
    if (!m) return null;
    const level = this.getLevel(save, moduleId);
    if (level >= m.maxLevel) return null;
    let cost = this.round5(m.base * m.growth ** level);
    if (moduleId === 'cannon') {
      const discount = CollectionSystem.aggregatePassiveEffects(save).cannonCostMult;
      cost = this.round5(cost * discount);
    }
    if (level === 0 && m.unlock > 0 && !this.isModuleUnlocked(save, moduleId)) {
      cost += m.unlock;
    }
    return cost;
  },

  canUpgrade(save, moduleId) {
    const cost = this.upgradeCost(save, moduleId);
    if (cost == null) return false;
    return save.bankedStars >= cost;
  },

  purchaseUpgrade(save, moduleId) {
    const cost = this.upgradeCost(save, moduleId);
    if (cost == null || save.bankedStars < cost) return { ok: false };
    const m = this.config().modules[moduleId];
    const level = this.getLevel(save, moduleId);
    save.bankedStars -= cost;
    if (level === 0 && m.unlock > 0 && !save.hangarUnlockPaid?.[moduleId]) {
      save.hangarUnlockPaid = save.hangarUnlockPaid || {};
      save.hangarUnlockPaid[moduleId] = true;
    }
    save.hangar = save.hangar || {};
    save.hangar[moduleId] = level + 1;
    return { ok: true, newLevel: level + 1, cost };
  },

  computeStats(levels) {
    const hp = levels.hp || 0;
    const cannon = levels.cannon || 0;
    const wings = levels.wings || 0;
    const missiles = levels.missiles || 0;
    const magnet = levels.magnet || 0;
    return {
      shieldMax: 100 + hp * 15,
      cannonDpsMult: 1 + cannon * 0.1,
      cannonPattern: Math.min(4, 1 + Math.floor(cannon / 3)),
      cannonDamageBonus: Math.floor(cannon * 0.8),
      wingLevel: Math.floor(wings / 2),
      missileSalvo: 1 + Math.floor(missiles / 2),
      missileInterval: Math.max(1.2, 2.8 - missiles * 0.15),
      magnetRadius: 40 + magnet * 12,
      magnetStrength: 100 + magnet * 30,
      laserCharges: levels.laser || 0,
      shieldCharges: levels.energy_shield || 0,
      bombCharges: levels.mega_bomb || 0,
    };
  },

  statsFromSave(save) {
    return this.computeStats(save.hangar || {});
  },
};
