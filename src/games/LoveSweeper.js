/* =============================================================
   LOVE OS XP - Arcade game 5: Heartfield (minesweeper but soft)
   A 10x10 field hides 12 broken hearts. Clear every safe tile to
   win. Right-click (or the flag toggle) plants a flower so she
   never steps on a heart. First click is always safe.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.LoveSweeper = class LoveSweeper {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.stateData = game.state.data;

    this.N = 10;
    this.MINES = 12;
    this.cells = [];
    this.mineSet = {};
    this.flags = 0;
    this.revealed = 0;
    this.firstClick = true;
    this.over = false;
    this.won = false;
    this.flagMode = false;
    this.flagToggleBtn = null;
    this.msgShown = null;

    this.build();
    this.bind();
    this.newGame();

    var self = this;
    this.timerId = setInterval(function () {
      if (!self.over) {
        self.seconds += 1;
        self.timerEl.textContent = '⏱ ' + self.seconds + 's';
      }
    }, 1000);
  }

  build() {
    var win = this.win;
    var self = this;

    var hud = LOVE.util.el('div', { class: 'hud' });
    this.hudEl = hud;

    this.minesEl = LOVE.util.el('span', {}, '💔 ' + this.MINES);
    this.flagToggleBtn = LOVE.util.el('button', { class: 'xp-btn flag-btn' }, '🚩 Mode: off');
    this.flagToggleBtn.addEventListener('click', function () {
      self.flagMode = !self.flagMode;
      self.flagToggleBtn.textContent = '🚩 Mode: ' + (self.flagMode ? 'on' : 'off');
      self.game.audio.click();
    });
    this.timerEl = LOVE.util.el('span', {}, '⏱ 0s');
    var retryBtn = LOVE.util.el('button', { class: 'xp-btn' }, '↻ New field');

    hud.appendChild(this.minesEl);
    hud.appendChild(this.flagToggleBtn);
    hud.appendChild(LOVE.util.el('span', { class: 'hint' }, 'two rows, 12 broken hearts'));
    hud.appendChild(this.timerEl);
    hud.appendChild(retryBtn);
    win.body.appendChild(hud);
    // upright hint line
    var hint = LOVE.util.el('div', { class: 'dim', style: 'margin:2px 0 6px;' },
      'tip: numbers tell how many broken hearts are nearby. Right-click / flag mode plants a flower.');
    win.body.appendChild(hint);

    this.grid = LOVE.util.el('div', { class: 'sw-grid' });
    win.body.appendChild(this.grid);

    this.msgEl = LOVE.util.el('div', { class: 'game-msg', style: 'display:none;' });
    this.msgEl.style.width = '440px';
    this.msgEl.style.height = '380px';
    win.body.appendChild(this.msgEl);

    retryBtn.addEventListener('click', function () { self.game.audio.click(); self.newGame(); });
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
    clearInterval(this.timerId);
  }

  newGame() {
    this.cells = [];
    this.mineSet = {};
    this.flags = 0;
    this.revealed = 0;
    this.firstClick = true;
    this.over = false;
    this.won = false;
    this.seconds = 0;
    this.timerEl.textContent = '⏱ 0s';
    this.minesEl.textContent = '💔 ' + this.MINES;
    this.msgEl.style.display = 'none';

    var self = this;
    this.grid.innerHTML = '';
    var coords = [];
    for (var y = 0; y < this.N; y++) {
      for (var x = 0; x < this.N; x++) coords.push({ x: x, y: y });
    }
    coords.forEach(function (c) {
      var btn = LOVE.util.el('button', { class: 'sw-cell' });
      var cc = { x: c.x, y: c.y, mines: 0, state: 'hidden', el: btn };
      btn.addEventListener('click', function () { self.open(cc.x, cc.y, true); });
      btn.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        self.flag(cc);
      });
      self.grid.appendChild(btn);
      self.cells.push(cc);
    });
    this.game.audio.click();
  }

  cellAt(x, y) {
    if (x < 0 || y < 0 || x >= this.N || y >= this.N) return null;
    return this.cells[y * this.N + x];
  }

  neighbors(cell) {
    var out = [];
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        var c = this.cellAt(cell.x + dx, cell.y + dy);
        if (c) out.push(c);
      }
    }
    return out;
  }

  placeMines(safeCell) {
    var n = this.N;
    var count = 0;
    var tries = 0;
    var self = this;
    while (count < this.MINES && tries < 5000) {
      tries++;
      var x = Math.floor(LOVE.util.random(0, n));
      var y = Math.floor(LOVE.util.random(0, n));
      if (x === safeCell.x && y === safeCell.y) continue;
      var key = x + ',' + y;
      if (this.mineSet[key]) continue;
      this.mineSet[key] = true;
      count++;
    }
    this.cells.forEach(function (c) {
      c.mines = self.neighbors(c).filter(function (nb) {
        return self.mineSet[nb.x + ',' + nb.y];
      }).length;
    });
  }

  flag(cell) {
    if (this.over) return;
    if (cell.state === 'hidden') {
      cell.state = 'flagged';
      this.flags++;
      cell.el.textContent = '🌸';
      cell.el.classList.add('flagged');
    } else if (cell.state === 'flagged') {
      cell.state = 'hidden';
      this.flags--;
      cell.el.textContent = '';
      cell.el.classList.remove('flagged');
    }
    this.minesEl.textContent = '💔 ' + Math.max(0, this.MINES - this.flags);
    this.game.audio.flip();
  }

  open(x, y, fromClick) {
    var cell = this.cellAt(x, y);
    if (!cell || this.over) return;
    if (cell.state === 'flagged') return;
    if (cell.state !== 'hidden') return;

    if (fromClick && this.firstClick) {
      this.firstClick = false;
      this.placeMines(cell);
    }

    this.reveal(cell);
  }

  reveal(cell) {
    if (cell.state !== 'hidden') return;
    cell.state = 'opened';
    this.revealed++;
    cell.el.classList.add('opened');

    if (this.mineSet[cell.x + ',' + cell.y]) {
      this.lose(cell);
      return;
    }

    if (cell.mines > 0) {
      cell.el.textContent = cell.mines;
      cell.el.classList.add('n' + cell.mines);
      this.game.audio.flip();
    } else {
      cell.el.textContent = '';
      cell.el.classList.add('empty');
      var self = this;
      this.neighbors(cell).forEach(function (nb) {
        if (nb.state === 'hidden') self.open(nb.x, nb.y, false);
      });
    }

    if (!this.over && this.revealed >= this.N * this.N - this.MINES) {
      this.winGame();
    }
  }

  lose(cell) {
    this.over = true;
    this.game.audio.error();
    var self = this;
    Object.keys(this.mineSet).forEach(function (key) {
      var parts = key.split(',');
      var c = self.cellAt(Number(parts[0]), Number(parts[1]));
      if (c) {
        c.state = 'visible';
        c.el.textContent = '💔';
        c.el.classList.add('lost');
      }
    });
    cell.el.classList.add('boom');
    this.showMsg('💔 Oops!');
  }

  winGame() {
    this.over = true;
    this.won = true;
    this.game.audio.win();
    this.stateData.arcadeWins.sweeper = (this.stateData.arcadeWins.sweeper || 0) + 1;
    this.game.save();
    this.showMsg('🏆 SWEPT ALL HEARTS 🏆');
  }

  showMsg(titleText) {
    var self = this;
    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';
    box.appendChild(LOVE.util.el('div', { class: 'big' }, titleText));
    box.appendChild(LOVE.util.el('div', { style: 'margin:4px 0 8px;width:100%;text-align:center;' },
      this.won ? 'Every broken heart avoided. Asoo is impressed by both your luck and your heart.'
               : 'Her heart is a little bruised, but flowers grow back. Try again with the field right here.'));
    box.appendChild(LOVE.util.el('div', {}, 'time: ' + this.seconds + 's  ·  hearts left: ' + Math.max(0, this.MINES - this.flags)));

    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;width:100%;justify-content:center;' });
    var retry = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Try again');
    var back = LOVE.util.el('button', { class: 'xp-btn' }, 'Close');
    row.appendChild(retry);
    row.appendChild(back);
    box.appendChild(row);

    retry.addEventListener('click', function () { self.game.audio.click(); self.newGame(); });
    back.addEventListener('click', function () { self.game.audio.click(); self.win.close(); });
  }
};

/* =============================================================
   EOF LoveSweeper.js
   ============================================================= */