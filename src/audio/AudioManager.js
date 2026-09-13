/* =============================================================
   LOVE OS XP - audio manager
   All sounds are synthesized with the Web Audio API, so there
   are no audio files to download.

   Music: a multi-song player. The songs live in
   LOVE.config.musicTracks (each with tune / bass / tempo /
   title / artist). Every song is composed by note names so it
   can be edited easily. Built for the one and only player: Asoo.

   Audio only starts after the player's first click/tap (browser
   rule), and the game works fine with sound off.
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.AudioManager = class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.musicOn = true;
    this.musicTimer = null;
    this.musicStep = 0;
    this.track = 0;
  }

  /* note-name -> frequency map (C2..C6) so songs read nicely */
  static get NOTE() {
    if (LOVE.AudioManager._note) return LOVE.AudioManager._note;
    var names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    var map = {};
    for (var oct = 2; oct <= 6; oct++) {
      for (var i = 0; i < 12; i++) {
        map[names[i] + oct] = 65.406 * Math.pow(2, oct - 2 + i / 12);
      }
    }
    LOVE.AudioManager._note = map;
    return map;
  }

  /* turn a note name into a frequency. 0 for rests. */
  noteToFreq(n) {
    if (n == null) return 0;
    if (n === 'R' || n === '0' || n === '-') return 0;
    var f = LOVE.AudioManager.NOTE[n];
    return f || 0;
  }

  /* create (and unlock) the audio context. Safe to call many times. */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* called on the player's first real gesture - browsers require it */
  unlock() {
    if (!this.ensure()) return;
    if (this.musicOn && !this.musicTimer) this.startMusic();
  }

  /* play one note */
  tone(freq, dur, opts) {
    opts = opts || {};
    if (!this.ctx) return;
    var t0 = this.ctx.currentTime + (opts.when || 0);
    var type = opts.type || 'square';
    var gain = opts.gain != null ? opts.gain : 0.25;
    var osc = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.slideTo), t0 + dur);
    }
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(opts.dest || this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /* ---------------- UI sounds ---------------- */
  click() {
    if (!this.ensure()) return;
    this.tone(620, 0.05, { gain: 0.12 });
    this.tone(940, 0.04, { gain: 0.09, when: 0.02 });
  }

  hover() {
    if (!this.ensure()) return;
    this.tone(500, 0.03, { gain: 0.05 });
  }

  error() {
    if (!this.ensure()) return;
    this.tone(220, 0.18, { type: 'sawtooth', gain: 0.18, slideTo: 120 });
    this.tone(160, 0.22, { type: 'square', gain: 0.12, when: 0.08, slideTo: 90 });
  }

  deny() {
    if (!this.ensure()) return;
    this.tone(400, 0.1, { gain: 0.16, slideTo: 320 });
    this.tone(280, 0.12, { gain: 0.14, when: 0.08, slideTo: 220 });
  }

  success() {
    if (!this.ensure()) return;
    [523, 659, 784, 1047].forEach(function (f, i) {
      this.tone(f, 0.14, { gain: 0.16, when: i * 0.09 });
    }, this);
  }

  flip() {
    if (!this.ensure()) return;
    this.tone(1100, 0.05, { gain: 0.1 });
    this.tone(700, 0.03, { gain: 0.07, when: 0.02 });
  }

  catchHeart() {
    if (!this.ensure()) return;
    this.tone(880, 0.09, { gain: 0.16 });
    this.tone(1320, 0.12, { gain: 0.12, when: 0.06 });
  }

  brokenHeart() {
    if (!this.ensure()) return;
    this.tone(180, 0.15, { type: 'sawtooth', gain: 0.15, slideTo: 90 });
    this.tone(110, 0.2, { type: 'square', gain: 0.1, when: 0.05 });
  }

  win() {
    if (!this.ensure()) return;
    var seq = [392, 523, 659, 784, 1047];
    seq.forEach(function (f, i) { this.tone(f, 0.22, { gain: 0.18, when: i * 0.13 }); }, this);
    this.tone(1319, 0.4, { gain: 0.12, when: 0.66 });
  }

  startup() {
    if (!this.ensure()) return;
    [523, 659, 784].forEach(function (f, i) { this.tone(f, 0.35, { gain: 0.14, when: i * 0.12 }); }, this);
  }

  /* ---------------- music engine ---------------- */
  songTone(freq, dur, type, gain) {
    if (!this.ctx) return;
    var t0 = this.ctx.currentTime;
    var osc = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.5, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /* the song object currently selected */
  currentSong() {
    var tracks = LOVE.config.musicTracks || [];
    if (!tracks.length) return null;
    return tracks[this.track % tracks.length];
  }

  /* start the music interval for the current song. safe to call repeatedly. */
  startMusic() {
    if (!this.ensure()) return false;
    if (this.musicTimer) return true;
    var song = this.currentSong();
    if (!song) return false;
    var tune = song.tune || [];
    if (!tune.length) return false;
    var stepDur = (song.tempo || 240) / 1000;
    var bass = song.bass || [];
    var self = this;
    this.musicStep = 0;
    this.musicTimer = setInterval(function () {
      var n = tune[self.musicStep % tune.length];
      if (n) self.songTone(self.noteToFreq(n), stepDur * 0.9, 'square', 0.42);
      if (bass.length && self.musicStep % 4 === 0) {
        var b = bass[(self.musicStep / 4) % bass.length];
        if (b) self.songTone(self.noteToFreq(b), stepDur * 3.6, 'triangle', 0.3);
      }
      self.musicStep += 1;
    }, stepDur * 1000);
    return true;
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /* pick a song by index (wraps). Switches even while playing. */
  playSong(idx) {
    var tracks = LOVE.config.musicTracks || [];
    var n = tracks.length || 1;
    this.track = ((idx % n) + n) % n;
    this.stopMusic();
    this.musicStep = 0;
    this.startMusic();
    return this.track;
  }

  nextTrack() {
    return this.playSong(this.track + 1);
  }

  prevTrack() {
    return this.playSong(this.track - 1);
  }

  pauseMusic() {
    this.stopMusic();
  }

  isPlaying() {
    return !!this.musicTimer;
  }

  /* master toggle, also persisted via game settings */
  setMusic(on) {
    this.musicOn = !!on;
    if (!on) {
      this.stopMusic();
      return on;
    }
    this.startMusic();
    return on;
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) { /* ignore */ }
      this.ctx = null;
    }
  }
};

/* =============================================================
   EOF AudioManager.js
   ============================================================= */