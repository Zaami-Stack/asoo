/* =============================================================
   LOVE OS XP - Love Arcade room
   Four tiny machines of affection. All of them are about one
   specific girl, but we do not say her surname.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.GameRoom = {
  /* returns the content element for the Love Arcade window */
  build: function (game) {
    var cfg = LOVE.config;
    var d = game.state.data;
    var w = d.arcadeWins || {};

    var wrap = LOVE.util.el('div', { class: 'menu-wrap' });
    wrap.appendChild(LOVE.util.el('div', { class: 'menu-header' }, 'LOVE ARCADE'));
    wrap.appendChild(LOVE.util.el('div', { class: 'menu-sub' }, 'For ' + cfg.girlfriendName + ' - adult (emotional) supervision required.'));

    var row = LOVE.util.el('div', { class: 'app-btn-row' });

    var makeBtn = function (opts) {
      var btn = LOVE.util.el('button', { class: 'app-btn' });
      var name = LOVE.util.el('span', { class: 'app-name' });
      name.appendChild(document.createTextNode(opts.icon + ' ' + opts.name));
      btn.appendChild(name);
      btn.appendChild(LOVE.util.el('span', { class: 'app-desc' }, opts.desc));
      btn.appendChild(LOVE.util.el('span', { class: 'app-desc', style: 'color:#c00050;font-weight:bold;' }, 'wins: ' + (opts.wins || 0)));
      btn.addEventListener('click', function () { game.audio.click(); opts.action(); });
      return btn;
    };

    row.appendChild(makeBtn({
      name: 'Asoo Pong', icon: '🏓', wins: w.pong || 0,
      desc: '7 points of love. she plays the right side.',
      action: function () { game.launchLovePong(); }
    }));
    row.appendChild(makeBtn({
      name: 'Heart Snake', icon: '🐍', wins: w.snake || 0,
      desc: 'eat 12 hearts with a heartsnake',
      action: function () { game.launchDateSnake(); }
    }));
    row.appendChild(makeBtn({
      name: 'Whack-a-Love', icon: '🔨', wins: w.whack || 0,
      desc: '30 seconds. hearts up, clouds down.',
      action: function () { game.launchWhackLove(); }
    }));
    row.appendChild(makeBtn({
      name: 'Asoo Says', icon: '🎶', wins: w.simon || 0,
      desc: 'best combo: ' + (w.simon || 0) + ' rounds - repeat the hearts',
      action: function () { game.launchSimonLove(); }
    }));

    wrap.appendChild(row);

    var total = (w.pong || 0) + (w.snake || 0) + (w.whack || 0) + (w.simon || 0);
    var footer = LOVE.util.el('div', { class: 'menu-footer' });
    footer.appendChild(LOVE.util.el('span', {}, 'total arcade victories: ' + total));
    footer.appendChild(LOVE.util.el('span', {}, 'all games secretly feature the same girl'));
    wrap.appendChild(footer);

    return wrap;
  }
};

/* =============================================================
   EOF GameRoom.js
   ============================================================= */