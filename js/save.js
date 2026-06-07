const SKY_FORCE_SAVE_KEY = 'sky-force-reloaded-v1';

const SkyForceSave = {
  _default() {
    return {
      bankedStars: 0,
      unlockedStages: [1],
      highScore: 0,
      stageClears: {},
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(SKY_FORCE_SAVE_KEY);
      if (!raw) return this._default();
      return { ...this._default(), ...JSON.parse(raw) };
    } catch {
      return this._default();
    }
  },

  write(data) {
    localStorage.setItem(SKY_FORCE_SAVE_KEY, JSON.stringify(data));
  },

  bankRunStars(amount) {
    const save = this.load();
    save.bankedStars += Math.max(0, amount);
    this.write(save);
    return save.bankedStars;
  },

  recordStageClear(stageId, score) {
    const save = this.load();
    const prev = save.stageClears[stageId] || 0;
    save.stageClears[stageId] = Math.max(prev, score);
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

  getBankedStars() {
    return this.load().bankedStars;
  },
};
