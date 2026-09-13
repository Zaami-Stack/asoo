/* =============================================================
   LOVE OS XP - boot sequence screen
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.BootScreen = class BootScreen {
  constructor() {
    this.handlers = [];
  }

  /*
    root   - element to mount into (#overlayLayer)
    opts   - { ask: boolean } show "Continue / New Game" if a save exists
    onDone - callback(mode) where mode is 'continue' | 'new'
  */
  show(root, opts, onDone) {
    var self = this;
    opts = opts || {};

    var screen = LOVE.util.el('div', { class: 'boot-screen', 'aria-label': 'boot sequence' });
    var title = LOVE.util.el('div', { class: 'boot-title' }, 'WINDOWS LOVE EDITION');
    var sub = LOVE.util.el('div', { class: 'boot-sub' }, LOVE.config.osName + ' - built with love.dll');
    var rows = LOVE.util.el('div', { class: 'boot-rows' });
    var barWrap = LOVE.util.el('div', { class: 'boot-bar-wrap' });
    var prog = LOVE.util.el('div', { class: 'prog' });
    var fill = LOVE.util.el('div', { class: 'fill' });
    prog.appendChild(fill);
    barWrap.appendChild(prog);
    var pct = LOVE.util.el('div', { class: 'boot-pct' }, '0%');
    var press = LOVE.util.el('div', { class: 'boot-press' }, '');

    screen.appendChild(title);
    screen.appendChild(sub);
    screen.appendChild(rows);
    screen.appendChild(barWrap);
    screen.appendChild(pct);
    screen.appendChild(press);
    root.appendChild(screen);

    var lines = LOVE.config.bootMessages;
    var stops = LOVE.config.bootStops;
    var delay = 420;
    var i = 0;
    var cursorEl = null;

    function addLine(text, isDone) {
      var line = LOVE.util.el('div', { class: 'line' + (isDone ? ' done' : '') }, text);
      rows.appendChild(line);
      return line;
    }

    function stepLine() {
      if (i >= lines.length) {
        finishProgress();
        return;
      }
      var line = addLine(lines[i]);
      cursorEl = line;
      // add blinking ">" cursor at end
      line.appendChild(LOVE.util.el('span', { class: 'blink' }, ' >'));
      fill.style.width = stops[i] + '%';
      pct.textContent = stops[i] + '%';
      i += 1;
      setTimeout(stepLine, delay);
    }

    function finishProgress() {
      setTimeout(function () {
        var cursor = (rows.lastChild && rows.lastChild.querySelector('.blink')) || null;
        if (cursor) cursor.remove();
        fill.style.width = '100%';
        pct.textContent = '100%';
        if (cursorEl) { var c = cursorEl.querySelector('.blink'); if (c) c.remove(); }
        goToContinue();
      }, 400);
    }

    var listeners = [];
    function addDoc(fn) { document.addEventListener(fn.event, fn.handler); listeners.push(fn); }

    function goToContinue() {
      press.textContent = '';
      press.appendChild(document.createTextNode('Press any key to continue...'));
      press.classList.add('blink');

      var once = function (e) {
        if (e.type === 'keydown' && (e.key === 'Alt' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta')) return;
        cleanupPress();
        afterPress();
      };
      function cleanupPress() {
        listeners.forEach(function (fn) {
          document.removeEventListener(fn.event, fn.handler);
        });
        listeners = [];
      }
      addDoc({ event: 'keydown', handler: once });
      addDoc({ event: 'click', handler: once });
      addDoc({ event: 'pointerdown', handler: once });
    }

    function afterPress() {
      close();
      if (opts.ask) {
        LOVE.Dialog.choice(
          LOVE.config.osName,
          'A previous session was found. What would you like to do?',
          [
            { label: 'Continue', value: 'continue' },
            { label: 'New Game', value: 'new' }
          ]
        ).then(function (choice) {
          onDone(choice === 'new' ? 'new' : 'continue');
        });
      } else {
        onDone('continue');
      }
    }

    function close() {
      if (screen.parentNode) screen.parentNode.removeChild(screen);
    }

    // small pause before typing starts, then go
    setTimeout(function () {
      if (opts.audio) opts.audio.startup();
    }, 120);
    setTimeout(stepLine, 600);
  }
};

/* =============================================================
   EOF BootScreen.js
   ============================================================= */