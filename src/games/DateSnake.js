/* =============================================================
   LOVE OS XP - Arcade game 2: Heart Snake
   Eat hearts, grow a little. Like feelings, basically.
   Wrap around the walls (hugs!) and reach 12 hearts to win.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.DateSnake = class DateSnake {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.stateData = game.state.data;

    this.CELL = 20;
    this.COLS = 24;
    this.ROWS = 16;
    this.W = this.CELL * this.COLS;   // 480
    this.H = this.CELL * this.ROWS;   // 320
    this.WIN_HEARTS = 12;

    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = null;
    this.food = null;
    this.eaten = 0;
    this.stepMs = 160;
    this.acc = 0;
    this.over = false;
    this.won = false;
    this.lastTs = 0;

    this.startSnake();

    this.build();
    this.bind();
    this.loopId = requestAnimationFrame(this.tick.bind(this));
  }

  startSnake() {
    var cx = Math.floor(this.COLS / 2);
    var cy = Math.floor(this.ROWS / 2);
    this.snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    this.dir = { x: 1, y: 0 };
    this.nextDir = null;
    this.eaten = 0;
    this.stepMs = 160;
    this.acc = 0;
    this.spawnFood();
  }

  inSnake(x, y) {
    var i;
    for (i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === x && this.snake[i].y === y) return true;
    }
    return false;
  }

  spawnFood() {
    var free = [];
    var x, y;
    for (y = 0; y < this.ROWS; y++) {
      for (x = 0; x < this.COLS; x++) {
        if (!this.inSnake(x, y)) free.push({ x: x, y: y });
      }
    }
    if (free.length) this.food = LOVE.util.pick(free);
  }

  turn() {
    var d = this.nextDir;
    if (!d) return;
    if (d.x !== -this.dir.x || d.y !== -this.dir.y) {
      this.dir = d;
    }
    this.nextDir = null;
  }

  step() {
    this.turn();
    var head = this.snake[0];
    var nx = head.x + this.dir.x;
    var ny = head.y + this.dir.y;
    // wrap around - hugs, not walls
    nx = (nx + this.COLS) % this.COLS;
    ny = (ny + this.ROWS) % this.ROWS;

    // self collision
    var i;
    for (i = 0; i < this.snake.length - 1; i++) {
      if (this.snake[i].x === nx && this.snake[i].y === ny) {
        this.endGame(false);
        return;
      }
    }

    this.snake.unshift({ x: nx, y: ny });
    var ate = this.food && this.food.x === nx && this.food.y === ny;
    if (ate) {
      this.game.audio.catchHeart();
      this.eaten += 1;
      if (this.eaten >= this.WIN_HEARTS) {
        this.endGame(true);
        return;
      }
      this.spawnFood();
      this.stepMs = Math.max(90, this.stepMs - 6);
    } else {
      this.snake.pop();
    }
    this.elems.score.textContent = 'HEARTS EATEN: ' + this.eaten + ' (win at ' + this.WIN_HEARTS + ')';
  }

  build() {
    var win = this.win;
    var hud = LOVE.util.el('div', { class: 'hud' });
    this.elems = {};
    this.elems.score = LOVE.util.el('span', {}, 'HEARTS EATEN: 0 (win at ' + this.WIN_HEARTS + ')');
    hud.appendChild(this.elems.score);
    win.body.appendChild(hud);

    var canvas = LOVE.util.el('canvas', {
      class: 'game-pad',
      width: this.W,
      height: this.H
    });
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    win.body.appendChild(canvas);

    this.msgEl = LOVE.util.el('div', { class: 'game-msg', style: 'display:none;' });
    this.msgEl.style.width = this.W + 'px';
    this.msgEl.style.height = this.H + 'px';
    win.body.appendChild(this.msgEl);
  }

  bind() {
    var self = this;
    this.onKeyDown = function (e) {
      var k = e.key && e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].indexOf(k) !== -1) e.preventDefault();
      var d = null;
      if (k === 'arrowup' || k === 'w') d = { x: 0, y: -1 };
      if (k === 'arrowdown' || k === 's') d = { x: 0, y: 1 };
      if (k === 'arrowleft' || k === 'a') d = { x: -1, y: 0 };
      if (k === 'arrowright' || k === 'd') d = { x: 1, y: 0 };
      if (d) self.nextDir = d;
    };
    document.addEventListener('keydown', this.onKeyDown);

    var win = this.win;
    var origClose = win.onClose;
    win.onClose = function () {
      self.destroy();
      if (origClose) origClose();
    };
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.loopId);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  restart() {
    this.game.audio.click();
    this.over = false;
    this.won = false;
    this.startSnake();
    this.elems.score.textContent = 'HEARTS EATEN: 0 (win at ' + this.WIN_HEARTS + ')';
    this.msgEl.style.display = 'none';
  }

  endGame(wonFlag) {
    if (this.over) return;
    this.over = true;
    this.won = wonFlag;
    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';

    var audio = this.game.audio;
    var self = this;
    if (wonFlag) {
      audio.win();
      this.stateData.arcadeWins.snake = (this.stateData.arcadeWins.snake || 0) + 1;
      this.game.save();
      box.appendChild(LOVE.util.el('div', { class: 'big' }, '💖 GROWN 💖'));
      box.appendChild(LOVE.util.el('div', {}, 'The snake ate ' + this.WIN_HEARTS + ' hearts and is now as full as a heart can be.'));
      box.appendChild(LOVE.util.el('div', {}, mood()));
    } else {
      audio.error();
      box.appendChild(LOVE.util.el('div', { class: 'big' }, '👟 OOPS.'));
      box.appendChild(LOVE.util.el('div', {}, 'The snake tangled itself like my cursor does when I look at you. Try again?'));
    }

    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;width:100%;justify-content:center;' });
    var again = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Again');
    var back = LOVE.util.el('button', { class: 'xp-btn' }, 'Back');
    row.appendChild(again);
    row.appendChild(back);
    box.appendChild(row);
    box.appendChild(LOVE.util.el('div', { class: 'dim' }, 'controls: arrows or WASD'));

    again.addEventListener('click', function () { self.restart(); });
    back.addEventListener('click', function () { self.game.audio.click(); self.win.close(); });

    function mood() {
      var msgs = ['Asoo approved.', 'Certified snack.', 'You did that. She noticed.'];
      return LOVE.util.pick(msgs);
    }
  }

  render() {
    var ctx = this.ctx;
    var W = this.W, H = this.H;
    var c = this.CELL;

    ctx.fillStyle = '#10302b';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    var x, y;
    for (x = 0; x <= this.COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * c, 0); ctx.lineTo(x * c, H); ctx.stroke();
    }
    for (y = 0; y <= this.ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * c); ctx.lineTo(W, y * c); ctx.stroke();
    }

    if (this.food) {
      LOVE.util.pixelHeart(ctx, this.food.x * c + c / 2, this.food.y * c + c / 2, 0.8, '#ff4d7e');
    }

    var i;
    for (i = this.snake.length - 1; i >= 0; i--) {
      var s = this.snake[i];
      ctx.fillStyle = i === 0 ? '#ffd166' : '#3ddad7';
      if (i === 0) {
        LOVE.util.pixelHeart(ctx, s.x * c + c / 2, s.y * c + c / 2, 0.9, '#ffd166');
      } else {
        ctx.beginPath();
        ctx.arc(s.x * c + c / 2, s.y * c + c / 2, c / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  tick(ts) {
    var dt = this.lastTs ? Math.min((ts - this.lastTs) / 1000, 0.05) : 0.016;
    this.lastTs = ts;
    if (!this.over) {
      this.acc += dt * 1000;
      while (this.acc >= this.stepMs) {
        this.acc -= this.stepMs;
        this.step();
        if (this.over) break;
      }
    }
    this.render();
    if (!this.destroyed) {
      this.loopId = requestAnimationFrame(this.tick.bind(this));
    }
  }
};

/* =============================================================
   EOF DateSnake.js
   ============================================================= */