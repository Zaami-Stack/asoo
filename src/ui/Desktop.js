/* =============================================================
   LOVE OS XP - desktop (background, icons, selection)
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.Desktop = class Desktop {
  constructor(game, container) {
    this.game = game;
    this.selected = null;
    this.isTouch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    this.build(container);
  }

  build(container) {
    var self = this;
    var desk = LOVE.util.el('div', { class: 'desktop' });
    desk.appendChild(LOVE.util.el('div', { class: 'desktop-wall' }));

    // clicking nothing = deselect (+ tiny easter-egg chance)
    desk.addEventListener('click', function (e) {
      if (e.target === desk) {
        self.clearSelection();
        self.game.eggClicked('desktop');
      }
    });
    desk.addEventListener('dblclick', function (e) {
      if (e.target === desk) { self.clearSelection(); }
    });

    this.elems = { desk: desk };
    container.appendChild(desk);
    this.renderIcons();
  }

  renderIcons() {
    var self = this;
    var desk = this.elems.desk;
    // remove old icons, keep background
    var oldIcons = desk.querySelectorAll('.desk-icon');
    oldIcons.forEach(function (o) { o.parentNode.removeChild(o); });
    this.icons = {};

    var conf = LOVE.config.desktopIcons;
    var colX = [10, 96];
    conf.forEach(function (ic, i) {
      var col = Math.floor(i / 5);
      var row = i % 5;
      var el = LOVE.util.el('button', {
        class: 'desk-icon',
        style: 'left:' + colX[col % 2] + 'px;top:' + (8 + row * 92) + 'px;',
        'aria-label': ic.label
      });
      el.appendChild(LOVE.util.el('span', { class: 'icon-img', 'aria-hidden': 'true' }, ic.icon));
      el.appendChild(LOVE.util.el('span', { class: 'icon-label' }, ic.label));

      el.addEventListener('click', function (e) {
        if (self.isTouch) {
          self.openIcon(ic);
          return;
        }
        self.selectIcon(ic, el);
        e.stopPropagation();
      });
      el.addEventListener('dblclick', function () { self.openIcon(ic); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.openIcon(ic);
      });

      desk.appendChild(el);
      self.icons[ic.id] = el;
    });
    this.refreshLockStates();
  }

  selectIcon(ic, el) {
    this.clearSelection();
    this.selected = ic.id;
    el.classList.add('selected');
  }

  clearSelection() {
    if (this.selected) {
      var prev = this.icons[this.selected];
      if (prev) prev.classList.remove('selected');
      this.selected = null;
    }
  }

  openIcon(ic) {
    this.clearSelection();
    this.game.audio.click();
    this.game.deskIconClicked(ic);
  }

  /* lock visual for the secret folder until it's unlocked */
  refreshLockStates() {
    var d = this.game.state.data;
    var secret = this.icons['secret'];
    if (secret) {
      secret.classList.toggle('locked', !d.secretUnlocked);
      var badge = secret.querySelector('.icon-badge');
      if (!d.secretUnlocked) {
        if (!badge) {
          badge = LOVE.util.el('span', { class: 'icon-badge' }, '🔒');
          secret.appendChild(badge);
        }
      } else if (badge) {
        badge.remove();
      }
    }
  }

  refresh() {
    this.refreshLockStates();
  }
};

/* =============================================================
   EOF Desktop.js
   ============================================================= */