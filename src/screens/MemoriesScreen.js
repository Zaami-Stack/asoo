/* =============================================================
   LOVE OS XP - Memories explorer (MEMORIES.DAT)
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.Memories = {
  /* open the memory file explorer window */
  openExplorer: function (game) {
    var id = 'memories_explorer';
    if (game.wm.find(id)) { game.wm.focus(game.wm.find(id)); return; }

    var win = new LOVE.Window({
      manager: game.wm,
      id: id,
      title: 'Memories - C:\\LOVE\\MEMORIES',
      icon: '📝',
      width: 470,
      height: 380,
      x: 120, y: 40
    });
    win.setContent(this.buildList(game, win));
    win.open();
  },

  buildList: function (game, win) {
    var cfg = LOVE.config;
    var d = game.state.data;
    var self = this;

    var box = LOVE.util.el('div', { class: 'file-list' });

    var files = [];
    cfg.memories.forEach(function (m) { files.push({ kind: 'text', data: m }); });
    files.push({ kind: 'photo', data: cfg.specialPhoto });
    files.push({ kind: 'important', data: cfg.importantNote });

    var rebuild = function () {
      box.innerHTML = '';
      files.forEach(function (f) {
        var viewed = f.kind === 'text' ? d.memoriesViewed.indexOf(f.data.file) !== -1
          : f.kind === 'important' ? d.memoriesViewed.indexOf(f.data.file) !== -1
          : f.kind === 'photo' ? d.memoriesViewed.indexOf('special_photo.jpg') !== -1
          : false;

        var row = LOVE.util.el('button', {
          class: 'file-row',
          'aria-label': 'open ' + f.data.file
        });
        var icon = viewed ? '✅' : (f.kind === 'photo' ? '🏞️' : '📄');
        row.appendChild(LOVE.util.el('span', { class: 'f-icon', 'aria-hidden': 'true' }, icon));
        var desc = LOVE.util.el('span', { class: 'grow' });
        desc.appendChild(document.createTextNode(f.data.file));
        if (viewed) desc.appendChild(LOVE.util.el('span', { class: 'dim' }, '  (viewed)'));
        row.appendChild(desc);

        row.addEventListener('click', function () {
          game.audio.click();
          if (f.kind === 'photo') {
            game.openPhotoFile(f.data.file);
          } else {
            self.openFile(game, f.data, rebuild);
          }
        });
        box.appendChild(row);
      });
    };

    rebuild();
    return box;
  },

  /* notepad-style viewer with typewriter effect */
  openFile: function (game, mem, rebuild) {
    var win = new LOVE.Window({
      manager: game.wm,
      id: 'notepad_' + mem.file,
      title: mem.file + ' - Notepad',
      icon: '📄',
      width: 400,
      height: 340,
      x: 200, y: 60,
      onClose: function () { if (rebuild) rebuild(); }
    });

    var body = win.body;
    var pad = LOVE.util.el('div', { class: 'notepad' });
    pad.style.height = 'calc(100% - 30px)';

    // menu bar: File > Skip typing
    var menu = LOVE.util.el('div', { class: 'win-menu' });
    var skipBtn = LOVE.util.el('button', { class: 'xp-btn', style: 'min-width:auto;padding:2px 8px;' }, 'Skip typing');
    menu.appendChild(skipBtn);
    skipBtn.addEventListener('click', function () { if (typer) typer.done(); });

    var dateEl = LOVE.util.el('div', { style: 'font-size:10px;color:#777;padding:2px 6px;' }, mem.date || '');
    body.appendChild(menu);
    body.appendChild(dateEl);
    body.appendChild(pad);

    // typewriter effect
    var typer = null;
    setTimeout(function () {
      typer = LOVE.util.typewriter(pad, mem.text + '\n\n— ' + LOVE.config.girlfriendName + '\u0027s boyfriend.exe', 24, function () {
        game.audio.success();
      });
    }, 250);

    // mark as viewed + save
    if (game.state.markMemoryViewed(mem.file)) game.save();
    game.desktopScreen.refresh();

    win.open();
  }
};

/* =============================================================
   EOF MemoriesScreen.js
   ============================================================= */