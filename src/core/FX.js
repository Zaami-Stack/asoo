/* =============================================================
   LOVE OS XP - lightweight visual effects
   Confetti and floating hearts for the birthday celebration.
   Cheap: a handful of absolutely-positioned spans animated with
   CSS, cleaned up after they fall. No frames, no library.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.FX = {

  /* burst of falling birthday confetti over a container */
  confetti: function (container, count) {
    count = count || 34;
    var emojis = ['🎂', '🎈', '💖', '✨', '🌸', '🎉', '💝', '⭐'];
    for (var i = 0; i < count; i++) {
      (function () {
        var el = LOVE.util.el('span', { class: 'fx-confetti', 'aria-hidden': 'true' }, LOVE.util.pick(emojis));
        el.style.left = LOVE.util.random(2, 1000) + 'px';
        el.style.fontSize = LOVE.util.random(13, 26) + 'px';
        el.style.animationDuration = LOVE.util.random(2.6, 4.6) + 's';
        el.style.animationDelay = LOVE.util.random(0, 0.8) + 's';
        container.appendChild(el);
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 5600);
      })();
    }
  },

  /* gentle hearts drifting up the desktop background (behind windows) */
  floatingHearts: function (container, count) {
    count = count || 7;
    var emojis = ['💗', '💞', '💓', '💕'];
    for (var i = 0; i < count; i++) {
      (function () {
        var el = LOVE.util.el('span', { class: 'fx-heart', 'aria-hidden': 'true' }, LOVE.util.pick(emojis));
        el.style.left = LOVE.util.random(4, 980) + 'px';
        el.style.fontSize = LOVE.util.random(12, 22) + 'px';
        el.style.animationDuration = LOVE.util.random(9, 16) + 's';
        el.style.animationDelay = LOVE.util.random(0, 8) + 's';
        container.appendChild(el);
      })();
    }
  }
};

/* =============================================================
   EOF FX.js
   ============================================================= */