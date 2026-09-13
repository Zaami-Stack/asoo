/* =============================================================
   LOVE OS XP - Arcade game 3: Whack-a-Love
   Hearts pop up. Whack them. Sad little clouds pop up too -
   do not whack those. 30 seconds, Asoo watching.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.WhackLove = class WhackLove {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.stateData = game.state.data;

    this.TIME = 30;
    this.WIN_SCORE = 15;
    this.score = 0;
    this.timeLeft = this.TIME;
    this.started = false;
    this.over = false;
    this.popTimer = null;
    this.countdownTimer = null;
    this.cellTimers = [];
    this.cells = [];

    this.build();
    this.bind();
  }

  build() {
    var win = this.win;

    var hud = LOVE.util.el('div', { class: 'hud' });
    this.elems = {};
    this.elems.score = LOVE.util.el('span', {}, 'SCORE: 0');
    this.elems.time = LOVE.util.el('span', {}, '⏱ ' + this.TIME + 's');
    hud.appendChild(this.elems.score);
    hud.appendChild(this.elems.time);
    win.body.appendChild(hud);

    var area = LOVE.util.el('div', { class: 'play-area' });
    this.area = area;

    var grid = LOVE.util.el('div', { class: 'whack-grid' });
    var self = this;
    for (var i = 0; i < 9; i++) {
      (function (idx) {
        var cell = LOVE.util.el('button', { class: 'whack-cell', 'aria-label': 'whack hole ' + (idx + 1) });
        cell.addEventListener('click', function () { self.hit(idx); });
        grid.appendChild(cell);
        self.cells.push(cell);
      })(i);
    }
    area.appendChild(grid);

    // overlay layer (fits the play area)
    var msgEl = LOVE.util.el('div', { class: 'game-msg', style: 'display:none;' });
    this.msgEl = msgEl;
    area.appendChild(msgEl);
    win.body.appendChild(area);
    this.showStart();
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
    if (this.popTimer) clearTimeout(this.popTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.cellTimers.forEach(function (t) { clearTimeout(t); });
    this.cellTimers = [];
  }

  start() {
    var self = this;
    // clear leftovers from any previous run
    if (this.popTimer) clearTimeout(this.popTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.cellTimers.forEach(function (t) { clearTimeout(t); });
    this.cellTimers = [];
    this.cells.forEach(function (c) {
      c.classList.remove('up');
      c.classList.remove('good');
      c.classList.remove('bad');
      c.textContent = '';
    });

    this.started = true;
    this.over = false;
    this.score = 0;
    this.timeLeft = this.TIME;
    this.elems.score.textContent = 'SCORE: 0';
    this.updateTime();
    this.msgEl.style.display = 'none';
    this.game.audio.click();

    this.countdownTimer = setInterval(function () {
      self.timeLeft -= 1;
      self.updateTime();
      if (self.timeLeft <= 0) self.endGame();
    }, 1000);

    this.pop();
  }

  /* first thing shown - a start prompt instead of playing immediately */
  showStart() {
    var self = this;
    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';
    box.appendChild(LOVE.util.el('div', { class: 'big' }, '🔨 WHACK-A-LOVE'));
    box.appendChild(LOVE.util.el('div', {}, 'Hearts pop up. Whack them!'));
    box.appendChild(LOVE.util.el('div', {}, 'Clouds pop up too. Do not whack those.'));
    box.appendChild(LOVE.util.el('div', {}, '30 seconds. Asoo is watching.'));
    var go = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Start');
    go.addEventListener('click', function () { self.start(); });
    box.appendChild(go);
  }

  updateTime() {
    this.elems.time.textContent = '⏱ ' + Math.max(0, this.timeLeft) + 's';
  }

  /* pick a free hole and pop something out of it */
  pop() {
    var self = this;
    if (this.over || !this.started) return;

    var free = [];
    this.cells.forEach(function (c, i) {
      if (!c.classList.contains('up')) free.push(i);
    });
    if (free.length) {
      var idx = LOVE.util.pick(free);
      var heart = Math.random() < 0.82;
      var cell = this.cells[idx];
      cell.classList.add('up');
      cell.textContent = heart ? '💗' : '☁️';
      cell.classList.toggle('bad', !heart);
      cell.classList.toggle('good', heart);
      var hide = setTimeout(function () {
        cell.classList.remove('up');
        cell.textContent = '';
      }, 600);
      this.cellTimers.push(hide);
    }

    // get busier as the clock runs out
    var delay = 300 + Math.random() * 500 + this.timeLeft * 25;
    this.popTimer = setTimeout(function () { self.pop(); }, delay);
  }

  hit(idx) {
    var cell = this.cells[idx];
    if (!this.started || this.over) return;
    if (!cell.classList.contains('up')) {
      this.game.audio.hover();
      return;
    }
    if (cell.classList.contains('good')) {
      this.score += 1;
      this.elems.score.textContent = 'SCORE: ' + this.score;
      this.game.audio.catchHeart();
    } else {
      this.score = Math.max(0, this.score - 1);
      this.elems.score.textContent = 'SCORE: ' + this.score;
      this.game.audio.brokenHeart();
      this.win.shake();
    }
    cell.classList.remove('up');
    cell.textContent = '';
  }

  endGame() {
    this.over = true;
    if (this.popTimer) clearTimeout(this.popTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';

    var audio = this.game.audio;
    var self = this;
    var msg;
    if (this.score >= this.WIN_SCORE) {
      audio.win();
      this.stateData.arcadeWins.whack = (this.stateData.arcadeWins.whack || 0) + 1;
      this.game.save();
      box.appendChild(LOVE.util.el('div', { class: 'big' }, '🔨 CERTIFIED 🔨'));
      msg = 'Whack Level: Heart-Whacker. Asoo is impressed but slightly worried about the clouds.';
    } else if (this.score >= 10) {
      audio.success();
      box.appendChild(LOVE.util.el('div', { class: 'big' }, '💪 NOT BAD'));
      msg = 'Your aim is decent. Those clouds got away with a few cheeky escapes.';
    } else {
      audio.error();
      box.appendChild(LOVE.util.el('div', { class: 'big' }, '☁️ WHOOPS'));
      msg = 'You spent more time admiring the hearts than whacking them. Adorable. Try again?';
    }
    box.appendChild(LOVE.util.el('div', {}, 'final score: ' + this.score + (this.score >= this.WIN_SCORE ? ' / must love ' + this.WIN_SCORE : '')));

    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;width:100%;justify-content:center;' });
    var again = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Again');
    var back = LOVE.util.el('button', { class: 'xp-btn' }, 'Back');
    row.appendChild(again);
    row.appendChild(back);
    box.appendChild(row);
    box.appendChild(LOVE.util.el('div', { class: 'dim' }, msg));

    again.addEventListener('click', function () { self.start(); });
    back.addEventListener('click', function () { self.game.audio.click(); self.win.close(); });
  }
};

/* =============================================================
   EOF WhackLove.js
   ============================================================= */