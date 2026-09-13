/* =============================================================
   LOVE OS XP - My Pictures gallery
   Shows every drawing Asoo saved from Paint. She can open a
   drawing full-size, make it the desktop wallpaper, or delete it.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.GalleryApp = class GalleryApp {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.build();
  }

  build() {
    var win = this.win;
    var self = this;

    var head = LOVE.util.el('div', { class: 'gal-head' });
    this.countEl = LOVE.util.el('span', { class: 'gal-count' });
    head.appendChild(this.countEl);
    var openPaint = LOVE.util.el('button', { class: 'xp-btn' }, 'Open Paint');
    openPaint.addEventListener('click', function () { self.game.openPaint(); });
    head.appendChild(openPaint);
    win.body.appendChild(head);

    this.grid = LOVE.util.el('div', { class: 'gal-grid' });
    win.body.appendChild(this.grid);

    this.render();
  }

  render() {
    var self = this;
    var list = LOVE.Drawings.get();
    this.grid.innerHTML = '';
    this.grid.style.display = '';
    this.countEl.textContent = list.length + ' painting' + (list.length === 1 ? '' : 's');

    if (!list.length) {
      var empty = LOVE.util.el('div', { class: 'gal-empty' });
      empty.appendChild(LOVE.util.el('div', { class: 'gal-empty-ghost' }, '🖼️'));
      empty.appendChild(LOVE.util.el('p', {}, 'No paintings yet. Open Paint and draw something lovely for Asoo.'));
      this.grid.appendChild(empty);
      return;
    }

    function makeCell(d) {
      var cell = LOVE.util.el('div', { class: 'gal-cell' });
      var img = LOVE.util.el('img', { src: d.url, alt: d.name });
      cell.appendChild(img);
      cell.appendChild(LOVE.util.el('div', { class: 'gal-name' }, d.name));
      cell.appendChild(LOVE.util.el('div', { class: 'gal-date' }, d.date));
      cell.addEventListener('click', function () { self.view(d); });
      return cell;
    }

    list.forEach(function (d) { self.grid.appendChild(makeCell(d)); });
  }

  view(d) {
    var self = this;
    this.currentId = d.id;
    this.grid.innerHTML = '';
    this.grid.style.display = '';

    var big = LOVE.util.el('div', { class: 'gal-big' });
    var img = LOVE.util.el('img', { src: d.url, alt: d.name });
    big.appendChild(img);
    this.grid.appendChild(big);

    this.grid.appendChild(LOVE.util.el('div', { class: 'gal-name' }, d.name));
    this.grid.appendChild(LOVE.util.el('div', { class: 'gal-date' }, 'Painted: ' + d.date));

    var row = LOVE.util.el('div', { class: 'gal-actions' });
    var back = LOVE.util.el('button', { class: 'xp-btn' }, 'Back to gallery');
    back.addEventListener('click', function () { self.render(); });
    row.appendChild(back);

    var wall = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Set as desktop');
    wall.addEventListener('click', function () { self.setWall(d); });
    row.appendChild(wall);

    var del = LOVE.util.el('button', { class: 'xp-btn danger' }, 'Delete');
    del.addEventListener('click', function () { self.del(d); });
    row.appendChild(del);

    this.grid.appendChild(row);
  }

  setWall(d) {
    this.game.setWallpaper(d.url);
    LOVE.Dialog.info('My Pictures', 'This painting is now your desktop wallpaper. Your art, your OS.', '🖼️');
  }

  del(d) {
    var self = this;
    var list = LOVE.Drawings.get();
    var target = list.filter(function (x) { return x.id === d.id; })[0];
    if (!target) return;
    LOVE.Dialog.choice(
      'My Pictures',
      'Delete "' + target.name + '" forever?',
      [{ label: 'Delete', value: '1' }, { label: 'Keep it', value: '0' }]
    ).then(function (v) {
      if (v !== '1') return;
      LOVE.Drawings.remove(d.id);
      self.game.audio.success();
      self.render();
    });
  }
};

/* =============================================================
   EOF GalleryApp.js
   ============================================================= */