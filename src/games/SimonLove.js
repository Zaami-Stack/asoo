/* =============================================================
   LOVE OS XP - Arcade game 4: Asoo Says
   Asoo taps a sequence of hearts. You repeat it. She adds one
   every round. Survive 8 rounds and she is properly impressed.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.SimonLove = class SimonLove {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.stateData = game.state.data;

    this.PADS = ['pink', 'red', 'purple', 'gold'];
    this.TONES = [392, 494, 587, 784];
    this.WIN_ROUNDS = 8;
    this.seq = [];
    this.playerIdx = 0;
    this.busy = false;
    this.completed = 0;
    this.over = false;
    this.timers = [];

    this.build();
    this.bind();
  }

  build() {
    var win = this.win;

    var hud = LOVE.util.el('div', { class: 'hud' });
    this.elems = {};
    this.elems.round = LOVE.util.el('span', {}, 'ROUND 1');
    this.elems.turn = LOVE.util.el('span', {}, 'Press a love note');
    hud.appendChild(this.elems.round);
    hud.appendChild(this.elems.turn);
    win.body.appendChild(hud);

    var area = LOVE.util.el('div', { class: 'play-area' });
    this.area = area;

    var pad = LOVE.util.el('div', { class: 'simon-pad' });
    var self = this;
    this.pads = [];
    for (var i = 0; i < 4; i++) {
      (function (idx) {
        var btn = LOVE.util.el('button', { class: 'simon-cell s-' + self.PADS[idx], 'aria-label': 'heart pad ' + (idx + 1) });
        btn.appendChild(document.createElement('span')).textContent = '💗';
        btn.addEventListener('click', function () { self.tap(idx); });
        pad.appendChild(btn);
        self.pads.push(btn);
      })(i);
    }
    area.appendChild(pad);

    var msgEl = LOVE.util.el('div', { class: 'game-msg', style: 'display:none;' });
    this.msgEl = msgEl;
    area.appendChild(msgEl);
    win.body.appendChild(area);
    this.showStart();
  }

  /* first thing shown - a start prompt so she never taps mid-song */
  showStart() {
    var self = this;
    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';
    box.appendChild(LOVE.util.el('div', { class: 'big' }, '🎶 ASOO SAYS'));
    box.appendChild(LOVE.util.el('div', {}, 'Asoo taps a pattern of hearts.'));
    box.appendChild(LOVE.util.el('div', {}, 'You repeat it. She adds one every round.'));
    box.appendChild(LOVE.util.el('div', {}, 'Survive 8 rounds and she is impressed.'));
    var go = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Start');
    go.addEventListener('click', function () { self.start(); });
    box.appendChild(go);
  }

  bind() {
    var self = this;
    var win = this.win;
    var origClose = win.onClose;
    win.onClose = function () {
      self.destroy();
      if (origClose) origClose();
    };
  }

  destroy() {
    this.destroyed = true;
    this.timers.forEach(function (t) { clearTimeout(t); });
    this.timers = [];
  }

  after(fn, ms) {
    var t = setTimeout(fn, ms);
    this.timers.push(t);
    return t;
  }

  flash(idx) {
    var btn = this.pads[idx];
    btn.classList.add('lit');
    this.game.audio.tone(this.TONES[idx], 0.16, { gain: 0.2 });
    this.after(function () { btn.classList.remove('lit'); }, 380);
  }

  start() {
    var self = this;
    // cancel anything still scheduled from a previous round
    this.timers.forEach(function (t) { clearTimeout(t); });
    this.timers = [];
    this.game.audio.click();
    this.seq = [];
    this.completed = 0;
    this.busy = false;
    this.over = false;
    this.msgEl.style.display = 'none';
    this.elems.round.textContent = 'ROUND 1';
    this.elems.turn.textContent = 'Asoo is about to speak...';
    this.after(function () { self.nextRound(); }, 500);
  }

  nextRound() {
    this.seq.push(Math.floor(Math.random() * 4));
    this.elems.round.textContent = 'ROUND ' + this.seq.length;
    this.playSeq();
  }

  playSeq() {
    var self = this;
    this.busy = true;
    this.elems.turn.textContent = 'watch the hearts...';
    for (var i = 0; i < this.seq.length; i++) {
      this.after(function (idx) {
        if (self.over) return;
        self.flash(self.seq[idx]);
      }.bind(null, i), 320 + i * 560);
    }
    this.after(function () {
      if (self.over) return;
      self.busy = false;
      self.playerIdx = 0;
      self.elems.turn.textContent = 'your turn!';
    }, 320 + (this.seq.length) * 560);
  }

  tap(idx) {
    if (this.over || this.busy) return;
    this.flash(idx);
    if (idx !== this.seq[this.playerIdx]) {
      this.lose();
      return;
    }
    this.playerIdx += 1;
    if (this.playerIdx >= this.seq.length) {
      var self = this;
      this.completed = this.seq.length;
      var best = this.stateData.arcadeWins.simon || 0;
      if (this.completed > best) {
        this.stateData.arcadeWins.simon = this.completed;
        this.game.save();
      }
      if (this.completed >= this.WIN_ROUNDS) {
        this.winGame();
        return;
      }
      this.busy = true;
      this.elems.turn.textContent = 'good. adding one more...';
      this.after(function () { self.nextRound(); }, 700);
    }
  }

  lose() {
    this.over = true;
    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';
    this.game.audio.error();
    this.elems.turn.textContent = 'round ' + (this.completed + 1);

    var self = this;
    box.appendChild(LOVE.util.el('div', { class: 'big' }, '😵 MISHEARD'));
    box.appendChild(LOVE.util.el('div', {}, 'Asoo said a different heart than the one you tapped. She is not mad. She is just... disappointed (she is not).'));
    box.appendChild(LOVE.util.el('div', {}, 'you survived ' + this.completed + ' round' + (this.completed === 1 ? '' : 's')));

    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;width:100%;justify-content:center;' });
    var again = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Again');
    var back = LOVE.util.el('button', { class: 'xp-btn' }, 'Back');
    row.appendChild(again);
    row.appendChild(back);
    box.appendChild(row);

    again.addEventListener('click', function () { self.start(); });
    back.addEventListener('click', function () { self.game.audio.click(); self.win.close(); });
  }

  winGame() {
    this.over = true;
    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';
    this.game.audio.win();
    this.elems.turn.textContent = 'in sync';

    var self = this;
    box.appendChild(LOVE.util.el('div', { class: 'big' }, '💞 IN SYNC 💞'));
    box.appendChild(LOVE.util.el('div', {}, '8 rounds. Asoo\u0027s heart sequence is fully memorized.'));
    box.appendChild(LOVE.util.el('div', {}, 'She smiles. That is the high score that matters.'));

    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;width:100%;justify-content:center;' });
    var again = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Again');
    var back = LOVE.util.el('button', { class: 'xp-btn' }, 'Back');
    row.appendChild(again);
    row.appendChild(back);
    box.appendChild(row);

    again.addEventListener('click', function () { self.start(); });
    back.addEventListener('click', function () { self.game.audio.click(); self.win.close(); });
  }
};

/* =============================================================
   EOF SimonLove.js
   ============================================================= */