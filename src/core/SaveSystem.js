/* =============================================================
   LOVE OS XP - save system (localStorage, fails silently offline)
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.SaveSystem = class SaveSystem {

  static get KEY() { return 'loveos_xp_save_v1'; }

  static supported() {
    try {
      var k = '__loveos_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* save(stateData, settings) -> bool */
  static save(stateData, settings) {
    if (!this.supported()) return false;
    try {
      window.localStorage.setItem(this.KEY, JSON.stringify({
        state: stateData,
        settings: settings || {},
        savedAt: Date.now()
      }));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* load() -> {state, settings} | null */
  static load() {
    if (!this.supported()) return null;
    try {
      var raw = window.localStorage.getItem(this.KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  static clear() {
    if (!this.supported()) return;
    try { window.localStorage.removeItem(this.KEY); } catch (e) { /* ignore */ }
  }
};

/* =============================================================
   EOF SaveSystem.js
   ============================================================= */