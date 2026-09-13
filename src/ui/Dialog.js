/* =============================================================
   LOVE OS XP - X P style message box / dialog
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.Dialog = class Dialog {

  /* open a modal message box. returns a Promise with the chosen
     button value (buttons get {label, value}). opts:
       title, message (string or array of lines), icon,
       buttons: [{label, value, primary}], width, closable   */
  static open(opts) {
    return new Promise(function (resolve) {
      var layer = document.getElementById('overlayLayer');
      if (!layer) return resolve(opts.cancelValue || 'close');

      var overlay = LOVE.util.el('div', { class: 'dlg-overlay' });
      var win = LOVE.util.el('div', { class: 'win dlg-win' });
      win.style.width = (opts.width || 360) + 'px';
      win.style.zIndex = 3000;
      if (opts.isError) win.classList.add('error');

      var tb = LOVE.util.el('div', { class: 'win-title' });
      tb.appendChild(LOVE.util.el('span', { class: 'win-icon', 'aria-hidden': 'true' }, opts.icon || '♥'));
      tb.appendChild(LOVE.util.el('span', { class: 'win-title-text' }, opts.title || 'Message'));
      tb.appendChild(LOVE.util.el('div', { class: 'win-buttons' }));
      win.appendChild(tb);

      var body = LOVE.util.el('div', { class: 'win-body dlg-body' });
      var msg = LOVE.util.el('div', { class: 'dlg-msg' });
      if (opts.icon) {
        msg.appendChild(LOVE.util.el('span', { class: 'dlg-icon', 'aria-hidden': 'true' }, opts.icon));
      }
      var msgText = opts.message;
      if (Array.isArray(msgText)) msgText = msgText.join('\n');
      var textEl = LOVE.util.el('span', { class: 'dlg-text' });
      if (opts.html) {
        textEl.innerHTML = msgText;
      } else {
        msgText.split('\n').forEach(function (line, i) {
          if (i > 0) textEl.appendChild(document.createElement('br'));
          textEl.appendChild(document.createTextNode(line));
        });
      }
      msg.appendChild(textEl);
      body.appendChild(msg);

      var row = LOVE.util.el('div', { class: 'dlg-buttons' });
      var finished = false;
      var finish = function (value) {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(value);
      };

      var buttons = opts.buttons || [{ label: 'OK', value: 'ok', primary: true }];
      buttons.forEach(function (b) {
        var btn = LOVE.util.el('button', { class: 'xp-btn' + (b.primary ? ' primary' : '') }, b.label);
        btn.addEventListener('click', function () { finish(b.value); });
        if (!b.primary) btn.tabIndex = 0;
        row.appendChild(btn);
      });
      body.appendChild(row);
      win.appendChild(body);
      overlay.appendChild(win);
      layer.appendChild(overlay);

      var onKey = function (e) {
        if (e.key === 'Escape' && opts.closable !== false) finish(opts.cancelValue || 'close');
        if (e.key === 'Enter') {
          var primary = buttons.filter(function (b) { return b.primary; })[0] || buttons[0];
          if (primary) finish(primary.value);
        }
      };
      document.addEventListener('keydown', onKey, true);

      var onOverlayClick = function (e) {
        if (e.target === overlay && opts.dismissOnBackdrop) finish(opts.cancelValue || 'close');
      };
      overlay.addEventListener('click', onOverlayClick);

      function cleanup() {
        document.removeEventListener('keydown', onKey, true);
        overlay.removeEventListener('click', onOverlayClick);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }

      // focus the primary button for keyboard vibes
      var toFocus = row.querySelector('.xp-btn.primary') || row.querySelector('.xp-btn');
      if (toFocus) setTimeout(function () { toFocus.focus(); }, 30);
    });
  }

  /* simple OK dialog */
  static info(title, message, icon) {
    return LOVE.Dialog.open({ title: title, message: message, icon: icon || '♥', buttons: [{ label: 'OK', value: 'ok', primary: true }] });
  }

  /* ok/cancel -> resolves true/false */
  static confirm(title, message, yesLabel, noLabel) {
    return LOVE.Dialog.open({
      title: title,
      message: message,
      icon: '❓',
      buttons: [
        { label: yesLabel || 'Yes', value: 'yes', primary: true },
        { label: noLabel || 'No', value: 'no' }
      ]
    }).then(function (v) { return v === 'yes'; });
  }

  /* multiple choice -> resolves chosen value */
  static choice(title, message, options) {
    var buttons = options.map(function (o, i) {
      return { label: o.label, value: o.value, primary: i === 0 };
    });
    return LOVE.Dialog.open({ title: title, message: message, icon: 'ℹ', buttons: buttons, width: 400 });
  }
};

/* =============================================================
   EOF Dialog.js
   ============================================================= */