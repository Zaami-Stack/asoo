/* =============================================================
   LOVE OS XP - Final challenge: assemble the broken heart
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.FinalChallenge = class FinalChallenge {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.stateData = game.state.data;
    this.build();
  }

  build() {
    var win = this.win;
    var d = this.stateData;
    var game = this.game;
    var self = this;

    var wrap = LOVE.util.el('div', { class: 'final-wrap' });
    win.body.appendChild(wrap);

    var heart = LOVE.util.el('div', { class: 'big-heart' + (d.finalCompleted ? ' complete' : ''), 'aria-hidden': 'true' }, d.finalCompleted ? '❤️' : '💔');
    wrap.appendChild(heart);

    var piecesRow = LOVE.util.el('div', { class: 'pieces-row' });
    var pieceNames = ['Hearts', 'Memory', 'Quiz', 'Secret', 'Final'];
    d.pieces.forEach(function (got, i) {
      var el = LOVE.util.el('span', { class: 'piece' + (got ? ' got' : '') }, got ? '♥' : '·');
      el.title = pieceNames[i];
      piecesRow.appendChild(el);
    });
    wrap.appendChild(piecesRow);

    var pct = d.pieces.reduce(function (a, b) { return a + (b ? 1 : 0); }, 0);
    wrap.appendChild(LOVE.util.el('div', {}, 'heart pieces: ' + pct + ' / 5'));

    wrap.appendChild(LOVE.util.el('div', { class: 'dim tac' }, 'each finished activity mends a piece of this heart.'));

    // system bars for each piece
    var status = LOVE.util.el('div', { class: 'sys-status', style: 'margin-top:6px;' });
    [[0, 'HEARTS'], [1, 'MEMORY'], [2, 'QUIZ'], [3, 'SECRET'], [4, 'FINAL']].forEach(function (row) {
      var i = row[0];
      var r = LOVE.util.el('div', { class: 'sys-row' });
      r.appendChild(LOVE.util.el('span', { class: 'sys-label' }, row[1]));
      var bar = LOVE.util.el('div', { class: 'sys-bar' });
      var fill = LOVE.util.el('div', { class: 'fill', style: 'width:' + (d.pieces[i] ? '100%' : '0%') + ';' });
      bar.appendChild(fill);
      r.appendChild(bar);
      r.appendChild(LOVE.util.el('span', { class: 'sys-pct' }, d.pieces[i] ? '100%' : '0%'));
      status.appendChild(r);
    });
    wrap.appendChild(status);

    var actionRow = LOVE.util.el('div', { style: 'display:flex;gap:8px;justify-content:center;' });

    if (!d.finalCompleted) {
      var btn = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Make my heart whole ♥');
      btn.addEventListener('click', function () {
        game.audio.click();
        LOVE.Dialog.confirm('Final Challenge', 'It looks like the heart is almost whole. Are you ready to mend it?', 'Yes, mend it', 'Not yet').then(function (yes) {
          if (yes) {
            game.runEnding();
          }
        });
      });
      actionRow.appendChild(btn);
    } else {
      var watchAgain = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Watch the ending again ♥');
      watchAgain.addEventListener('click', function () {
        game.audio.click();
        game.runEnding();
      });
      actionRow.appendChild(watchAgain);
    }

    var backBtn = LOVE.util.el('button', { class: 'xp-btn' }, 'Back');
    backBtn.addEventListener('click', function () {
      game.audio.click();
      game.openLoveExe();
      win.close();
    });
    actionRow.appendChild(backBtn);

    wrap.appendChild(actionRow);

    if (d.finalCompleted) {
      wrap.appendChild(LOVE.util.el('div', { class: 'dim tac', style: 'margin-top:4px;' }, 'the system is now officially 100% in love.'));
    }
  }
};

/* =============================================================
   EOF FinalChallenge.js
   ============================================================= */