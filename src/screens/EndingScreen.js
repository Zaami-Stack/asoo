/* =============================================================
   LOVE OS XP - the final ending sequence
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.Ending = {

  run: function (game) {
    var d = game.state.data;
    // the ending can only play when every heart piece is truly earned
    var allEarned = d.pieces[LOVE.PIECE.HEARTS] && d.pieces[LOVE.PIECE.MEMORY] &&
      d.pieces[LOVE.PIECE.QUIZ] && d.pieces[LOVE.PIECE.SECRET];
    if (!allEarned) {
      game.audio.deny();
      LOVE.Dialog.info(
        'ACCESS DENIED',
        'The heart is still broken.\n\nMend every piece first:\n  hearts \u2713\n  memory \u2713\n  quiz \u2713\n  secret letter \u2713\n\nThen I will be ready.',
        '💔'
      );
      return;
    }
    // grant the final heart piece + lock in the ending
    if (!d.pieces[LOVE.PIECE.FINAL]) {
      d.pieces[LOVE.PIECE.FINAL] = true;
      d.score += 100;
    }
    d.finalCompleted = true;
    d.ended = true;
    game.state.updateUnlocks();
    game.save();
    game.desktopScreen.refresh();
    game.audio.win();
    game.wm.closeAll();

    var layer = document.getElementById('overlayLayer');
    var screen = LOVE.util.el('div', { class: 'end-screen' });

    var panel = LOVE.util.el('div', { class: 'end-panel' });
    panel.appendChild(LOVE.util.el('div', { class: 'end-title' }, 'SYSTEM STATUS'));

    // happy big heart
    var heart = LOVE.util.el('div', { class: 'big-heart complete tac', 'aria-hidden': 'true' }, '❤️');
    panel.appendChild(heart);

    // system bars
    var status = LOVE.util.el('div', { class: 'sys-status' });
    var labels = [['LOVE', '💗'], ['MEMORIES', '📝'], ['HAPPINESS', '😄'], ['GIRLFRIEND', '👧']];
    labels.forEach(function (l) {
      var row = LOVE.util.el('div', { class: 'sys-row' });
      row.appendChild(LOVE.util.el('span', { class: 'sys-label' }, l[1] + ' ' + l[0]));
      var bar = LOVE.util.el('div', { class: 'sys-bar' });
      var fill = LOVE.util.el('div', { class: 'fill', style: 'width:0%;' });
      bar.appendChild(fill);
      row.appendChild(bar);
      row.appendChild(LOVE.util.el('span', { class: 'sys-pct' }, '0%'));
      status.appendChild(row);
      setTimeout(function () {
        fill.style.width = '100%';
        row.querySelector('.sys-pct').textContent = '100%';
      }, 400 + labels.indexOf(l) * 500);
    });
    panel.appendChild(status);

    var msgWrap = LOVE.util.el('div', { style: 'margin-top:14px;max-height:230px;overflow:auto;' });
    var msg = LOVE.util.el('div', { class: 'end-msg' });
    msgWrap.appendChild(msg);
    panel.appendChild(msgWrap);

    var buttons = LOVE.util.el('div', { class: 'end-buttons', style: 'display:none;' });
    panel.appendChild(buttons);

    // sequence: bars -> functioning message -> final letter (typed) -> buttons
    var fullText = LOVE.config.finalMessage.join('\n');

    setTimeout(function () {
      var punch = document.createElement('div');
      punch.style.fontWeight = 'bold';
      punch.style.fontSize = '14px';
      punch.style.color = '#c00050';
      punch.textContent = 'System functioning perfectly.' + '\n';
      msg.appendChild(punch);
    }, 1600);

    var typerStarted = false;
    setTimeout(function () {
      if (typerStarted) return;
      typerStarted = true;
      game.audio.startup();
      LOVE.util.typewriter(msg, fullText, 6, function () {
        game.audio.success();
        showButtons();
      });
    }, 2800);

    function showButtons() {
      var cfg = LOVE.config;
      if (!document.body.contains(screen)) return;
      buttons.style.display = 'flex';
      cfg.restartChoices.forEach(function (c) {
        var btn = LOVE.util.el('button', { class: 'xp-btn primary' }, c.label);
        btn.addEventListener('click', function () {
          game.audio.click();
          LOVE.Dialog.info('final_message.txt', c.reply, '💘').then(function () {
            game.newGame(true);
          });
        });
        buttons.appendChild(btn);
      });
      dropHearts(layer);
    }

    panel.appendChild(LOVE.util.el('div', { style: 'margin-top:12px;font-size:10px;color:#a46a78;text-align:center;' }, 'made on a pretend old computer, for one person in the world.'));

    screen.appendChild(panel);
    layer.appendChild(screen);

    // a little heartbeat
    setTimeout(function () {
      if (document.body.contains(screen)) { game.audio.success(); }
    }, 1200);
  }
};

/* confetti of falling hearts */
function dropHearts(layer) {
  var emojis = ['💖', '💗', '💓', '❤️', '💕', '🌸'];
  var i;
  for (i = 0; i < 26; i++) {
    (function () {
      var h = LOVE.util.el('span', { class: 'heart-fall' }, LOVE.util.pick(emojis));
      h.style.left = LOVE.util.random(20, 1000) + 'px';
      h.style.fontSize = LOVE.util.random(14, 30) + 'px';
      h.style.animationDuration = LOVE.util.random(2.4, 4.5) + 's';
      h.style.animationDelay = LOVE.util.random(0, 0.6) + 's';
      layer.appendChild(h);
      setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 5200);
    })();
  }
}

/* =============================================================
   EOF EndingScreen.js
   ============================================================= */