const SKY_FORCE_SAVE_KEY = 'sky-force-reloaded-v1';
const MEDAL_IDS = ['destroy70', 'destroy100', 'rescueAll', 'noHit'];
const DIFFICULTY_ORDER = ['normal', 'hard', 'insane', 'nightmare'];

const SkyForceSave = {
  _default() {
    return {
      bankedStars: 0,
      hangar: {},
      hangarUnlockPaid: {},
      unlockedStages: [1],
      highScore: 0,
      stageClears: {},
      stageMedals: {},
      friendCheckpointScore: 42000,
      equippedShip: 'enforcer',
      unlockedShips: ['enforcer'],
      collection: { cards: [], parts: [] },
      runUnconfirmed: { cards: [], parts: [] },
      activeTempCards: {},
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(SKY_FORCE_SAVE_KEY);
      if (!raw) return this._default();
      const save = { ...this._default(), ...JSON.parse(raw) };
      save.bankedStars = Math.max(0, Math.floor(Number(save.bankedStars) || 0));
      return save;
    } catch {
      return this._default();
    }
  },

  write(data) {
    localStorage.setItem(SKY_FORCE_SAVE_KEY, JSON.stringify(data));
  },

  getBankedStars() {
    return this.load().bankedStars;
  },

  bankRunStars(amount) {
    const save = this.load();
    const credit = Math.max(0, Math.floor(Number(amount) || 0));
    save.bankedStars += credit;
    this.write(save);
    return save.bankedStars;
  },

  /** Single write: bank stars + medals + stage clear (avoids stale save clobber). */
  completeStageRun({ toBank, stageId, score, difficulty, medals }) {
    const save = this.load();
    save.bankedStars += Math.max(0, Math.floor(Number(toBank) || 0));

    const key = String(stageId);
    save.stageMedals = save.stageMedals || {};
    save.stageMedals[key] = save.stageMedals[key] || {};
    const prevMedals = new Set(save.stageMedals[key][difficulty] || []);
    (medals || []).forEach((id) => prevMedals.add(id));
    save.stageMedals[key][difficulty] = [...prevMedals];

    const prevScore = save.stageClears[key]?.score || 0;
    save.stageClears[key] = {
      score: Math.max(prevScore, score),
      difficulty,
      at: Date.now(),
    };
    if (!save.unlockedStages.includes(stageId + 1)) {
      save.unlockedStages.push(stageId + 1);
    }
    if (score > save.highScore) save.highScore = score;

    this.write(save);
    return save.bankedStars;
  },

  spendStars(amount) {
    const save = this.load();
    if (save.bankedStars < amount) return false;
    save.bankedStars -= amount;
    this.write(save);
    return true;
  },

  getStageMedals(stageId, difficulty = 'normal') {
    const save = this.load();
    const key = String(stageId);
    return save.stageMedals?.[key]?.[difficulty] || [];
  },

  hasAllMedals(stageId, difficulty) {
    const earned = this.getStageMedals(stageId, difficulty);
    return MEDAL_IDS.every((id) => earned.includes(id));
  },

  unlockedDifficulties(stageId) {
    const list = ['normal'];
    if (this.hasAllMedals(stageId, 'normal')) list.push('hard');
    if (this.hasAllMedals(stageId, 'hard')) list.push('insane');
    if (this.hasAllMedals(stageId, 'insane')) list.push('nightmare');
    return list;
  },

  isDifficultyUnlocked(stageId, difficulty) {
    return this.unlockedDifficulties(stageId).includes(difficulty);
  },

  recordStageMedals(stageId, difficulty, medalIds) {
    const save = this.load();
    const key = String(stageId);
    save.stageMedals = save.stageMedals || {};
    save.stageMedals[key] = save.stageMedals[key] || {};
    const prev = new Set(save.stageMedals[key][difficulty] || []);
    medalIds.forEach((id) => prev.add(id));
    save.stageMedals[key][difficulty] = [...prev];
    this.write(save);
    return save.stageMedals[key][difficulty];
  },

  recordStageClear(stageId, score, difficulty = 'normal') {
    const save = this.load();
    const key = String(stageId);
    const prev = save.stageClears[key]?.score || 0;
    save.stageClears[key] = {
      score: Math.max(prev, score),
      difficulty,
      at: Date.now(),
    };
    if (!save.unlockedStages.includes(stageId + 1)) {
      save.unlockedStages.push(stageId + 1);
    }
    if (score > save.highScore) save.highScore = score;
    this.write(save);
    return save;
  },

  isStageUnlocked(stageId) {
    return this.load().unlockedStages.includes(stageId);
  },

  getHangarLevels() {
    return { ...(this.load().hangar || {}) };
  },
};
