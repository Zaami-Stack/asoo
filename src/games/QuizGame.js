/* =============================================================
   LOVE OS XP - Mini-game 3: Guess the Memory (quiz)
   ============================================================= */

window.LOVE = window.LOVE || {};

LOVE.QuizGame = class QuizGame {
  constructor(win, game) {
    this.win = win;
    this.game = game;
    this.stateData = game.state.data;

    this.questions = LOVE.config.quizQuestions.map(function (q) {
      // keep the real answer order; the displayed order (shownOrder)
      // is shuffled per round so the letter positions change each play
      return {
        question: q.question,
        answers: q.answers.slice(),
        correctAnswer: q.correctAnswer,
        wrongText: q.wrongText || 'Incorrect. Nice try.'
      };
    });
    this.idx = 0;
    this.correctCount = 0;
    this.finished = false;
    this.setupRoundData();
    this.build();
  }

  /* shuffle the answer order for the current question */
  setupRoundData() {
    var q = this.questions[this.idx];
    if (!q) return;
    var order = LOVE.util.shuffle(q.answers.map(function (_, i) { return i; }));
    q.shownOrder = order;
  }

  build() {
    var win = this.win;
    var self = this;

    var wrap = LOVE.util.el('div', { class: 'quiz-wrap' });
    this.qEl = LOVE.util.el('div', { class: 'quiz-q' });
    this.answersEl = LOVE.util.el('div', { class: 'quiz-answers' });
    this.fbEl = LOVE.util.el('div', { class: 'quiz-fb' });
    this.progressEl = LOVE.util.el('div', { class: 'quiz-progress' });

    wrap.appendChild(this.progressEl);
    wrap.appendChild(this.qEl);
    wrap.appendChild(this.answersEl);
    wrap.appendChild(this.fbEl);

    // result overlay
    this.msgEl = LOVE.util.el('div', { class: 'game-msg', style: 'display:none;' });
    win.body.appendChild(wrap);
    win.body.appendChild(this.msgEl);

    this.renderRound();
  }

  renderRound() {
    var self = this;
    var q = this.questions[this.idx];
    this.progressEl.textContent = 'question ' + (this.idx + 1) + ' of ' + this.questions.length;
    this.qEl.textContent = q.question;
    this.fbEl.textContent = '';
    this.answersEl.innerHTML = '';

    var letter = ['A', 'B', 'C', 'D'];
    q.shownOrder.forEach(function (origIndex, pos) {
      var btn = LOVE.util.el('button', { class: 'quiz-answer' });
      btn.textContent = letter[pos] + '. ' + q.answers[origIndex];
      btn.addEventListener('click', function () { self.onAnswer(origIndex, pos, btn); });
      self.answersEl.appendChild(btn);
    });
  }

  onAnswer(origIndex, pos, btn) {
    if (this.finished) return;
    var self = this;
    var q = this.questions[this.idx];
    var answeredEls = this.answersEl.querySelectorAll('.quiz-answer');
    answeredEls.forEach(function (b) { b.disabled = true; });

    if (origIndex === q.correctAnswer) {
      btn.classList.add('correct');
      this.correctCount += 1;
      this.stateData.quizCorrectTotal += 1;
      this.fbEl.style.color = '#0a7a0a';
      this.fbEl.textContent = 'Correct! I knew you remembered.';
      this.game.audio.success();
    } else {
      btn.classList.add('wrong');
      this.fbEl.style.color = '#a00';
      this.fbEl.textContent = q.wrongText;
      this.game.audio.error();
    }

    this.game.save();

    setTimeout(function () {
      self.idx += 1;
      if (self.idx >= self.questions.length) {
        self.finish();
      } else {
        self.setupRoundData();
        self.renderRound();
      }
    }, 1100);
  }

  finish() {
    this.finished = true;
    var min = LOVE.config.quizMinCorrect || 4;
    var box = this.msgEl;
    box.style.display = 'flex';
    box.innerHTML = '';

    var self = this;
    var row = LOVE.util.el('div', { style: 'display:flex;gap:8px;' });

    if (this.correctCount >= min) {
      this.stateData.quizCompleted = true;
      this.game.state.grantPiece('quiz');
      this.game.save();
      this.game.desktopScreen.refresh();
      this.game.audio.win();
      box.appendChild(LOVE.util.el('div', { class: 'big' }, '💖'));
      box.appendChild(LOVE.util.el('div', {}, 'Correct! You know us. ' + this.correctCount + '/' + this.questions.length));
      box.appendChild(LOVE.util.el('div', { style: 'margin-top:4px;' }, 'unlocked: Secret Folder'));
      var doneBtn = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Nice!');
      row.appendChild(doneBtn);
      doneBtn.addEventListener('click', function () {
        self.game.audio.click();
        self.game.openLoveExe();
        self.win.close();
      });
    } else {
      this.game.audio.error();
      box.appendChild(LOVE.util.el('div', { class: 'big' }, 'HMM.'));
      box.appendChild(LOVE.util.el('div', {}, 'Only ' + this.correctCount + '/' + this.questions.length + '. Your girlfriend would like to have a word with you.'));
      box.appendChild(LOVE.util.el('div', { style: 'margin-top:4px;' }, 'need at least ' + min + ' to unlock the Secret Folder'));
      var retry = LOVE.util.el('button', { class: 'xp-btn primary' }, 'Try again');
      var back = LOVE.util.el('button', { class: 'xp-btn' }, 'Back');
      row.appendChild(retry);
      row.appendChild(back);
      retry.addEventListener('click', function () {
        self.game.audio.click();
        self.idx = 0;
        self.correctCount = 0;
        self.finished = false;
        self.questions.forEach(function (q, i) { q.shownOrder = LOVE.util.shuffle(q.answers.map(function (_, j) { return j; })); });
        box.style.display = 'none';
        self.renderRound();
      });
      back.addEventListener('click', function () {
        self.game.audio.click();
        self.win.close();
      });
    }
    box.appendChild(row);
  }
};

/* =============================================================
   EOF QuizGame.js
   ============================================================= */