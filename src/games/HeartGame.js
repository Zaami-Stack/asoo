/* =============================================================
   LOVE OS XP - Mini-game 1: Catch the Hearts
   Move left/right, catch hearts, dodge broken ones.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.HeartGame = class HeartGame {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.stateData = game.state.data;

    this.W = 480;
    this.H = 320;
    this.score = 0;
    this.lives = 3;
    this.over = false;
    this.won = false;
    this.keys = {};
    this.playerX = this.W / 2;
    this.playerY = this.H - 42;
    this.targetX = null;
    this.spawnTimer = 0.4;
    this.hearts = [];
    this.lastTs = 0;
    this.pointerActive = false;

    this.build();
    this.bind();
    this.loopId = requestAnimationFrame(this.tick.bind(this));
  }

  build() {
    var win = this.win;

    var hud = LOVE.util.el('div', { class: 'hud' });
    this.elems = {};
    this.elems.target = LOVE.util.el('span', {}, 'HEARTS: 0 / 15');
    hud.appendChild(this.elems.target);
    this.elems.lives = LOVE.util.el('span', { class: 'lives' }, '❤️❤️❤️');
    hud.appendChild(this.elems.lives);
    win.body.appendChild(hud);

    var canvas = LOVE.util.el('canvas', {
      class: 'game-pad',
      width: this.W,
      height: this.H
    });
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    win.body.appendChild(canvas);

    // overlay message layer (shown on win / game over)
    this.msgEl = LOVE.util.el('div', { class: 'game-msg', style: 'display:none;' });
    this.msgEl.style.width = this.W + 'px';
    this.msgEl.style.height = this.H + 'px';
    win.body.appendChild(this.msgEl);
  }

  bind() {
    var self = this;

    this.onKeyDown = function (e) {
      var k = e.key && e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'a', 'd'].indexOf(k) !== -1) e.preventDefault();
      if (k === 'arrowleft') self.keys.left = true;
      if (k === 'arrowright') self.keys.right = true;
      if (k === 'a') self.keys.a = true;
      if (k === 'd') self.keys.d = true;
    };
    this.onKeyUp = function (e) {
      var k = e.key && e.key.toLowerCase();
      if (k === 'arrowleft') self.keys.left = false;
      if (k === 'arrowright') self.keys.right = false;
      if (k === 'a') self.keys.a = false;
      if (k === 'd') self.keys.d = false;
    };

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    // pointer drives the basket (mouse move / touch drag)
    this.onPointer = function (e) {
      if (self.over) return;
      var rect = self.canvas.getBoundingClientRect();
      var scale = rect.width / self.W;
      var x = (e.clientX - rect.left) / scale;
      self.targetX = LOVE.util.clamp(x, 20, self.W - 20);
      self.pointerActive = true;
    };
    this.canvas.addEventListener('pointermove', this.onPointer);
    this.canvas.addEventListener('pointerdown', this.onPointer);

    // close window = stop everything
    var win = this.win;
    var origClose = win.onClose;
    var self2 = this;
    win.onClose = function () {
      self2.destroy();
      if (origClose) origClose();
    };
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.loopId);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('pointermove', this.onPointer);
      this.canvas.removeEventListener('pointerdown', this.onPointer);
    }
  }

  spawn() {
    var x = LOVE.util.random(16, this.W - 16);
    var broken = Math.random() < 0.18;
    this.hearts.push({
      x: x,
      y: -20,
      vy: LOVE.util.random(80, 120) + this.score * 2,
      broken: broken,
      r: broken ? 13 : 14
    });
  }

  update(dt) {
    if (this.over) return;

    // spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      var gap = LOVE.util.clamp(0.75 - this.score * 0.03, 0.38, 0.75);
      this.spawnTimer = gap * LOVE.util.random(0.7, 1.3);
    }

    // move player (keyboard or pointer)
    if (this.pointerActive && this.targetX != null) {
      var dx = this.targetX - this.playerX;
      this.playerX += dx * Math.min(1, dt * 9);
    }
    var speed = 260;
    if (this.keys.left || this.keys.a) this.playerX -= speed * dt;
    if (this.keys.right || this.keys.d) this.playerX += speed * dt;
    this.playerX = LOVE.util.clamp(this.playerX, 22, this.W - 22);

    // move hearts + catches
    var w = 46, h = 30;
    var px = this.playerX;
    for (var i = this.hearts.length - 1; i >= 0; i--) {
      var hh = this.hearts[i];
      hh.y += hh.vy * dt;
      var removed = false;

      var caught = hh.y >= this.playerY - hh.r && hh.y <= this.playerY + hh.r + 6 &&
        hh.x > px - w / 2 - hh.r && hh.x < px + w / 2 + hh.r;

      if (caught) {
        this.hearts.splice(i, 1);
        removed = true;
        if (hh.broken) {
          this.loseLife();
        } else {
          this.gainHeart();
        }
      } else if (hh.y > this.H + 24) {
        this.hearts.splice(i, 1);
        removed = true;
      }

      if (this.over) {
        // clear remaining hearts quickly
        this.hearts = [];
        return;
      }
      if (removed) { /* already handled */ }
    }
  }

  gainHeart() {
    this.game.audio.catchHeart();
    this.score += 1;
    this.stateData.heartCatchTotal += 1;
    this.game.state.updateUnlocks();
    this.elems.target.textContent = 'HEARTS: ' + Math.min(this.score, 15) + ' / 15';
    this.game.save();
    this.game.desktopScreen.refresh();

    if (this.score >= LOVE.config.heartsTarget) {
      this.winGame();
    }
  }

  loseLife() {
    this.game.audio.brokenHeart();
    this.win.shake();
    this.lives -= 1;
    this.elems.lives.textContent = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, 3 - this.lives));
    if (this.lives <= 0) {
      this.endGame(false);
    }
  }

  endGame(wonFlag) {
    this.over = true;
    var self = this;
    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';

    if (wonFlag) {
      this.winGame();
      return;
    }
    this.won = false;
    // game over
    var audio = this.game.audio;
    audio.error();
    box.appendChild(LOVE.util.el('div', { class: 'big' }, 'POOF.'));
    box.appendChild(LOVE.util.el('div', {}, 'Don\u0027t worry. Even computers know you\u0027re adorable.'));
    var retry = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Retry');
    var back = LOVE.util.el('button', { class: 'xp-btn' }, 'Back');
    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;' });
    row.appendChild(retry);
    row.appendChild(back);
    box.appendChild(row);

    retry.addEventListener('click', function () {
      audio.click();
      self.score = 0;
      self.lives = 3;
      self.hearts = [];
      self.spawnTimer = 0.4;
      self.pointerActive = false;
      self.targetX = null;
      self.over = false;
      self.elems.target.textContent = 'HEARTS: 0 / 15';
      self.elems.lives.textContent = '❤️❤️❤️';
      box.style.display = 'none';
    });
    back.addEventListener('click', function () { audio.click(); self.win.close(); });
  }

  winGame() {
    if (this.won) return;
    this.won = true;
    this.over = true;
    this.game.audio.win();
    this.stateData.heartGameCompleted = true;
    this.game.state.grantPiece('hearts');
    this.game.save();
    this.game.desktopScreen.refresh();

    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';
    box.appendChild(LOVE.util.el('div', { class: 'big' }, '💖 ACHIEVEMENT 💖'));
    box.appendChild(LOVE.util.el('div', {}, 'Certified Lover'));
    box.appendChild(LOVE.util.el('div', { style: 'margin-top:4px;' }, 'unlocked: Memory Game'));
    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;width:100%;justify-content:center;' });
    var playAgain = LOVE.util.el('button', { class: 'xp-btn' }, 'Play again');
    var doneBtn = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Nice!');
    row.appendChild(playAgain);
    row.appendChild(doneBtn);
    box.appendChild(row);
    var self = this;
    playAgain.addEventListener('click', function () {
      self.game.audio.click();
      self.score = 0;
      self.hearts = [];
      self.spawnTimer = 0.4;
      self.over = false;
      self.won = false;
      self.lives = 3;
      self.pointerActive = false;
      self.targetX = null;
      self.elems.target.textContent = 'HEARTS: 0 / 15';
      self.elems.lives.textContent = '❤️❤️❤️';
      box.style.display = 'none';
    });
    doneBtn.addEventListener('click', function () {
      self.game.audio.click();
      self.game.openLoveExe();
      self.win.close();
    });
  }

  render() {
    var ctx = this.ctx;
    var W = this.W, H = this.H;

    // sky & grass
    ctx.fillStyle = '#aee3ff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(W - 46, 42, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9fe3ab';
    ctx.fillRect(0, H - 34, W, 34);
    ctx.fillStyle = '#7fcb8c';
    ctx.fillRect(0, H - 34, W, 6);

    // hearts
    var self = this;
    this.hearts.forEach(function (hh) {
      if (hh.broken) {
        LOVE.util.pixelHeart(ctx, hh.x, hh.y, 0.9, '#9aa0a8');
        ctx.strokeStyle = '#556070';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hh.x - 8, hh.y + 5);
        ctx.lineTo(hh.x + 8, hh.y - 3);
        ctx.stroke();
      } else {
        LOVE.util.pixelHeart(ctx, hh.x, hh.y, 1.0, '#e02058');
      }
    });

    // player basket
    var px = this.playerX, py = this.playerY;
    ctx.fillStyle = '#b06a3c';
    ctx.beginPath();
    ctx.moveTo(px - 24, py);
    ctx.lineTo(px - 16, py - 22);
    ctx.lineTo(px + 16, py - 22);
    ctx.lineTo(px + 24, py);
    ctx.lineTo(px - 24, py);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7c4f2f';
    ctx.stroke();
    ctx.fillStyle = '#d98a52';
    ctx.fillRect(px - 14, py - 6, 28, 6);
    ctx.strokeStyle = '#7c4f2f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py - 22, 16, Math.PI, 0);
    ctx.stroke();
  }

  tick(ts) {
    var dt = this.lastTs ? Math.min((ts - this.lastTs) / 1000, 0.05) : 0.016;
    this.lastTs = ts;
    this.update(dt);
    this.render();
    if (!this.destroyed) {
      this.loopId = requestAnimationFrame(this.tick.bind(this));
    }
  }
};

/* =============================================================
   EOF HeartGame.js
   ============================================================= */