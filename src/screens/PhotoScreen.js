/* =============================================================
   LOVE OS XP - photo viewer with pixel-art placeholder pictures
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.PhotoScenes = [
  {
    name: 'heart',
    palette: { R: '#e02058', r: '#ff88b0', '.': null },
    rows: [
      '.........' ,
      '...R...R.',
      '..Rrr.RrR',
      '.RrrrrrrR',
      '..Rrrrrr.',
      '...Rrrr..',
      '....Rr...',
      '.....R...'
    ]
  },
  {
    name: 'sun & flowers',
    palette: { Y: '#ffd23e', G: '#7cc35c', g: '#55a244', B: '#8fd0f0', W: '#ffffff', b: '#5a8fc0', '.': null },
    rows: [
      '....Y.....Y....',
      '...YYY...YYY...',
      '....Y....YY....',
      '....YYYYYYY....',
      '.....YYYYY.....',
      '..G..WWW...G...',
      '.Gg..WbW..gG..',
      '.Gg...W....gG..',
      '..G........G...',
      '............W..'
    ]
  },
  {
    name: 'night stars',
    palette: { S: '#fff9c0', s: '#ffffff', M: '#7b64a8', m: '#5a4785', D: '#0d1026', N: '#1a2050', '.': null },
    rows: [
      'SS...S..S..S...',
      '...........s...',
      's............S..',
      '......DDDDD....',
      '....DDMMMMDD...',
      '...DMMMMMMMMD..',
      '...MMMMMMMMMM..',
      '..DMMMMMMMMMMD.',
      '..MMMMMMMMMMMM.',
      '.DMMMMMMMMMMMMD'
    ]
  },
  {
    name: 'moon & me',
    palette: { M: '#ffe9a8', G: '#3a3a4a', g: '#26262f', H: '#f0f0ff', '.': null },
    rows: [
      '....MMM........',
      '...MMwMM.......',
      '..MM..MM.......',
      '..MM..MM.......',
      '..MM..MM.......',
      '...MMwMM.......',
      '...MMwMM.......',
      '....MM.........',
      '.....______....',
      '................'
    ]
  },
  {
    name: 'our place',
    palette: { W: '#f7f0e0', R: '#d94a5a', r: '#e88a96', D: '#b07650', d: '#7c4f35', G: '#6fae58', g: '#4e8a3d', B: '#a0d4f0', '.': null },
    rows: [
      '..........W......',
      '.........WWW.....',
      '......W..WWW.W...',
      '..G...WW.WWW.W...',
      '.Gg..WWWWWWWWW...',
      '.Gg..WWRWWWWW....',
      '.GG..WWRrrrWW....',
      '....WWWWRRRRWWW..',
      '....WRRRRRRRRWW..',
      '....WRRRRRRRRRW..',
      '...WWRRRRRRRRRWW.',
      '...WDrPDrPDrPDW..',
      '...WDDDDDDDDDDr..'
    ]
  }
];

LOVE.Photos = {
  open: function (game) {
    var id = 'photo_viewer';
    if (game.wm.find(id)) { game.wm.focus(game.wm.find(id)); return; }

    var win = new LOVE.Window({
      manager: game.wm,
      id: id,
      title: 'Photos - Love album',
      icon: '🖼️',
      width: 380,
      height: 360,
      x: 300, y: 60
    });
    win.setContent(this.build(game, win, 0));
    win.open();
  },

  openPhotoFile: function (file, game) {
    // find index in photos config (fallback to first)
    var idx = 0;
    LOVE.config.photos.forEach(function (p, i) { if (p.file === file) idx = i; });
    if (!game.wm.find('photo_viewer')) {
      var win = new LOVE.Window({
        manager: game.wm,
        id: 'photo_viewer',
        title: 'Photos - Love album',
        icon: '🖼️',
        width: 380,
        height: 360,
        x: 300, y: 60
      });
      win.setContent(this.build(game, win, idx));
      win.open();
    } else {
      var existing = game.wm.find('photo_viewer');
      existing.setContent(this.build(game, existing, idx));
      game.wm.focus(existing);
    }
  },

  build: function (game, win, index) {
    var cfg = LOVE.config;
    var photos = cfg.photos;
    var self = this;
    var i = LOVE.util.clamp(index, 0, photos.length - 1);
    var photo = photos[i];

    var box = LOVE.util.el('div', { style: 'display:flex;flex-direction:column;height:100%;' });

    var frame = LOVE.util.el('div', { class: 'photo-frame' });
    var canvas = LOVE.util.el('canvas', { width: 240, height: 170 });
    frame.appendChild(canvas);
    box.appendChild(frame);

    var meta = LOVE.util.el('div', { class: 'photo-meta' });
    meta.appendChild(LOVE.util.el('span', {}, photo.file));
    meta.appendChild(LOVE.util.el('span', {}, photo.date || ''));
    box.appendChild(meta);

    box.appendChild(LOVE.util.el('div', { class: 'photo-caption tac' }, photo.caption || ''));

    var nav = LOVE.util.el('div', { class: 'photo-nav' });
    var prevBtn = LOVE.util.el('button', { class: 'xp-btn' }, '◀ Prev');
    var nextBtn = LOVE.util.el('button', { class: 'xp-btn' }, 'Next ▶');
    var counter = LOVE.util.el('span', { style: 'align-self:center;' }, (i + 1) + ' / ' + photos.length);
    nav.appendChild(prevBtn);
    nav.appendChild(counter);
    nav.appendChild(nextBtn);
    box.appendChild(nav);

    var loadPic = function () {
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (photo.src) {
        var img = new Image();
        img.onerror = function () {
          self.drawPlaceholder(ctx, i);
          game.audio.error();
        };
        img.onload = function () {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          game.audio.catchHeart();
        };
        img.src = photo.src;
      } else {
        self.drawPlaceholder(ctx, i);
      }
    };

    prevBtn.addEventListener('click', function () {
      game.audio.click();
      i = (i - 1 + photos.length) % photos.length;
      photo = photos[i];
      meta.textContent = photo.file;
      var parts = frame.nextElementSibling;
      box.querySelector('.photo-caption').textContent = photo.caption || '';
      counter.textContent = (i + 1) + ' / ' + photos.length;
      loadPic();
      refreshDate();
      game.save();
    });
    nextBtn.addEventListener('click', function () {
      game.audio.click();
      i = (i + 1) % photos.length;
      photo = photos[i];
      box.querySelector('.photo-caption').textContent = photo.caption || '';
      counter.textContent = (i + 1) + ' / ' + photos.length;
      loadPic();
      refreshDate();
      game.save();
    });

    var refreshDate = function () {
      meta.innerHTML = '';
      meta.appendChild(LOVE.util.el('span', {}, photo.file));
      meta.appendChild(LOVE.util.el('span', {}, photo.date || ''));
    };

    // viewing photos counts toward... romance
    var d = game.state.data;
    var before = d.memoriesViewed.indexOf('special_photo.jpg') !== -1;
    if (!before && photo.file === 'special_photo.jpg') {
      game.state.markMemoryViewed('special_photo.jpg');
      game.save();
      game.desktopScreen.refresh();
    }

    loadPic();
    return box;
  },

  drawPlaceholder: function (ctx, index) {
    var scenes = LOVE.PhotoScenes;
    var scene = scenes[index % scenes.length];
    var cell = 14;
    var offX = Math.round((ctx.canvas.width - scene.rows[0].length * cell) / 2);
    var offY = Math.round((ctx.canvas.height - scene.rows.length * cell) / 2);
    ctx.fillStyle = '#fef8ee';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    scene.rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var c = row[x];
        var color = scene.palette[c];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(offX + x * cell, offY + y * cell, cell, cell);
      }
    });
  }
};

/* =============================================================
   EOF PhotoScreen.js
   ============================================================= */