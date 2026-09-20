/* =============================================================
   LOVE OS XP - taskbar (start button, open tasks, tray, clock)
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.Taskbar = class Taskbar {
  constructor(game, container) {
    this.game = game;
    this.startOpen = false;
    this.elems = {};
    this.build(container);
    var self = this;
    this.clockTimer = setInterval(function () { self.tick(); }, 1000);
    this.tick();
  }

  build(container) {
    var game = this.game;
    var bar = LOVE.util.el('div', { class: 'taskbar' });
    this.elems.bar = bar;

    // ---- start button with (pretend) logo ----
    var logo = LOVE.util.el('span', { class: 'start-logo', 'aria-hidden': 'true' }, '🌸');
    var startBtn = LOVE.util.el('button', { class: 'start-btn', 'aria-label': 'Start' });
    startBtn.appendChild(logo);
    startBtn.appendChild(document.createTextNode('start'));
    var self = this;
    logo.addEventListener('click', function (e) {
      e.stopPropagation();
      self.game.eggClicked('startlogo');
    });
    startBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      self.game.audio.click();
      self.toggleStart();
    });
    bar.appendChild(startBtn);
    this.elems.startBtn = startBtn;

    // ---- open applications (populated by manager) ----
    var tasks = LOVE.util.el('div', { class: 'task-items' });
    bar.appendChild(tasks);
    this.elems.tasks = tasks;

    // ---- tray ----
    var tray = LOVE.util.el('div', { class: 'tray' });

    var musicBtn = LOVE.util.el('button', {
      class: 'tray-btn',
      'aria-label': 'Toggle music',
      title: 'music on/off'
    }, game.settings.musicEnabled ? '🔊' : '🔇');
    musicBtn.addEventListener('click', function () { game.toggleMusic(); });
    tray.appendChild(musicBtn);
    this.elems.musicBtn = musicBtn;

    var retroBtn = LOVE.util.el('button', {
      class: 'tray-btn',
      'aria-label': 'Toggle retro / CRT effect',
      title: 'retro effects on/off'
    }, game.settings.retroEnabled ? '◑' : '○');
    retroBtn.addEventListener('click', function () { game.toggleRetro(); });
    tray.appendChild(retroBtn);
    this.elems.retroBtn = retroBtn;

    var piecesEl = LOVE.util.el('span', {
      class: 'tray-btn',
      style: 'width:auto;font-size:10px;cursor:default;',
      title: 'heart pieces collected'
    });
    tray.appendChild(piecesEl);
    this.elems.pieces = piecesEl;

    var clock = LOVE.util.el('div', { class: 'clock', title: 'let the clock be a love clock' }, '--:--');
    clock.addEventListener('click', function () {
      if (self.isBirthday()) {
        game.audio.birthday();
        LOVE.Dialog.info('Birthday', 'It\u0027s the {age}th birthday today - the clock is legally required to celebrate.'.replace('{age}', (LOVE.config.birthday || {}).age || ''), '🎂');
        return;
      }
      game.eggClicked('clock');
    });
    tray.appendChild(clock);
    this.elems.clock = clock;

    bar.appendChild(tray);

    container.appendChild(bar);
    this.refreshPieces();
  }

  toggleStart() {
    if (this.startOpen) { this.closeStart(); return; }
    this.openStart();
  }

  openStart() {
    if (this.startOpen) return;
    var game = this.game;
    var menu = LOVE.util.el('div', { class: 'start-menu', role: 'menu' });

    var header = LOVE.util.el('div', { class: 'sm-header' });
    header.appendChild(LOVE.util.el('span', { class: 'xp-font', style: 'font-size:10px;' }, 'LOVE OS XP'));
    header.appendChild(LOVE.util.el('span', { style: 'font-size:10px;' }, '♥'));
    menu.appendChild(header);

    var cols = LOVE.util.el('div', { class: 'sm-cols' });

    var colA = LOVE.util.el('div', { class: 'sm-col' });
    colA.appendChild(LOVE.util.el('div', { class: 'sm-col-title' }, 'Asoo\u0027s programs'));
    var colB = LOVE.util.el('div', { class: 'sm-col' });
    colB.appendChild(LOVE.util.el('div', { class: 'sm-col-title' }, 'system'));
    cols.appendChild(colA);
    cols.appendChild(colB);

    var items = [
      { col: 'a', id: 'love', label: 'LOVE.EXE', icon: '♥' },
      { col: 'a', id: 'hearts', label: 'Heart Catcher', icon: '💗' },
      { col: 'a', id: 'memory', label: 'Memory Game', icon: '🃏', locked: !game.state.isMemoryUnlocked() },
      { col: 'a', id: 'quiz', label: 'Guess the Memory', icon: '❓', locked: !game.state.isQuizUnlocked() },
      { col: 'a', id: 'sep', label: '' },
      { col: 'a', id: 'paint', label: 'Paint', icon: '🎨' },
      { col: 'a', id: 'gallery', label: 'My Pictures', icon: '🖼️' },
      { col: 'a', id: 'calc', label: 'Calculator', icon: '🧮' },
      { col: 'a', id: 'sep', label: '' },
      { col: 'a', id: 'arcade', label: 'Love Arcade', icon: '🎮' },
      { col: 'a', id: 'lovepong', label: 'Asoo Pong', icon: '🏓' },
      { col: 'a', id: 'datesnake', label: 'Heart Snake', icon: '🐍' },
      { col: 'a', id: 'whacklove', label: 'Whack-a-Love', icon: '🔨' },
      { col: 'a', id: 'simonlove', label: 'Asoo Says', icon: '🎶' },
      { col: 'a', id: 'lovesweeper', label: 'Heartfield', icon: '🕳️' },
      { col: 'a', id: 'sep', label: '' },
      { col: 'a', id: 'memories', label: 'Memories', icon: '📝' },
      { col: 'a', id: 'photos', label: 'Photos', icon: '🖼️' },
      { col: 'a', id: 'music', label: 'Music Player', icon: '🎵' },
      { col: 'b', id: 'sep', label: '' },
      { col: 'b', id: 'secret', label: 'Secret Folder', icon: '🔒', locked: !game.state.data.secretUnlocked },
      { col: 'b', id: 'sep', label: '' },
      { col: 'b', id: 'about', label: 'About LoveOS', icon: '🖥️' },
      { col: 'b', id: 'newgame', label: 'New Game', icon: '🔄' },
      { col: 'b', id: 'reset', label: 'Reset Progress', icon: '🗑️' }
    ];

    if (LOVE.config.birthday && LOVE.config.birthday.enabled) {
      items.push({ col: 'a', id: 'cake', label: 'Birthday Cake', icon: '🎂' });
    }

    var self = this;
    items.forEach(function (it) {
      var host = it.col === 'b' ? colB : colA;
      if (it.id === 'sep') {
        host.appendChild(LOVE.util.el('div', { class: 'sm-sep' }));
        return;
      }
      var row = LOVE.util.el('button', { class: 'start-item', role: 'menuitem' });
      row.appendChild(LOVE.util.el('span', { class: 'si-icon', 'aria-hidden': 'true' }, it.icon));
      row.appendChild(document.createTextNode(it.label));
      if (it.locked) row.appendChild(LOVE.util.el('span', { class: 'si-lock' }, '🔒'));
      row.addEventListener('click', function () {
        self.closeStart();
        if (it.locked) { game.audio.deny(); return; }
        game.startMenuItem(it.id);
      });
      host.appendChild(row);
    });

    menu.appendChild(cols);
    this.elems.bar.appendChild(menu);
    this.startMenu = menu;
    this.startOpen = true;

    var self2 = this;
    this.outsideClose = function (e) {
      if (!self2.startOpen) return;
      if (self2.startMenu && self2.startMenu.contains(e.target)) return;
      if (self2.elems.startBtn && self2.elems.startBtn.contains(e.target)) return;
      self2.closeStart();
    };
    document.addEventListener('pointerdown', this.outsideClose);
  }

  closeStart() {
    if (this.startMenu && this.startMenu.parentNode) {
      this.startMenu.parentNode.removeChild(this.startMenu);
    }
    this.startMenu = null;
    this.startOpen = false;
    if (this.outsideClose) {
      document.removeEventListener('pointerdown', this.outsideClose);
      this.outsideClose = null;
    }
  }

  /* reflect the open-window list as task buttons */
  setTasks(windows) {
    var game = this.game;
    var self = this;
    var wrap = this.elems.tasks;
    wrap.innerHTML = '';
    var active = game.wm.topWindow();
    windows.forEach(function (w) {
      var btn = LOVE.util.el('button', { class: 'task-item', role: 'button' });
      btn.appendChild(LOVE.util.el('span', { class: 't-icon', 'aria-hidden': 'true' }, w.icon));
      btn.appendChild(document.createTextNode(w.title));
      btn.classList.toggle('active', w === active);
      btn.addEventListener('click', function () {
        game.audio.click();
        if (w.isMinimized) game.wm.restore(w);
        else if (w.isMaximized) { game.wm.focus(w); }
        else { w.minimize(); }
        self.closeStart();
      });
      wrap.appendChild(btn);
    });
    if (windows.length === 0) {
      wrap.appendChild(LOVE.util.el('span', { style: 'color:#cfe;font-size:10px;padding-left:4px;' }, 'nothing open... yet'));
    }
  }

  setMusicIcon(on) { this.elems.musicBtn.textContent = on ? '🔊' : '🔇'; }
  setRetroIcon(on) { this.elems.retroBtn.textContent = on ? '◑' : '○'; }

  /* true when today matches the configured birthday date */
  isBirthday() {
    var b = LOVE.config.birthday;
    if (!b || !b.enabled || !Array.isArray(b.date)) return false;
    var d = new Date();
    return d.getMonth() + 1 === b.date[0] && d.getDate() === b.date[1];
  }

  refreshPieces() {
    var n = this.game.state.data.pieces.reduce(function (a, b) { return a + (b ? 1 : 0); }, 0);
    this.elems.pieces.textContent = '♥ ' + n + '/5';
  }

  tick() {
    var d = new Date();
    var hh = ('0' + d.getHours()).slice(-2);
    var mm = ('0' + d.getMinutes()).slice(-2);
    this.elems.clock.textContent = (this.isBirthday() ? '🎂 ' : '') + hh + ':' + mm;
  }
};

/* =============================================================
   EOF Taskbar.js
   ============================================================= */