/* =============================================================
   LOVE OS XP - drawings gallery storage
   Asoo's paintings live in localStorage as small data-URLs.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.Drawings = {
  KEY: 'loveos_xp_drawings_v1',
  MAX: 30,

  get() {
    try {
      var raw = window.localStorage.getItem(this.KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      window.localStorage.setItem(this.KEY, JSON.stringify(list.slice(0, this.MAX)));
      return true;
    } catch (e) {
      return false;
    }
  },

  /* add a drawing { name, url, date } and return the new list */
  add(drawing) {
    var list = this.get();
    list.unshift({
      id: String(Date.now()),
      name: drawing.name || 'Untitled',
      url: drawing.url || '',
      date: drawing.date || new Date().toLocaleString()
    });
    this.save(list);
    return list;
  },

  remove(id) {
    var list = this.get().filter(function (d) { return d.id !== id; });
    this.save(list);
    return list;
  },

  count() {
    return this.get().length;
  }
};

/* =============================================================
   EOF Drawings.js
   ============================================================= */