/* =============================================================
   LOVE OS XP - window manager
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.WindowManager = class WindowManager {
  constructor(layer) {
    this.layer = layer;
    this.windows = [];
    this.nextZ = 50;
    this.onChange = null;          // callback(list of windows)
    this.singletons = {};          // map id -> Window for one-at-a-time apps
  }

  scale() {
    var rect = this.layer.getBoundingClientRect();
    return rect.width > 0 ? rect.width / 1024 : 1;
  }

  width() { return 1024; }
  height() { return 640; }

  /* translate a client X/Y into viewport (unscaled 1024x640) coords */
  toLocalX(clientX) {
    var rect = this.layer.getBoundingClientRect();
    return (clientX - rect.left) / this.scale();
  }
  toLocalY(clientY) {
    var rect = this.layer.getBoundingClientRect();
    return (clientY - rect.top) / this.scale();
  }

  /* does a window with this id already exist? if yes, focus + return it */
  find(id) {
    for (var i = 0; i < this.windows.length; i++) {
      if (this.windows[i].id === id) return this.windows[i];
    }
    return null;
  }

  open(win) {
    if (this.find(win.id)) {
      this.focus(this.find(win.id));
      if (this.find(win.id).isMinimized) this.restore(this.find(win.id));
      return this.find(win.id);
    }
    this.windows.push(win);
    this.layer.appendChild(win.el);
    if (win.x == null) win.x = 40 + (this.windows.length % 6) * 34;
    if (win.y == null) win.y = 20 + (this.windows.length % 5) * 26;
    win.el.style.left = LOVE.util.clamp(win.x, 4, this.width() - win.width - 4) + 'px';
    win.el.style.top = LOVE.util.clamp(win.y, 4, this.height() - win.height - 4) + 'px';
    this.focus(win);
    this.emit();
    return win;
  }

  focus(win) {
    win.el.style.zIndex = ++this.nextZ;
    var i;
    for (i = 0; i < this.windows.length; i++) {
      this.windows[i].el.classList.toggle('win-active', this.windows[i] === win);
    }
  }

  close(win) {
    var idx = this.windows.indexOf(win);
    if (idx === -1) return;
    this.windows.splice(idx, 1);
    if (win.el.parentNode) win.el.parentNode.removeChild(win.el);
    this.emit();
  }

  minimize(win) {
    if (!win.isMinimized) {
      win.isMinimized = true;
      win.el.style.display = 'none';
      this.emit();
    }
  }

  restore(win) {
    if (!win.isMinimized) return;
    win.isMinimized = false;
    win.el.style.display = 'flex';
    this.focus(win);
    this.emit();
  }

  /* close all windows (used on new game / reset) */
  closeAll() {
    var self = this;
    this.windows.slice().forEach(function (w) { self.close(w); });
    this.singletons = {};
  }

  emit() {
    if (this.onChange) this.onChange(this.windows.slice());
  }

  /* register a singleton window (one instance per app id) */
  makeSingleton(id) { this.singletons[id] = true; }
};

/* =============================================================
   EOF WindowManager.js
   ============================================================= */