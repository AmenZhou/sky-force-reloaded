const CollectionSystem = {
  config() {
    return window.COLLECTION_CONFIG;
  },

  getCardDef(cardId) {
    const cfg = this.config();
    return cfg.cards.permanent.find((c) => c.id === cardId)
      || cfg.cards.temporary.find((c) => c.id === cardId);
  },

  ownedCards(save) {
    return save.collection?.cards || [];
  },

  ownedParts(save) {
    return save.collection?.parts || [];
  },

  equippedShip(save) {
    return save.equippedShip || 'enforcer';
  },

  isShipUnlocked(save, shipId) {
    const ship = this.config().ships[shipId];
    if (!ship) return false;
    if (ship.unlockedByDefault) return true;
    const parts = ship.parts || [];
    return parts.every((p) => (save.collection?.parts || []).includes(p));
  },

  shipPartProgress(save, shipId) {
    const ship = this.config().ships[shipId];
    if (!ship || !ship.parts?.length) return { have: 0, need: 0 };
    const owned = new Set(save.collection?.parts || []);
    const have = ship.parts.filter((p) => owned.has(p)).length;
    return { have, need: ship.parts.length, parts: ship.parts };
  },

  rollCardDrop(source, luckMult = 1) {
    const rates = this.config().dropRates;
    const rate = (source === 'elite' ? rates.eliteCard : rates.crateCard) * luckMult;
    if (Math.random() > rate) return null;
    const pool = this.config().cards.permanent.filter((c) => true);
    return pool[Math.floor(Math.random() * pool.length)];
  },

  rollPartDrop(luckMult = 1, source = 'elite') {
    const rates = this.config().dropRates;
    const rate = (source === 'radar' ? rates.radarPart : rates.elitePart) * luckMult;
    if (Math.random() > rate) return null;
    const allParts = Object.keys(this.config().partLabels);
    const save = SkyForceSave.load();
    const owned = new Set(save.collection?.parts || []);
    const missing = allParts.filter((p) => !owned.has(p));
    const pool = missing.length ? missing : allParts;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  addUnconfirmedCard(save, cardId) {
    if ((save.runUnconfirmed?.cards || []).includes(cardId)) return false;
    if ((save.collection?.cards || []).includes(cardId)) return false;
    save.runUnconfirmed = save.runUnconfirmed || { cards: [], parts: [] };
    save.runUnconfirmed.cards.push(cardId);
    return true;
  },

  addUnconfirmedPart(save, partId) {
    if ((save.runUnconfirmed?.parts || []).includes(partId)) return false;
    if ((save.collection?.parts || []).includes(partId)) return false;
    save.runUnconfirmed = save.runUnconfirmed || { cards: [], parts: [] };
    save.runUnconfirmed.parts.push(partId);
    return true;
  },

  confirmRunLoot(save) {
    save.collection = save.collection || { cards: [], parts: [] };
    const unconfirmed = save.runUnconfirmed || { cards: [], parts: [] };
    const newCards = [];
    const newParts = [];
    unconfirmed.cards.forEach((id) => {
      if (!save.collection.cards.includes(id)) {
        save.collection.cards.push(id);
        newCards.push(id);
      }
    });
    unconfirmed.parts.forEach((id) => {
      if (!save.collection.parts.includes(id)) {
        save.collection.parts.push(id);
        newParts.push(id);
      }
    });
    save.runUnconfirmed = { cards: [], parts: [] };
    return { newCards, newParts };
  },

  discardRunLoot(save) {
    save.runUnconfirmed = { cards: [], parts: [] };
  },

  activateTemporaryCard(save, cardId) {
    const def = this.getCardDef(cardId);
    if (!def?.durationSec) return false;
    save.activeTempCards = save.activeTempCards || {};
    save.activeTempCards[cardId] = Date.now() + def.durationSec * 1000;
    return true;
  },

  getActiveTempEffects(save) {
    const now = Date.now();
    const active = save.activeTempCards || {};
    const effects = { damageMult: 1, starPickupMult: 1 };
    Object.keys(active).forEach((id) => {
      if (active[id] < now) {
        delete active[id];
        return;
      }
      const def = this.getCardDef(id);
      if (def?.effect?.damageMult) effects.damageMult *= def.effect.damageMult;
      if (def?.effect?.starPickupMult) effects.starPickupMult *= def.effect.starPickupMult;
    });
    return effects;
  },

  aggregatePassiveEffects(save) {
    const cards = this.ownedCards(save);
    const agg = {
      magnetMult: 1,
      cannonCostMult: 1,
      starBankMult: 1,
      comboDecayMult: 1,
      shieldFlat: 0,
      cannonDpsMult: 1,
      rescueScoreBonus: 0,
      lootLuckMult: 1,
      bonusBombCharge: 0,
      noHitStarBonus: 0,
      startShieldFull: false,
    };
    cards.forEach((id) => {
      const def = this.getCardDef(id);
      if (!def?.effect) return;
      const e = def.effect;
      if (e.magnetMult) agg.magnetMult *= e.magnetMult;
      if (e.cannonCostMult) agg.cannonCostMult *= e.cannonCostMult;
      if (e.starBankMult) agg.starBankMult *= e.starBankMult;
      if (e.comboDecayMult) agg.comboDecayMult *= e.comboDecayMult;
      if (e.shieldFlat) agg.shieldFlat += e.shieldFlat;
      if (e.cannonDpsMult) agg.cannonDpsMult *= e.cannonDpsMult;
      if (e.rescueScoreBonus) agg.rescueScoreBonus += e.rescueScoreBonus;
      if (e.lootLuckMult) agg.lootLuckMult *= e.lootLuckMult;
      if (e.bonusBombCharge) agg.bonusBombCharge += e.bonusBombCharge;
      if (e.noHitStarBonus) agg.noHitStarBonus += e.noHitStarBonus;
      if (e.startShieldFull) agg.startShieldFull = true;
    });
    return agg;
  },

  applyShipToStats(baseStats, shipId) {
    const ship = this.config().ships[shipId] || this.config().ships.enforcer;
    const m = ship.mods || {};
    return {
      ...baseStats,
      shieldMax: Math.round(baseStats.shieldMax * (m.shieldMult || 1)),
      moveSpeedMult: m.speedMult || 1,
      luckMult: m.luckMult || 1,
      ramDamageMult: m.ramDamageMult || 1,
      missileSwarm: !!m.missileSwarm,
      cannonSpreadTight: !!m.cannonSpreadTight,
      shipId: ship.id,
      shipName: ship.name,
    };
  },

  mergeHangarWithCollection(hangarStats, save) {
    const passives = this.aggregatePassiveEffects(save);
    const temp = this.getActiveTempEffects(save);
    const shipId = this.equippedShip(save);
    let stats = {
      ...hangarStats,
      magnetRadius: Math.round(hangarStats.magnetRadius * passives.magnetMult),
      cannonDpsMult: hangarStats.cannonDpsMult * passives.cannonDpsMult,
      shieldMax: hangarStats.shieldMax + passives.shieldFlat,
      bombCharges: hangarStats.bombCharges + passives.bonusBombCharge,
      comboDecayMult: passives.comboDecayMult,
      starBankMult: passives.starBankMult,
      rescueScoreBonus: passives.rescueScoreBonus,
      noHitStarBonus: passives.noHitStarBonus,
      startShieldFull: passives.startShieldFull,
      lootLuckMult: passives.lootLuckMult,
      damageMult: temp.damageMult,
      starPickupMult: temp.starPickupMult,
      cannonCostMult: passives.cannonCostMult,
    };
    stats = this.applyShipToStats(stats, shipId);
    return stats;
  },
};
