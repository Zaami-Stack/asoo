/* =============================================================
   LOVE OS XP - Calculator
   A small Windows-XP style calculator. Immediate-execution math
   (no eval), so it is safe and predictable.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.CalculatorApp = class CalculatorApp {
  constructor(win, game) {
    this.win = win;
    this.game = game;

    this.acc = null;    // pending accumulator
    this.op = null;     // pending operator
    this.entry = '0';   // current entry string
    this.fresh = true;  // next digit replaces entry

    this.build();
    this.bindKeys();
  }

  build() {
    var win = this.win;
    var self = this;

    this.display = LOVE.util.el('div', { class: 'calc-display' }, '0');
    win.body.appendChild(this.display);

    var pad = LOVE.util.el('div', { class: 'calc-pad' });
    var keys = [
      ['C', 'op'], ['CE', 'op'], ['\u00b1', 'op'], ['%', 'op'],
      ['7', 'num'], ['8', 'num'], ['9', 'num'], ['\u00f7', 'op'],
      ['4', 'num'], ['5', 'num'], ['6', 'num'], ['\u00d7', 'op'],
      ['1', 'num'], ['2', 'num'], ['3', 'num'], ['\u2212', 'op'],
      ['0', 'num'], ['.', 'num'], ['=', 'eq'], ['+', 'op']
    ];

    keys.forEach(function (k) {
      var b = LOVE.util.el('button', { class: 'xp-btn calc-key ' + k[1], 'aria-label': k[0] }, k[0]);
      b.addEventListener('click', function () { self.press(k[0], k[1]); });
      pad.appendChild(b);
    });
    win.body.appendChild(pad);
  }

  bindKeys() {
    var self = this;
    this.win.el.addEventListener('keydown', function (e) {
      var key = e.key;
      if (/^[0-9]$/.test(key)) self.press(key, 'num');
      else if (key === '.') self.press('.', 'num');
      else if (key === '+') self.press('+', 'op');
      else if (key === '-') self.press('\u2212', 'op');
      else if (key === '*') self.press('\u00d7', 'op');
      else if (key === '/') { e.preventDefault(); self.press('\u00f7', 'op'); }
      else if (key === 'Enter') { e.preventDefault(); self.press('=', 'eq'); }
      else if (key === 'Escape') self.press('C', 'op');
      else if (key === 'Backspace') { e.preventDefault(); self.press('CE', 'op'); }
    });
  }

  setDisplay(v) {
    this.entry = String(v);
    this.display.textContent = this.entry;
  }

  press(label, kind) {
    this.game.audio.click();
    if (kind === 'num') {
if (label === '.') {
        if (this.fresh || this.entry === '0') {
          this.setDisplay('0.');
          this.fresh = false;
          return;
        }
        if (this.entry.indexOf('.') === -1) this.setDisplay(this.entry + '.');
        return;
      }
      if (this.fresh || this.entry === '0') {
        this.setDisplay(label);
      } else {
        if (this.entry.length < 15) this.setDisplay(this.entry + label);
      }
      this.fresh = false;
      return;
    }

    if (label === 'C') { this.acc = null; this.op = null; this.fresh = true; this.setDisplay('0'); return; }
    if (label === 'CE') { this.fresh = true; this.setDisplay('0'); return; }
    if (label === '\u00b1') { this.setDisplay(this.negate(this.entry)); return; }
    if (label === '%') { this.setDisplay(String(parseFloat(this.entry || '0') / 100)); return; }
    if (label === '=') { this.solve(); return; }

    // binary operator
    if (this.op && !this.fresh) this.solve();
    this.acc = parseFloat(this.entry || '0');
    this.op = label;
    this.fresh = true;
  }

  negate(v) {
    var n = parseFloat(v || '0');
    return String(isNaN(n) ? 0 : (v.charAt(0) === '-' ? v.slice(1) : '-' + v));
  }

  solve() {
    if (this.op == null || this.acc == null) return;
    var b = parseFloat(this.entry || '0');
    var a = this.acc;
    var r;
    if (this.op === '+') r = a + b;
    else if (this.op === '\u2212') r = a - b;
    else if (this.op === '\u00d7') r = a * b;
    else if (this.op === '\u00f7') { r = (b === 0) ? NaN : a / b; }
    this.acc = null;
    this.op = null;
    this.fresh = true;
    this.setDisplay(isNaN(r) ? 'Err' : this.fmt(r));
  }

  fmt(v) {
    var s = String(Math.round(v * 1e12) / 1e12);
    if (s.length > 15) return v.toExponential(8);
    return s;
  }
};

/* =============================================================
   EOF CalculatorApp.js
   ============================================================= */