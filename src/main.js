/* =============================================================
   LOVE OS XP - the game orchestrator / main entry
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.Game = class Game {
  constructor() {
    this.settings = { musicEnabled: true, retroEnabled: true, wallpaper: null };
    this.state = null;
    this.audio = new LOVE.AudioManager();
    this.firedEggs = {};
    this.eggCounts = {};

    this.viewport = document.getElementById('viewport');
    this.scalebox = document.getElementById('scalebox');
    this.desktopRoot = document.getElementById('desktopRoot');
    this.windowLayer = document.getElementById('windowLayer');
    this.overlayLayer = document.getElementById('overlayLayer');

    this.wm = new LOVE.WindowManager(this.windowLayer);
    this.desktopScreen = new LOVE.DesktopScreen(this);

    this.loadSettings();
    this.audio.musicOn = this.settings.musicEnabled;
    this.applyRetro();

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));

    // unlock audio on the first real interaction (browser rule)
    var self = this;
    var unlock = function () { self.audio.unlock(); };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
  }

  /* ---------------- boot / desktop flow ---------------- */

  start() {
    var saved = LOVE.SaveSystem.load();
    this.state = new LOVE.GameState(saved ? saved.state : null);

    var ask = !!(saved && saved.state && !saved.state.ended);
    new LOVE.BootScreen().show(this.overlayLayer, { ask: ask, audio: this.audio }, this.afterBoot.bind(this));
  }

  afterBoot(mode) {
    if (mode === 'new') {
      LOVE.SaveSystem.clear();
      window.location.reload();
      return;
    }
    this.desktopScreen.show();
    if (!this.state.data.started) {
      this.desktopScreen.showWelcome(this);
    } else {
      this.openLoveExe();
    }
  }

  loadSettings() {
    var saved = LOVE.SaveSystem.load();
    if (saved && saved.settings) {
      this.settings.musicEnabled = saved.settings.musicEnabled !== false;
      this.settings.retroEnabled = saved.settings.retroEnabled !== false;
      this.settings.wallpaper = saved.settings.wallpaper || null;
    }
    this.audio.musicOn = this.settings.musicEnabled;
  }

  save() {
    LOVE.SaveSystem.save(this.state.data, this.settings);
    this.desktopScreen.refresh();
  }

  applyRetro() {
    document.body.classList.toggle('crt-on', this.settings.retroEnabled);
  }

  resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var pad = 20;
    var s = Math.min((w - pad) / 1024, (h - pad) / 640);
    var scale = LOVE.util.clamp(s, 0.18, 1.4);
    this.scalebox.style.width = (1024 * scale) + 'px';
    this.scalebox.style.height = (640 * scale) + 'px';
    this.viewport.style.transform = 'scale(' + scale + ')';
  }

  /* ---------------- settings toggles ---------------- */

  toggleMusic() {
    this.settings.musicEnabled = !this.settings.musicEnabled;
    this.audio.setMusic(this.settings.musicEnabled);
    if (this.desktopScreen.taskbar) this.desktopScreen.taskbar.setMusicIcon(this.settings.musicEnabled);
    this.save();
    return this.settings.musicEnabled;
  }

  toggleRetro() {
    this.settings.retroEnabled = !this.settings.retroEnabled;
    this.applyRetro();
    if (this.desktopScreen.taskbar) this.desktopScreen.taskbar.setRetroIcon(this.settings.retroEnabled);
    this.save();
    return this.settings.retroEnabled;
  }

  /* ---------------- easter eggs ---------------- */

  eggClicked(target) {
    var eggs = LOVE.config.easterEggs || [];
    var cfg = null;
    eggs.forEach(function (e) { if (e.target === target) cfg = e; });
    if (!cfg) return;
    if (this.firedEggs[target]) return;

    if (cfg.chance) {
      if (Math.random() < cfg.chance) {
        this.firedEggs[target] = true;
        this.audio.success();
        LOVE.Dialog.info('Easter egg found!', cfg.message, '🥚');
      }
      return;
    }

    this.eggCounts[target] = (this.eggCounts[target] || 0) + 1;
    if (this.eggCounts[target] === cfg.clicks) {
      this.firedEggs[target] = true;
      this.audio.success();
      LOVE.Dialog.info('Easter egg found!', cfg.message, '🥚');
    }
  }

  /* ---------------- desktop icon + start menu routing ---------------- */

  deskIconClicked(ic) {
    var self = this;
    var routes = {
      love: function () { self.openLoveExe(); },
      memories: function () { self.openMemories(); },
      photos: function () { self.openPhotos(); },
      music: function () { self.openMusic(); },
      secret: function () { self.openSecret(); },
      mycomputer: function () { self.openMyComputer(); },
      recycle: function () { self.openRecycle(); },
      junk: function () { self.openJunk(); },
      arcade: function () { self.openGameRoom(); },
      paint: function () { self.openPaint(); },
      gallery: function () { self.openGallery(); },
      calc: function () { self.openCalculator(); }
    };
    if (routes[ic.id]) routes[ic.id]();
  }

  startMenuItem(id) {
    var self = this;
    var map = {
      love: function () { self.openLoveExe(); },
      hearts: function () { self.launchHearts(); },
      memory: function () { self.launchMemory(); },
      quiz: function () { self.launchQuiz(); },
      memories: function () { self.openMemories(); },
      photos: function () { self.openPhotos(); },
      music: function () { self.openMusic(); },
      secret: function () { self.openSecret(); },
      about: function () { self.showAbout(); },
      newgame: function () { self.newGame(); },
      reset: function () { self.resetProgress(); },
      arcade: function () { self.openGameRoom(); },
      lovepong: function () { self.launchLovePong(); },
      datesnake: function () { self.launchDateSnake(); },
      whacklove: function () { self.launchWhackLove(); },
      simonlove: function () { self.launchSimonLove(); },
      lovesweeper: function () { self.launchLoveSweeper(); },
      paint: function () { self.openPaint(); },
      gallery: function () { self.openGallery(); },
      calc: function () { self.openCalculator(); }
    };
    if (map[id]) map[id]();
  }

  /* ---------------- apps & windows ---------------- */

  openLoveExe() {
    var self = this;
    var existing = this.wm.find('love_exe');
    if (existing) {
      existing.setContent(LOVE.MainMenu.build(this));
      this.wm.focus(existing);
      return;
    }
    var win = new LOVE.Window({
      manager: this.wm,
      id: 'love_exe',
      title: 'LOVE.EXE - ' + LOVE.config.girlfriendName,
      icon: '❤️',
      width: 470,
      height: 470,
      x: 150, y: 40,
      closable: true
    });
    win.setContent(LOVE.MainMenu.build(this));
    win.open();
  }

  launchHearts() {
    var id = 'heartgame';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Catch the Hearts', icon: '💗',
      width: 484, height: 396, x: 140, y: 40
    });
    win.open();
    new LOVE.HeartGame(win, this);
  }

  openGameRoom() {
    var id = 'game_room';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Love Arcade - for Asoo', icon: '🎮',
      width: 470, height: 420, x: 180, y: 40
    });
    win.setContent(LOVE.GameRoom.build(this));
    win.open();
    this.eggClicked('arcade');
  }

  launchLovePong() {
    var id = 'lovepong';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Asoo Pong', icon: '🏓',
      width: 484, height: 420, x: 140, y: 30
    });
    win.open();
    new LOVE.LovePong(win, this);
  }

  launchDateSnake() {
    var id = 'datesnake';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Heart Snake', icon: '🐍',
      width: 484, height: 420, x: 160, y: 30
    });
    win.open();
    new LOVE.DateSnake(win, this);
  }

  launchWhackLove() {
    var id = 'whacklove';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Whack-a-Love', icon: '🔨',
      width: 380, height: 440, x: 180, y: 20
    });
    win.open();
    new LOVE.WhackLove(win, this);
  }

  launchSimonLove() {
    var id = 'simonlove';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Asoo Says', icon: '🎵',
      width: 380, height: 460, x: 170, y: 20
    });
    win.open();
    new LOVE.SimonLove(win, this);
  }

  launchLoveSweeper() {
    var id = 'lovesweeper';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Heartfield', icon: '🕳️',
      width: 470, height: 470, x: 150, y: 20
    });
    win.open();
    new LOVE.LoveSweeper(win, this);
  }

  openPaint() {
    var id = 'paint';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Paint - Asoo edition', icon: '🎨',
      width: 460, height: 470, x: 130, y: 20
    });
    win.open();
    new LOVE.PaintApp(win, this);
  }

  openGallery() {
    var id = 'gallery';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'My Pictures', icon: '🖼️',
      width: 470, height: 380, x: 160, y: 30
    });
    win.open();
    new LOVE.GalleryApp(win, this);
  }

  openCalculator() {
    var id = 'calculator';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Calculator', icon: '🧮',
      width: 250, height: 340, x: 300, y: 30
    });
    win.open();
    new LOVE.CalculatorApp(win, this);
  }

  /* set (or clear) Asoo's own artwork as the desktop wallpaper */
  setWallpaper(url) {
    this.settings.wallpaper = url || null;
    if (this.desktopScreen) this.desktopScreen.applyWallpaper();
    this.save();
  }

  launchMemory() {
    if (!this.state.isMemoryUnlocked()) {
      this.audio.deny();
      LOVE.Dialog.open({
        title: 'LOCKED',
        icon: '🔒',
        message: 'This game unlocks after you catch 15 hearts. The catch-the-hearts phase comes first, little one.',
        buttons: [{ label: 'OK', value: 'ok', primary: true }]
      });
      return;
    }
    var id = 'memgame';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Memory Game', icon: '🃏',
      width: 470, height: 340, x: 170, y: 40
    });
    win.open();
    new LOVE.MemoryGame(win, this);
  }

  launchQuiz() {
    if (!this.state.isQuizUnlocked()) {
      this.audio.deny();
      LOVE.Dialog.open({
        title: 'LOCKED',
        icon: '🔒',
        message: 'Finish the memory game first. And then maybe get some water. Hydration is important.',
        buttons: [{ label: 'OK', value: 'ok', primary: true }]
      });
      return;
    }
    var id = 'quizgame';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Guess the Memory', icon: '❓',
      width: 470, height: 400, x: 150, y: 30
    });
    win.open();
    new LOVE.QuizGame(win, this);
  }

  launchFinal() {
    if (!this.state.isFinalUnlocked()) {
      this.audio.deny();
      var msg = this.state.data.secretUnlocked
        ? 'Read the secret letter first. It is quite important. No, really.'
        : 'The final challenge unlocks once the Secret Folder is open.';
      LOVE.Dialog.open({
        title: 'LOCKED',
        icon: '🔒',
        message: msg,
        buttons: [{ label: 'OK', value: 'ok', primary: true }]
      });
      return;
    }
    var id = 'finalchallenge';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Final Challenge', icon: '🏆',
      width: 460, height: 470, x: 130, y: 30
    });
    win.open();
    new LOVE.FinalChallenge(win, this);
  }

  openMemories() {
    LOVE.Memories.openExplorer(this);
  }

  openPhotos() {
    LOVE.Photos.open(this);
  }

  openPhotoFile(file) {
    LOVE.Photos.openPhotoFile(file, this);
  }

  openMusic() {
    var id = 'musicplayer';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Music - love daemon', icon: '🎵',
      width: 360, height: 320, x: 260, y: 60
    });
    win.setContent(LOVE.MainMenu.buildMusic(this));
    win.open();
  }

  openMyComputer() {
    var id = 'mycomputer';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var self = this;
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'My Computer', icon: '🖥️',
      width: 360, height: 300, x: 60, y: 60
    });
    win.setContent(LOVE.util.el('div', { class: 'file-list' }));

    var list = win.body.querySelector('.file-list');
    LOVE.config.myComputerDrives.forEach(function (drive) {
      var row = LOVE.util.el('button', { class: 'file-row' });
      row.appendChild(LOVE.util.el('span', { class: 'f-icon', 'aria-hidden': 'true' }, '💽'));
      var label = LOVE.util.el('span', { class: 'grow' });
      label.appendChild(document.createTextNode(drive.name + ' ' + drive.label));
      label.appendChild(LOVE.util.el('span', { class: 'dim' }, '   ' + drive.desc));
      row.appendChild(label);
      row.addEventListener('click', function () { self.openDrive(drive, win); });
      list.appendChild(row);
    });
    win.open();
    this.eggClicked('mycomputer');
  }

  openDrive(drive, parentWin) {
    var self = this;
    var win = new LOVE.Window({
      manager: this.wm,
      id: 'drive_' + drive.name.replace(':', ''),
      title: drive.name + '\\' + drive.label,
      icon: '📂',
      width: 330, height: 260,
      x: (parentWin ? parentWin.el.offsetLeft : 60) + 40,
      y: (parentWin ? parentWin.el.offsetTop : 60) + 30
    });

    var rows = [];
    if (drive.name === 'C:') {
      rows.push({ icon: '❤️', label: 'LOVE.EXE', action: function () { self.openLoveExe(); } });
      rows.push({ icon: '📝', label: 'memories.dat', action: function () { self.openMemories(); } });
      rows.push({ icon: '🎨', label: 'ms_paint.exe', action: function () { self.openPaint(); } });
      rows.push({ icon: '🖼️', label: 'gallery.exe', action: function () { self.openGallery(); } });
      rows.push({ icon: '🧮', label: 'calc.exe', action: function () { self.openCalculator(); } });
    } else if (drive.name === 'D:') {
      rows.push({ icon: '📄', label: 'memory_01.txt', action: function () { self.openFileNotepad('memory_01.txt'); } });
      rows.push({ icon: '🖼️', label: 'IMG_001.JPG', action: function () { self.openPhotos(); } });
    } else if (drive.name === 'E:') {
      rows.push({ icon: '💗', label: 'hearts.exe', action: function () { self.launchHearts(); } });
      rows.push({ icon: '🃏', label: 'memory_game.exe', action: function () { self.launchMemory(); } });
      rows.push({ icon: '❓', label: 'quiz.exe', action: function () { self.launchQuiz(); } });
      rows.push({ icon: '🏆', label: 'final.exe', action: function () { self.launchFinal(); } });
      rows.push({ icon: '🎮', label: 'arcade.exe', action: function () { self.openGameRoom(); } });
      rows.push({ icon: '🏓', label: 'asoo_pong.exe', action: function () { self.launchLovePong(); } });
      rows.push({ icon: '🐍', label: 'heart_snake.exe', action: function () { self.launchDateSnake(); } });
      rows.push({ icon: '🔨', label: 'whack_a_love.exe', action: function () { self.launchWhackLove(); } });
      rows.push({ icon: '🎶', label: 'asoo_says.exe', action: function () { self.launchSimonLove(); } });
      rows.push({ icon: '🕳️', label: 'heartfield.exe', action: function () { self.launchLoveSweeper(); } });
    } else if (drive.name === 'F:') {
      rows.push({ icon: '💌', label: 'secret_love_letter.txt', action: function () { self.openSecret(); } });
      rows.push({ icon: '📄', label: 'important.txt', action: function () { self.openFileNotepad('important.txt'); } });
    }

    var list = LOVE.util.el('div', { class: 'file-list' });
    rows.forEach(function (r) {
      var row = LOVE.util.el('button', { class: 'file-row' });
      row.appendChild(LOVE.util.el('span', { class: 'f-icon', 'aria-hidden': 'true' }, r.icon));
      row.appendChild(document.createTextNode(r.label));
      row.addEventListener('click', function () { self.audio.click(); r.action(); });
      list.appendChild(row);
    });
    win.setContent(list);
    win.open();
  }

  openFileNotepad(file) {
    // support opening a personal memory file directly from a drive
    var mem = null;
    LOVE.config.memories.forEach(function (m) { if (m.file === file) mem = m; });
    if (!mem) mem = LOVE.config.importantNote;
    LOVE.Memories.openFile(this, mem, null);
  }

  openRecycle() {
    this.audio.click();
    var eggs = LOVE.config.easterEggs || [];
    var cfg = null;
    eggs.forEach(function (e) { if (e.target === 'recycle') cfg = e; });
    if (cfg && !this.firedEggs.recycle) {
      this.eggCounts.recycle = (this.eggCounts.recycle || 0) + 1;
      if (this.eggCounts.recycle === cfg.clicks) {
        this.firedEggs.recycle = true;
        this.audio.success();
        LOVE.Dialog.info('Recycle Bin', cfg.message, '🗑️');
        return;
      }
    }
    LOVE.Dialog.info('Recycle Bin', LOVE.util.pick(LOVE.config.recycleMessages), '🗑️');
  }

  openJunk() {
    LOVE.Dialog.open({
      title: 'Homework.exe',
      icon: '💤',
      isError: true,
      message: 'ERROR 404\nHomework.exe not found.\n\nProbably eaten by a love daemon. This is fine.',
      buttons: [{ label: 'OK', value: 'ok', primary: true }]
    });
  }

  openSecret() {
    var state = this.state;
    var d = state.data;
    var self = this;

    if (!d.secretUnlocked) {
      this.audio.deny();
      var checks = [
        { label: 'Catch 15 hearts', done: state.data.heartGameCompleted },
        { label: 'Complete memory game', done: state.data.memoryGameCompleted },
        { label: 'Answer 5 questions', done: state.data.quizCompleted }
      ];
      var checksHtml = checks.map(function (c) {
        return '<div class="' + (c.done ? 'ok' : 'no') + '">' + (c.done ? '✓ ' : '✗ ') + c.label + '</div>';
      }).join('');
      LOVE.Dialog.open({
        title: 'ACCESS DENIED',
        icon: '🔒',
        isError: true,
        html: true,
        message: 'This folder is protected by the LoveFirewall.<br><br>Complete more of the game to unlock it:<br><div class="checks">' + checksHtml + '</div>',
        buttons: [{ label: 'OK', value: 'ok', primary: true }]
      });
      return;
    }

    var id = 'secret_folder';
    if (this.wm.find(id)) { this.wm.focus(this.wm.find(id)); return; }
    var win = new LOVE.Window({
      manager: this.wm, id: id,
      title: 'Secret Folder', icon: '🗝️',
      width: 360, height: 260, x: 200, y: 60
    });
    var letterRow = LOVE.util.el('button', { class: 'file-row' });
    letterRow.appendChild(LOVE.util.el('span', { class: 'f-icon', 'aria-hidden': 'true' }, '💌'));
    var lbl = LOVE.util.el('span', { class: 'grow' });
    lbl.appendChild(document.createTextNode('secret_love_letter.txt'));
    if (d.secretLetterRead) lbl.appendChild(LOVE.util.el('span', { class: 'dim' }, '  (read)'));
    letterRow.appendChild(lbl);
    letterRow.addEventListener('click', function () {
      self.audio.click();
      self.openSecretLetter(win);
    });
    var list = LOVE.util.el('div', { class: 'file-list' });
    list.appendChild(letterRow);
    list.appendChild(LOVE.util.el('div', { class: 'dim mt8', style: 'padding:0 6px;font-size:10px;' }, 'this folder contains the most important file on this computer.'));
    win.setContent(list);
    win.open();
  }

  openSecretLetter(parentWin) {
    var d = this.state.data;
    var self = this;
    var text = 'SECRET LOVE LETTER\n--------------------\n\nTo the only person allowed in this folder:\n\nI hid this letter in an old pretend-computer because some things were never meant for modern technology. Some things belong in a dusty little folder, labeled secret, where only you would ever think to look.\n\nYou found it. Of course you found it. You always find me.\n\nThis folder is now unlocked forever.\n\n- me, permanently yours\n\nPS: the final challenge is waiting outside.';

    var win = new LOVE.Window({
      manager: this.wm,
      id: 'secret_letter',
      title: 'secret_love_letter.txt - Notepad',
      icon: '💌',
      width: 420, height: 380,
      x: 220, y: 60
    });
    var pad = LOVE.util.el('div', { class: 'notepad' });
    win.setContent(pad);
    LOVE.util.typewriter(pad, text, 18, function () {
      self.audio.success();
    });

    if (!d.secretLetterRead) {
      d.secretLetterRead = true;
      this.state.grantPiece('secret');
      this.save();
      this.desktopScreen.refresh();
    }
    win.open();
  }

  showAbout() {
    LOVE.Dialog.open({
      title: 'About LoveOS XP',
      icon: '🖥️',
      message: 'LoveOS XP\nVersion LOVE.2001\n\nA pretend-operating-system, secretly\nmade for one person in the world.\n\nThis copy is licensed to: ' + LOVE.config.girlfriendName + '\n\nNo computers were emotionally harmed.',
      buttons: [{ label: 'OK', value: 'ok', primary: true }]
    });
  }

  /* ---------------- ending / progress ---------------- */

  runEnding() {
    LOVE.Ending.run(this);
  }

  newGame(instant) {
    var self = this;
    var doReset = function () {
      LOVE.SaveSystem.clear();
      window.location.reload();
    };
    if (instant) {
      doReset();
      return;
    }
    LOVE.Dialog.confirm('New Game', 'Start everything over from the beginning? (your progress will be deleted)', 'Yes, start over', 'No, keep it').then(function (yes) {
      if (yes) { self.audio.click(); doReset(); }
    });
  }

  resetProgress() {
    var self = this;
    LOVE.Dialog.confirm('Reset Progress', 'Delete ALL saved progress and start fresh? This cannot be undone.', 'Reset', 'Cancel').then(function (yes) {
      if (yes) { self.audio.click(); self.newGame(true); }
    });
  }
};

/* ---------------- bootstrap ---------------- */
function bootstrapLoveOS() {
  try {
    var game = new LOVE.Game();
    window.LOVE.game = game;
    game.start();
  } catch (err) {
    console.error(err);
    var layer = document.getElementById('overlayLayer');
    if (layer) {
      var el = LOVE.util.el('div', { style: 'color:#ff0;font-family:monospace;padding:40px;' }, 'BOOT ERROR: ' + err.message);
      layer.appendChild(el);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapLoveOS);
} else {
  bootstrapLoveOS();
}

/* =============================================================
   EOF main.js
   ============================================================= */