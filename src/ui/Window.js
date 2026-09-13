/* =============================================================
   LOVE OS XP - reusable application window
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.Window = class Window {
  constructor(opts) {
    this.manager = opts.manager;
    this.id = opts.id || ('win_' + (++LOVE.util.winCounter));
    this.title = opts.title || 'Window';
    this.icon = opts.icon || '♥';
    this.width = opts.width || 420;
    this.height = opts.height || 320;
    this.x = opts.x;
    this.y = opts.y;
    this.closable = opts.closable !== false;
    this.minimizable = opts.minimizable !== false;
    this.maximizable = opts.maximizable !== false;
    this.onClose = opts.onClose || null;

    this.isMinimized = false;
    this.isMaximized = false;
    this.prevRect = null;

    var self = this;
    var win = LOVE.util.el('div', { class: 'win win-open', role: 'dialog' });
    this.el = win;

    // ---- title bar ----
    var tb = LOVE.util.el('div', { class: 'win-title' });
    this.iconEl = LOVE.util.el('span', { class: 'win-icon', 'aria-hidden': 'true' }, this.icon);
    this.titleEl = LOVE.util.el('span', { class: 'win-title-text' }, this.title);
    tb.appendChild(this.iconEl);
    tb.appendChild(this.titleEl);

    var buttons = LOVE.util.el('div', { class: 'win-buttons' });
    if (this.minimizable) {
      var minBtn = LOVE.util.el('button', { class: 'win-btn glyph-min', 'aria-label': 'Minimize' }, '–');
      minBtn.addEventListener('click', function (e) { e.stopPropagation(); self.manager.minimize(self); });
      buttons.appendChild(minBtn);
    }
    if (this.maximizable) {
      var maxBtn = LOVE.util.el('button', { class: 'win-btn glyph-max', 'aria-label': 'Maximize' }, '□');
      maxBtn.addEventListener('click', function (e) { e.stopPropagation(); self.toggleMaximize(); });
      buttons.appendChild(maxBtn);
    }
    if (this.closable) {
      var closeBtn = LOVE.util.el('button', { class: 'win-btn glyph-close', 'aria-label': 'Close' }, '✕');
      closeBtn.addEventListener('click', function (e) { e.stopPropagation(); self.close(); });
      buttons.appendChild(closeBtn);
    }
    tb.appendChild(buttons);

    // ---- body ----
    var body = LOVE.util.el('div', { class: 'win-body' });
    this.body = body;

    win.appendChild(tb);
    win.appendChild(body);

    // ---- placeholder size ----
    win.style.width = this.width + 'px';
    win.style.height = this.height + 'px';

    // ---- drag support (pointer events work for mouse & touch) ----
    var drag = null;
    tb.addEventListener('pointerdown', function (e) {
      if (e.target.classList.contains('win-btn')) return;
      self.manager.focus(self);
      drag = {
        sx: self.manager.toLocalX(e.clientX) - win.offsetLeft,
        sy: self.manager.toLocalY(e.clientY) - win.offsetTop
      };
      tb.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    tb.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var nx = LOVE.util.clamp(self.manager.toLocalX(e.clientX) - drag.sx, 4, self.manager.width() - win.offsetWidth - 4);
      var ny = LOVE.util.clamp(self.manager.toLocalY(e.clientY) - drag.sy, 4, self.manager.height() - win.offsetHeight - 4);
      win.style.left = nx + 'px';
      win.style.top = ny + 'px';
    });
    tb.addEventListener('pointerup', function () { drag = null; });
    tb.addEventListener('pointercancel', function () { drag = null; });

    // clicking anywhere on the window brings it to front
    win.addEventListener('pointerdown', function () { self.manager.focus(self); }, true);
  }

  /* fill the body from an element or a builder function */
  setContent(content) {
    var self = this;
    this.body.innerHTML = '';
    if (typeof content === 'function') {
      var result = content(this.body, this);
      if (result && result.nodeType) this.body.appendChild(result);
    } else if (content && content.nodeType) {
      this.body.appendChild(content);
    }
    // keep the focused element inside the window
    this.body._id = this.id;
  }

  setTitle(text) {
    this.title = text;
    this.titleEl.textContent = text;
  }

  setIcon(icon) {
    this.icon = icon;
    this.iconEl.textContent = icon;
  }

  open() {
    this.manager.open(this);
    return this;
  }

  focus() {
    this.manager.focus(this);
    return this;
  }

  close() {
    this.manager.close(this);
    if (this.onClose) this.onClose(this);
  }

  minimize() {
    this.manager.minimize(this);
  }

  restore() {
    this.manager.restore(this);
  }

  toggleMaximize() {
    if (this.isMaximized) {
      this.restoreRect();
    } else {
      this.maximize();
    }
  }

  maximize() {
    if (this.isMaximized) return;
    this.prevRect = { x: this.el.offsetLeft, y: this.el.offsetTop, w: this.el.offsetWidth, h: this.el.offsetHeight };
    var m = this.manager;
    this.isMaximized = true;
    this.el.style.left = '4px';
    this.el.style.top = '4px';
    this.el.style.width = (m.width() - 8) + 'px';
    this.el.style.height = (m.height() - 8) + 'px';
  }

  restoreRect() {
    if (!this.isMaximized) return;
    var r = this.prevRect || { x: 60, y: 40, w: this.width, h: this.height };
    this.isMaximized = false;
    this.el.style.left = r.x + 'px';
    this.el.style.top = r.y + 'px';
    this.el.style.width = r.w + 'px';
    this.el.style.height = r.h + 'px';
  }

  shake() {
    var self = this;
    this.el.classList.remove('shake');
    // force reflow so the animation restarts
    void this.el.offsetWidth;
    this.el.classList.add('shake');
    setTimeout(function () { self.el.classList.remove('shake'); }, 350);
  }
};

/* =============================================================
   EOF Window.js
   ============================================================= */