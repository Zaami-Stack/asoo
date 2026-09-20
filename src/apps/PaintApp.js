/* =============================================================
   LOVE OS XP - MS Paint mini
   Asoo can draw, pick colors, erase, and save to her Gallery.
   She can even set a drawing as the desktop wallpaper.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.PaintApp = class PaintApp {
  constructor(win, game) {
    this.win = win;
    this.game = game;

    this.W = 400;
    this.H = 250;
    this.color = '#ff4d7e';
    this.tool = 'pencil';
    this.size = 4;
    this.drawing = false;
    this.last = null;

    this.PALETTE = ['#000000', '#ffffff', '#ff4d7e', '#ff2e63', '#7b43d8',
      '#3aa7ff', '#3ddad7', '#27c23a', '#ffd166', '#ff9a3d', '#b06a3c', '#c8d2de'];

    this.build();
    this.bind();
  }

  build() {
    var win = this.win;
    var self = this;

    var toolbar = LOVE.util.el('div', { class: 'paint-toolbar' });

    // tools
    var tools = LOVE.util.el('div', { class: 'paint-group' });
    this.toolBtn = {};
    [['pencil', '✏️ Pencil'], ['eraser', '🩹 Eraser']].forEach(function (t) {
      var b = LOVE.util.el('button', { class: 'xp-btn', 'aria-label': t[0] }, t[1]);
      b.addEventListener('click', function () { self.pickTool(t[0]); });
      tools.appendChild(b);
      self.toolBtn[t[0]] = b;
    });
    toolbar.appendChild(tools);

    // sizes
    var sizes = LOVE.util.el('div', { class: 'paint-group' });
    [2, 5, 9, 16].forEach(function (s) {
      var b = LOVE.util.el('button', { class: 'xp-btn paint-size' + (s === 4 ? ' on' : ''), 'aria-label': 'size ' + s }, '■');
      b.style.fontSize = (6 + s) + 'px';
      b.setAttribute('data-size', s);
      b.addEventListener('click', function () { self.pickSize(s); });
      sizes.appendChild(b);
    });
    toolbar.appendChild(sizes);

    // palette
    var pal = LOVE.util.el('div', { class: 'paint-palette' });
    this.PALETTE.forEach(function (c, i) {
      var sw = LOVE.util.el('button', {
        class: 'paint-swatch' + (c === '#ff4d7e' ? ' on' : ''),
        style: 'background:' + c + ';',
        'aria-label': 'color ' + c
      });
      sw.addEventListener('click', function () { self.pickColor(c); });
      pal.appendChild(sw);
    });
    toolbar.appendChild(pal);

    // actions
    var acts = LOVE.util.el('div', { class: 'paint-group' });
    var clearBtn = LOVE.util.el('button', { class: 'xp-btn' }, '🗑 Clear');
    clearBtn.addEventListener('click', function () { self.clearCanvas(); });
    acts.appendChild(clearBtn);
    toolbar.appendChild(acts);

    win.body.appendChild(toolbar);

    var stage = LOVE.util.el('div', { class: 'paint-stage' });
    var canvas = LOVE.util.el('canvas', { class: 'paint-canvas', width: this.W, height: this.H });
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    stage.appendChild(canvas);
    win.body.appendChild(stage);

    // save row
    var saveRow = LOVE.util.el('div', { class: 'paint-save' });
    var nameInput = LOVE.util.el('input', { type: 'text', placeholder: 'Name your painting...', maxlength: '40', value: 'Asoo\u0027s drawing' });
    this.nameInput = nameInput;
    var saveBtn = LOVE.util.el('button', { class: 'xp-btn primary' }, '💾 Save to Gallery');
    var wallBtn = LOVE.util.el('button', { class: 'xp-btn' }, '🖼 Set as desktop');
    saveRow.appendChild(nameInput);
    saveRow.appendChild(saveBtn);
    saveRow.appendChild(wallBtn);
    win.body.appendChild(saveRow);

    var that = this;
    saveBtn.addEventListener('click', function () { that.saveToGallery(false); });
    wallBtn.addEventListener('click', function () { that.saveToGallery(true); });

    this.fill();
  }

  fill() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.W, this.H);
  }

  clearCanvas() {
    this.game.audio.flip();
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.fill();
  }

  pickTool(t) {
    var self = this;
    this.tool = t;
    this.game.audio.click();
    Object.keys(this.toolBtn).forEach(function (k) {
      self.toolBtn[k].classList.toggle('on', k === self.tool);
    });
  }

  pickSize(s) {
    var self = this;
    this.size = s;
    this.game.audio.click();
    this.win.body.querySelectorAll('.xp-btn.paint-size').forEach(function (b) {
      b.classList.toggle('on', Number(b.getAttribute('data-size')) === self.size);
    });
  }

  pickColor(c) {
    var self = this;
    this.color = c;
    this.game.audio.click();
    this.win.body.querySelectorAll('.paint-swatch').forEach(function (sw) {
      sw.classList.toggle('on', sw.style.background === self.color);
    });
  }

  bind() {
    var self = this;
    var c = this.canvas;
    c.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      self.drawing = true;
      self.last = self.xy(e);
      self.paintAt(self.last.x, self.last.y);
    });
    c.addEventListener('pointermove', function (e) {
      if (!self.drawing) return;
      var p = self.xy(e);
      self.lineTo(self.last, p);
      self.last = p;
    });
    c.addEventListener('pointerup', function () { self.drawing = false; self.last = null; });
    c.addEventListener('pointercancel', function () { self.drawing = false; self.last = null; });

    var win = this.win;
    var origClose = win.onClose;
    win.onClose = function () {
      self.destroy();
      if (origClose) origClose();
    };
  }

  destroy() {
    this.destroyed = true;
  }

  xy(e) {
    var rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.W / rect.width),
      y: (e.clientY - rect.top) * (this.H / rect.height)
    };
  }

  paintAt(x, y) {
    var ctx = this.ctx;
    if (this.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  lineTo(a, b) {
    var ctx = this.ctx;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (this.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.color;
    }
  }

  /* snapshot the canvas as a data URL; empty guard */
  snapshot() {
    if (this.canvas.toDataURL) {
      try { return this.canvas.toDataURL('image/png'); } catch (e) { return null; }
    }
    return null;
  }

  saveToGallery(asWallpaper) {
    var url = this.snapshot();
    if (!url) {
      this.game.audio.error();
      LOVE.Dialog.info('Paint', 'Hmm, the painting could not be captured. Try again?', '🎨');
      return;
    }
    var name = (this.nameInput.value || 'Untitled').trim().slice(0, 40) || 'Asoo\u0027s drawing';
    var list = LOVE.Drawings.add({ name: name, url: url, date: new Date().toLocaleString() });
    this.game.audio.success();

    if (asWallpaper) {
      this.game.setWallpaper(url);
      LOVE.Dialog.info('Paint', 'This painting is now your desktop wallpaper. The whole OS is officially your art gallery.', '🖼️');
      return;
    }
    LOVE.Dialog.info('Paint', 'Saved to the Gallery (' + list.length + ' painting' + (list.length === 1 ? '' : 's') + ' now). Open the Gallery on your desktop to see them.', '💾');
  }
};

/* =============================================================
   EOF PaintApp.js
   ============================================================= */