/* =============================================================
   LOVE OS XP - central game state
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.PIECE = { HEARTS: 0, MEMORY: 1, QUIZ: 2, SECRET: 3, FINAL: 4 };

LOVE.GameState = class GameState {
  constructor(raw) {
    this.data = this.defaults();
    if (raw) this.merge(raw);
    this.updateUnlocks();
  }

  defaults() {
    return {
      v: 1,
      started: false,                // intro completed
      heartGameCompleted: false,
      heartCatchTotal: 0,
      memoryGameCompleted: false,
      quizCompleted: false,
      quizCorrectTotal: 0,
      secretUnlocked: false,
      secretLetterRead: false,
      memoriesViewed: [],           // file names of viewed memories
      finalCompleted: false,
      ended: false,
      pieces: [false, false, false, false, false],
      score: 0,
      arcadeWins: {}           // { pong, snake, whack, simon } - arcade fun wins
    };
  }

  /* merge saved data on top of defaults, ignoring unknowns */
  merge(raw) {
    var clean = this.defaults();
    var i, key;
    for (key in clean) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) clean[key] = raw[key];
    }
    if (Array.isArray(clean.pieces) && clean.pieces.length === 5) {
      clean.pieces = clean.pieces.map(Boolean);
    } else {
      clean.pieces = [false, false, false, false, false];
    }
    if (!Array.isArray(clean.memoriesViewed)) clean.memoriesViewed = [];
    if (typeof clean.heartCatchTotal !== 'number') clean.heartCatchTotal = 0;
    if (typeof clean.quizCorrectTotal !== 'number') clean.quizCorrectTotal = 0;
    if (typeof clean.score !== 'number') clean.score = 0;
    if (!clean.arcadeWins || typeof clean.arcadeWins !== 'object' || Array.isArray(clean.arcadeWins)) clean.arcadeWins = {};
    this.data = clean;
  }

  /* derive unlocked / completed states from raw progress */
  updateUnlocks() {
    var d = this.data;
    if (d.heartCatchTotal >= LOVE.config.heartsTarget) d.heartGameCompleted = true;
    d.secretUnlocked = !!(d.heartGameCompleted && d.memoryGameCompleted && d.quizCompleted);
    d.finalCompleted = d.pieces.every(Boolean);
  }

  /* the piece index earned by completing an activity */
  activityPiece(activity) {
    if (activity === 'hearts') return LOVE.PIECE.HEARTS;
    if (activity === 'memory') return LOVE.PIECE.MEMORY;
    if (activity === 'quiz') return LOVE.PIECE.QUIZ;
    if (activity === 'secret') return LOVE.PIECE.SECRET;
    if (activity === 'final') return LOVE.PIECE.FINAL;
    return -1;
  }

  hasPiece(activity) {
    var i = this.activityPiece(activity);
    return i >= 0 && !!this.data.pieces[i];
  }

  grantPiece(activity) {
    var i = this.activityPiece(activity);
    var d = this.data;
    if (i >= 0 && !d.pieces[i]) {
      d.pieces[i] = true;
      d.score += 100;
    }
    this.updateUnlocks();
  }

  /* unlock gates between mini-games */
  isMemoryUnlocked() { return this.data.heartGameCompleted; }
  isQuizUnlocked() { return this.data.memoryGameCompleted; }
  isFinalUnlocked() { return this.data.secretUnlocked && this.data.secretLetterRead; }

  /* does this memory file still need to be seen (for the explorer) */
  memoryViewed(file) { return this.data.memoriesViewed.indexOf(file) !== -1; }

  markMemoryViewed(file) {
    if (this.memoryViewed(file)) return false;
    this.data.memoriesViewed.push(file);
    return true;
  }
};

/* =============================================================
   EOF GameState.js
   ============================================================= */