/* =============================================================
   LOVE OS XP - LOVE.EXE main menu + music player
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.MainMenu = {
  /* returns the content element for the LOVE.EXE window */
  build: function (game) {
    var cfg = LOVE.config;
    var s = game.state;
    var d = s.data;

    var wrap = LOVE.util.el('div', { class: 'menu-wrap' });

    // header
    var header = LOVE.util.el('div', { class: 'menu-header' }, 'LOVE.EXE');
    wrap.appendChild(header);
    wrap.appendChild(LOVE.util.el('div', { class: 'menu-sub' }, 'For ' + cfg.girlfriendName + ' - the only authorized user of this computer.'));

    // heart pieces tracker
    var piecesRow = LOVE.util.el('div', { class: 'menu-stats' });
    var pieceNames = ['Hearts', 'Memory', 'Quiz', 'Secret', 'Final'];
    d.pieces.forEach(function (got, i) {
      var el = LOVE.util.el('span', { class: 'piece' + (got ? ' got' : '') }, got ? '♥' : '·');
      el.title = pieceNames[i] + (got ? ' - done!' : ' - not yet');
      piecesRow.appendChild(el);
    });
    wrap.appendChild(piecesRow);

    var row = LOVE.util.el('div', { class: 'app-btn-row' });

    var makeBtn = function (opts) {
      var btn = LOVE.util.el('button', { class: 'app-btn' + (opts.locked ? ' locked' : '') });
      var name = LOVE.util.el('span', { class: 'app-name' });
      name.appendChild(document.createTextNode(opts.icon + ' ' + opts.name));
      btn.appendChild(name);
      btn.appendChild(LOVE.util.el('span', { class: 'app-desc' }, opts.desc));
      if (opts.lockedNote) {
        btn.appendChild(LOVE.util.el('span', { class: 'lock-note' }, opts.lockedNote));
      }
      if (!opts.locked) {
        btn.addEventListener('click', function () { game.audio.click(); opts.action(); });
      } else {
        btn.addEventListener('click', function () { game.audio.deny(); });
      }
      return btn;
    };

    var caught = d.heartCatchTotal;
    var caughtDesc = 'caught ' + Math.min(caught, cfg.heartsTarget) + ' / ' + cfg.heartsTarget + ' hearts';
    var heartDone = d.heartGameCompleted;
    row.appendChild(makeBtn({
      name: 'Heart Catcher', icon: heartDone ? '💖' : '💗',
      desc: heartDone ? 'a certified lover lives here' : caughtDesc,
      action: function () { game.launchHearts(); }
    }));

    row.appendChild(makeBtn({
      name: 'Memory Game', icon: '🃏',
      desc: d.memoryGameCompleted ? 'you remembered everything' : 'match the pairs',
      locked: !s.isMemoryUnlocked(),
      lockedNote: 'catch 15 hearts first',
      action: function () { game.launchMemory(); }
    }));

    row.appendChild(makeBtn({
      name: 'Guess the Memory', icon: '❓',
      desc: d.quizCompleted ? 'quiz complete' : 'answer the questions',
      locked: !s.isQuizUnlocked(),
      lockedNote: 'finish the memory game first',
      action: function () { game.launchQuiz(); }
    }));

    row.appendChild(makeBtn({
      name: 'Memories', icon: '📝',
      desc: 'open the memory files',
      action: function () { game.openMemories(); }
    }));

    row.appendChild(makeBtn({
      name: 'Secret Folder', icon: d.secretUnlocked ? '🗝️' : '🔒',
      desc: d.secretUnlocked ? 'it is unlocked...' : 'locked. very locked.',
      locked: !d.secretUnlocked,
      lockedNote: 'hearts + memory + quiz needed',
      action: function () { game.openSecret(); }
    }));

    row.appendChild(makeBtn({
      name: 'Final Challenge', icon: '🏆',
      desc: d.finalCompleted ? 'love completissimo' : 'make my heart whole',
      locked: !s.isFinalUnlocked(),
      lockedNote: d.secretUnlocked && !d.secretLetterRead ? 'read the secret letter first' : 'open the secret folder first',
      action: function () { game.launchFinal(); }
    }));

    row.appendChild(makeBtn({
      name: 'Photos', icon: '🖼️',
      desc: 'a little photo album',
      action: function () { game.openPhotos(); }
    }));

    row.appendChild(makeBtn({
      name: 'Music Player', icon: '🎵',
      desc: 'the love daemon plays our songs',
      action: function () { game.openMusic(); }
    }));

    row.appendChild(makeBtn({
      name: 'Love Arcade', icon: '🎮',
      desc: 'four tiny games, all for you',
      action: function () { game.openGameRoom(); }
    }));

    wrap.appendChild(row);

    var footer = LOVE.util.el('div', { class: 'menu-footer' });
    var piecesGot = d.pieces.reduce(function (a, b) { return a + (b ? 1 : 0); }, 0);
    var loveMeter = Math.min(100, piecesGot * 15 + Math.min(d.heartCatchTotal, LOVE.config.heartsTarget) + (d.ended ? 10 : 0));
    footer.appendChild(LOVE.util.el('span', {}, 'score: ' + d.score));
    footer.appendChild(LOVE.util.el('span', {}, 'love meter: ' + loveMeter + '%'));
    footer.appendChild(LOVE.util.el('span', {}, d.ended ? '♥ final reached' : 'more to discover...'));
    wrap.appendChild(footer);

    return wrap;
  },

  /* builds the music window content */
  buildMusic: function (game) {
    var audio = game.audio;
    var box = LOVE.util.el('div', { class: 'music-box' });
    var tracks = LOVE.config.musicTracks || [];

    var art = LOVE.util.el('div', { class: 'music-art' });
    var statusEl = LOVE.util.el('div', { class: 'music-note' }, '🎵');
    var trackEl = LOVE.util.el('div', { class: 'track' });
    var artistEl = LOVE.util.el('div', { class: 'track-sub' });
    art.appendChild(statusEl);
    art.appendChild(trackEl);
    art.appendChild(artistEl);
    box.appendChild(art);

    var controls = LOVE.util.el('div', { class: 'music-controls' });
    var prevBtn = LOVE.util.el('button', { class: 'xp-btn' }, '⏮ Prev');
    var toggleBtn = LOVE.util.el('button', { class: 'xp-btn primary' }, '▶ Play');
    var nextBtn = LOVE.util.el('button', { class: 'xp-btn' }, 'Next ⏭');
    controls.appendChild(prevBtn);
    controls.appendChild(toggleBtn);
    controls.appendChild(nextBtn);
    box.appendChild(controls);

    function current() {
      return tracks[audio.track % tracks.length] || tracks[0];
    }

    var list = LOVE.util.el('div', { class: 'music-list' });
    var listItems = [];
    tracks.forEach(function (t, i) {
      (function (idx) {
        var it = LOVE.util.el('button', { class: 'xp-btn track-item' });
        it.appendChild(LOVE.util.el('span', { class: 'track-num' }, ('0' + (idx + 1)).slice(-2)));
        var nameWrap = LOVE.util.el('span', { class: 'track-name' });
        nameWrap.appendChild(LOVE.util.el('span', {}, t.title));
        if (t.about) nameWrap.appendChild(LOVE.util.el('span', { class: 'dim' }, ' - ' + t.about));
        it.appendChild(nameWrap);
        it.appendChild(LOVE.util.el('span', { class: 'track-artist' }, t.artist));
        it.addEventListener('click', function () {
          audio.click();
          audio.playSong(idx);
          refresh();
        });
        list.appendChild(it);
        listItems.push(it);
      })(i);
    });
    box.appendChild(list);

    function refresh() {
      var c = current();
      trackEl.textContent = c.title;
      artistEl.textContent = 'by ' + c.artist + (c.about ? ' - ' + c.about : '');
      toggleBtn.textContent = audio.isPlaying() ? '❚❚ Pause' : '▶ Play';
      toggleBtn.classList.toggle('primary', audio.isPlaying());
      for (var i = 0; i < listItems.length; i++) {
        listItems[i].classList.toggle('on', i === audio.track);
      }
    }

    prevBtn.addEventListener('click', function () {
      audio.click();
      audio.prevTrack();
      refresh();
    });
    nextBtn.addEventListener('click', function () {
      audio.click();
      audio.nextTrack();
      refresh();
    });
    toggleBtn.addEventListener('click', function () {
      audio.click();
      if (audio.isPlaying()) {
        if (game.settings.musicEnabled) game.toggleMusic(); else audio.pauseMusic();
      } else {
        if (game.settings.musicEnabled) { audio.setMusic(true); } else { game.toggleMusic(); }
      }
      refresh();
    });

    box.appendChild(LOVE.util.el('div', { class: 'dim' }, tracks.length + ' songs, every one of them about Asoo. rendered on a very old sound card. volume may cause smiles.'));

    refresh();
    return box;
  }
};

/* =============================================================
   EOF MainMenu.js
   ============================================================= */