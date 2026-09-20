/* =============================================================
   LOVE OS XP - desktop screen (wires desktop + taskbar together)
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.DesktopScreen = class DesktopScreen {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('desktopRoot');
    this.desktop = null;
    this.taskbar = null;
  }

  show() {
    this.desktop = new LOVE.Desktop(this.game, this.root);
    this.taskbar = new LOVE.Taskbar(this.game, this.root);

    var self = this;
    // taskbar reflects the open window list
    this.game.wm.onChange = function (windows) {
      var list = windows.filter(function (w) { return !w.isMinimized; });
      self.taskbar.setTasks(list);
    };

    this.applyWallpaper();
    this.birthdayCelebrate();
    this.game.audio.click();
  }

  /* sprinkles the birthday celebration over the desktop (once per session) */
  birthdayCelebrate() {
    var b = LOVE.config.birthday;
    if (!b || !b.enabled) return;
    if (this._celebrated) return;
    this._celebrated = true;
    var self = this;

    LOVE.FX.floatingHearts(this.desktop.elems.desk, 8);

    // dismissable banner pinned to the top center
    var banner = LOVE.util.el('button', {
      class: 'bday-banner',
      'aria-label': 'birthday cake',
      title: 'happy birthday!'
    });
    banner.appendChild(LOVE.util.el('span', { class: 'bday-cake', 'aria-hidden': 'true' }, '🎂'));
    var text = LOVE.util.el('span', { class: 'bday-text' });
    text.textContent = LOVE.util.fill(b.banner, { name: LOVE.config.girlfriendName, age: b.age });
    banner.appendChild(text);
    banner.addEventListener('click', function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
      self.game.audio.birthday();
      LOVE.Dialog.info('Birthday Cake', LOVE.util.fill(b.cakeDialog, { name: LOVE.config.girlfriendName, age: b.age }), '🎂');
    });
    // gentle delay so the boot -> desktop handoff doesn't feel rushed
    setTimeout(function () {
      if (!self.root.contains(banner)) self.root.appendChild(banner);
    }, 350);
    // burst of confetti right as the desktop appears
    setTimeout(function () { LOVE.FX.confetti(self.root, 30); }, 500);
  }

  /* paint Asoo's drawing (if she set one) as the desktop background */
  applyWallpaper() {
    var wall = this.root.querySelector('.desktop-wall');
    var url = this.game.settings.wallpaper;
    if (!wall) return;
    if (url) {
      wall.style.backgroundImage = 'url("' + url + '")';
      wall.classList.add('on');
    } else {
      wall.style.backgroundImage = '';
      wall.classList.remove('on');
    }
  }

  /* refresh icon badges and taskbar status after state changes */
  refresh() {
    if (this.desktop) this.desktop.refresh();
    if (this.taskbar) this.taskbar.refreshPieces();
  }

  /* open the welcome flow on a brand-new game */
  showWelcome(game) {
    var cfg = LOVE.config;

    // intro dialogue, line by line
    var chain = Promise.resolve();
    if (cfg.birthday && cfg.birthday.enabled) {
      chain = chain.then(function () {
        return LOVE.Dialog.info('SYSTEM', LOVE.util.fill(cfg.birthday.cakeDialog, { name: cfg.girlfriendName, age: cfg.birthday.age }), '🎂');
      });
    }
    cfg.introLines.forEach(function (line) {
      chain = chain.then(function () {
        return LOVE.Dialog.info('SYSTEM', line, '🤖');
      });
    });

    chain = chain.then(function () {
      return LOVE.Dialog.choice(
        'SYSTEM',
        String(cfg.introChoices.map(function (c) { return c.label; }).map(function (l, i) { return (i + 1) + '. ' + l; }).join('\n\n')),
        cfg.introChoices.map(function (c, i) { return { label: c.label, value: String(i) }; })
      );
    });

    chain = chain.then(function (idx) {
      var choice = cfg.introChoices[Number(idx)];
      return LOVE.Dialog.info('SYSTEM', (choice ? choice.reply : 'Hmm. I will accept that answer anyway.') + '\n\nIdentity confirmed.\nWelcome to your computer, ' + cfg.girlfriendName + '.', '💖');
    });

    chain = chain.then(function () {
      var d = game.state.data;
      d.started = true;
      d.score += 50;
      game.state.updateUnlocks();
      game.save();
      game.openLoveExe();
    });

    return chain;
  }
};

/* =============================================================
   EOF DesktopScreen.js
   ============================================================= */