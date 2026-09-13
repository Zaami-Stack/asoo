/* =============================================================
   LOVE OS XP - Mini-game 2: Memory Game
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.MemoryGame = class MemoryGame {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.stateData = game.state.data;

    var pairEmojis = ['❤️', '🌸', '⭐', '🎀', '🐱', '🍓'];
    var deck = [];
    var i;
    for (i = 0; i < pairEmojis.length; i++) {
      deck.push(pairEmojis[i]);
      deck.push(pairEmojis[i]);
    }
    deck = LOVE.util.shuffle(deck);

    this.cards = deck.map(function (emoji, idx) {
      return { id: idx, emoji: emoji, matched: false, open: false };
    });

    this.matched = 0;
    this.openCards = [];
    this.locked = false;
    this.finished = false;

    this.build();
  }

  build() {
    var win = this.win;

    var hud = LOVE.util.el('div', { class: 'hud' });
    this.matchEl = LOVE.util.el('span', {}, 'PAIRS: 0 / 6');
    hud.appendChild(this.matchEl);
    hud.appendChild(LOVE.util.el('span', {}, 'match the cuteness'));
    win.body.appendChild(hud);

    var grid = LOVE.util.el('div', { class: 'memo-grid' });
    this.grid = grid;
    var self = this;
    this.cardEls = {};

    this.cards.forEach(function (card) {
      var el = LOVE.util.el('button', { class: 'mcard', 'aria-label': 'card' });
      var inner = LOVE.util.el('div', { class: 'inner' });
      var back = LOVE.util.el('div', { class: 'face back' }, '♥');
      var front = LOVE.util.el('div', { class: 'face front' }, card.emoji);
      inner.appendChild(back);
      inner.appendChild(front);
      el.appendChild(inner);
      el.tabIndex = 0;
      el.addEventListener('click', function () {
        self.onCardClick(card, el);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          self.onCardClick(card, el);
        }
      });
      grid.appendChild(el);
      self.cardEls[card.id] = el;
    });

    win.body.appendChild(grid);

    // overlay for result
    this.msgEl = LOVE.util.el('div', { class: 'game-msg', style: 'display:none;' });
    win.body.appendChild(this.msgEl);
  }

  onCardClick(card, el) {
    if (this.finished || this.locked) return;
    if (card.matched || card.open) return;

    card.open = true;
    el.classList.add('open');
    this.game.audio.flip();
    this.openCards.push({ card: card, el: el });

    if (this.openCards.length === 2) {
      this.locked = true;
      var a = this.openCards[0];
      var b = this.openCards[1];

      if (a.card.emoji === b.card.emoji) {
        // match!
        var self = this;
        setTimeout(function () {
          a.card.matched = true;
          b.card.matched = true;
          a.el.classList.add('matched');
          b.el.classList.add('matched');
          a.el.setAttribute('aria-label', 'matched');
          b.el.setAttribute('aria-label', 'matched');
          self.matched += 1;
          self.matchEl.textContent = 'PAIRS: ' + self.matched + ' / 6';
          self.game.audio.success();
          self.openCards = [];
          self.locked = false;
          if (self.matched === 6) self.winGame();
        }, 320);
      } else {
        // no match - flip back after a pause
        var self2 = this;
        setTimeout(function () {
          a.card.open = false;
          b.card.open = false;
          a.el.classList.remove('open');
          b.el.classList.remove('open');
          self2.openCards = [];
          self2.locked = false;
          self2.game.audio.error();
        }, 750);
      }
    }
  }

  winGame() {
    this.finished = true;
    this.stateData.memoryGameCompleted = true;
    this.game.state.grantPiece('memory');
    this.game.save();
    this.game.desktopScreen.refresh();
    this.game.audio.win();

    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';
    box.appendChild(LOVE.util.el('div', { class: 'big' }, '🎉'));
    box.appendChild(LOVE.util.el('div', {}, 'You remembered everything.'));
    box.appendChild(LOVE.util.el('div', { style: 'margin-top:4px;' }, 'unlocked: Guess the Memory'));
    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;' });
    var playAgain = LOVE.util.el('button', { class: 'xp-btn' }, 'Play again');
    var doneBtn = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Nice!');
    row.appendChild(playAgain);
    row.appendChild(doneBtn);
    box.appendChild(row);
    var self = this;
    playAgain.addEventListener('click', function () {
      self.game.audio.click();
      self.win.close();
      self.game.launchMemory();
    });
    doneBtn.addEventListener('click', function () {
      self.game.audio.click();
      self.game.openLoveExe();
      self.win.close();
    });
  }
};

/* =============================================================
   EOF MemoryGame.js
   ============================================================= */