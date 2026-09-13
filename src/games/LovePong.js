/* =============================================================
   LOVE OS XP - Arcade game 1: Asoo Pong
   You on the left. Asoo on the right (the AI loves to win - or
   pretends to lose). First to 7 hearts wins.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.LovePong = class LovePong {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.stateData = game.state.data;

    this.W = 480;
    this.H = 320;
    this.WIN_SCORE = 7;
    this.playerY = this.H / 2;
    this.asooY = this.H / 2;
    this.score = 0;
    this.asooScore = 0;
    this.keys = {};
    this.over = false;
    this.won = false;
    this.padW = 10;
    this.padH = 52;
    this.lastTs = 0;

    this.build();
    this.bind();
    this.resetBall(false);
    this.loopId = requestAnimationFrame(this.tick.bind(this));
  }

  build() {
    var win = this.win;

    var hud = LOVE.util.el('div', { class: 'hud' });
    this.elems = {};
    this.elems.score = LOVE.util.el('span', {}, 'YOU 0  :  0 ASOO');
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
      if (['arrowup', 'arrowdown', 'w', 's'].indexOf(k) !== -1) e.preventDefault();
      if (k === 'arrowup') self.keys.up = true;
      if (k === 'arrowdown') self.keys.down = true;
      if (k === 'w') self.keys.w = true;
      if (k === 's') self.keys.s = true;
      if (k === ' ' && self.over && !self.won) self.restart();
    };
    this.onKeyUp = function (e) {
      var k = e.key && e.key.toLowerCase();
      if (k === 'arrowup') self.keys.up = false;
      if (k === 'arrowdown') self.keys.down = false;
      if (k === 'w') self.keys.w = false;
      if (k === 's') self.keys.s = false;
    };
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

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
    document.removeEventListener('keyup', this.onKeyUp);
  }

  resetBall(towardPlayer) {
    this.ball = {
      x: this.W / 2,
      y: this.H / 2,
      vx: (towardPlayer ? -1 : 1) * LOVE.util.random(140, 180),
      vy: LOVE.util.random(-120, 120),
      r: 6
    };
  }

  restart() {
    var audio = this.game.audio;
    this.score = 0;
    this.asooScore = 0;
    this.over = false;
    this.won = false;
    this.playerY = this.H / 2;
    this.asooY = this.H / 2;
    this.resetBall(false);
    this.elems.score.textContent = 'YOU 0  :  0 ASOO';
    this.msgEl.style.display = 'none';
    audio.click();
  }

  update(dt) {
    if (this.over || !this.ball) return;

    var speed = 300;
    if (this.keys.up || this.keys.w) this.playerY -= speed * dt;
    if (this.keys.down || this.keys.s) this.playerY += speed * dt;
    this.playerY = LOVE.util.clamp(this.playerY, this.padH / 2 + 2, this.H - this.padH / 2 - 2);

    // Asoo's paddle: she is good, but she lets you catch up
    var skill = 140 + this.score * 18;
    var dy = this.ball.y - this.asooY;
    var move = LOVE.util.clamp(dy, -skill * dt, skill * dt);
    this.asooY += move;
    this.asooY = LOVE.util.clamp(this.asooY, this.padH / 2 + 2, this.H - this.padH / 2 - 2);

    var b = this.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // top / bottom walls
    if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }
    if (b.y + b.r > this.H) { b.y = this.H - b.r; b.vy = -Math.abs(b.vy); }

    // left paddle (you)
    if (b.vx < 0 && b.x - b.r < 18 + this.padW && b.x > 8) {
      if (b.y > this.playerY - this.padH / 2 - b.r && b.y < this.playerY + this.padH / 2 + b.r) {
        b.vx = Math.abs(b.vx) * 1.06 + 8;
        b.vy = b.y - this.playerY;
        b.vy = LOVE.util.clamp(b.vy, -180, 180);
        this.game.audio.flip();
      }
    }
    // right paddle (Asoo)
    if (b.vx > 0 && b.x + b.r > this.W - 18 - this.padW && b.x < this.W - 8) {
      if (b.y > this.asooY - this.padH / 2 - b.r && b.y < this.asooY + this.padH / 2 + b.r) {
        b.vx = -Math.abs(b.vx) * 1.06 - 8;
        b.vy = b.y - this.asooY;
        b.vy = LOVE.util.clamp(b.vy, -180, 180);
        this.game.audio.flip();
      }
    }

    // scoring
    if (b.x > this.W + 20) {
      this.scorePoint(true);
    } else if (b.x < -20) {
      this.scorePoint(false);
    }
  }

  scorePoint(playerWon) {
    this.game.audio.success();
    if (playerWon) {
      this.score += 1;
    } else {
      this.asooScore += 1;
    }
    this.elems.score.textContent = 'YOU ' + this.score + '  :  ' + this.asooScore + ' ASOO';
    if (this.score >= this.WIN_SCORE) {
      this.endGame(true);
      return;
    }
    if (this.asooScore >= this.WIN_SCORE) {
      this.endGame(false);
      return;
    }
    this.resetBall(!playerWon);
  }

  endGame(playerWon) {
    this.over = true;
    this.won = playerWon;
    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';

    var audio = this.game.audio;
    var row1, row2, retry, back;
    var self = this;
    if (playerWon) {
      audio.win();
      this.stateData.arcadeWins.pong = (this.stateData.arcadeWins.pong || 0) + 1;
      this.game.save();
      box.appendChild(LOVE.util.el('div', { class: 'big' }, '🏆 YOU WIN 🏆'));
      row2 = 'You beat Asoo. She says it was clearly luck, but her heart is very proud.';
    } else {
      audio.error();
      box.appendChild(LOVE.util.el('div', { class: 'big' }, '💜 ASOO WINS 💜'));
      row2 = 'Asoo wins. Of course she does. But loved ones always come back for a rematch.';
    }
    box.appendChild(LOVE.util.el('div', {}, 'final: YOU ' + this.score + ' - ' + this.asooScore + ' ASOO'));
    box.appendChild(LOVE.util.el('div', { style: 'margin-top:4px;' }, row2));

    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;width:100%;justify-content:center;' });
    retry = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Rematch');
    back = LOVE.util.el('button', { class: 'xp-btn' }, 'Back');
    row.appendChild(retry);
    row.appendChild(back);
    box.appendChild(row);
    box.appendChild(LOVE.util.el('div', { class: 'dim' }, 'controls: W/S or ↑/↓'));

    retry.addEventListener('click', function () { self.game.audio.click(); self.restart(); });
    back.addEventListener('click', function () { self.game.audio.click(); self.win.close(); });
  }

  render() {
    var ctx = this.ctx;
    var W = this.W, H = this.H;

    ctx.fillStyle = '#14213d';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ff5d8f';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    var padCol = '#ffd166';
    ctx.fillStyle = '#3ddad7';
    ctx.fillRect(8, this.playerY - this.padH / 2, this.padW, this.padH);
    ctx.fillStyle = '#ff5d8f';
    ctx.fillRect(W - 8 - this.padW, this.asooY - this.padH / 2, this.padW, this.padH);

    if (this.ball) {
      LOVE.util.pixelHeart(ctx, this.ball.x, this.ball.y, 1.0, '#ff5d8f');
    }

    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(0, 8, W, 2);
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
   EOF LovePong.js
   ============================================================= */