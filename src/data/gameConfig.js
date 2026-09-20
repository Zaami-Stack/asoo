/* =============================================================
   LOVE OS XP - PERSONAL CONFIG
   -------------------------------------------------------------
   THIS is the file you edit to make the game personal.
   Change the name, memories, quiz questions, photos, the final
   message... everything here. The game engine reads it all from
   here, so you never need to touch the other files.

   Find a girlfriend's name below. Replace the default memories /
   quiz / final message with your own real ones for the best gift.
   ============================================================= */

window.LOVE = window.LOVE || {};

/* tiny DOM / math helpers used across the game */
LOVE.util = {
  winCounter: 0,

  el: function (tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (k === 'class') n.className = v;
        else if (k === 'style') n.style.cssText = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'text') n.textContent = v;
        else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v);
      }
    }
    if (children != null) {
      if (Array.isArray(children)) {
        children.forEach(function (c) {
          if (c == null) return;
          n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
      } else if (typeof children === 'string') {
        n.appendChild(document.createTextNode(children));
      } else {
        n.appendChild(children);
      }
    }
    return n;
  },

  clamp: function (x, a, b) { return Math.max(a, Math.min(b, x)); },

  random: function (a, b) { return a + Math.random() * (b - a); },

  pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  shuffle: function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  },

  typewriter: function (node, text, speed, onDone) {
    var full = String(text);
    var i = 0;
    node.textContent = '';
    var timer;
    var step = function () {
      if (i >= full.length) {
        if (onDone) onDone();
        return;
      }
      i += 1;
      node.textContent = full.slice(0, i);
      timer = setTimeout(step, speed);
    };
    step();
    return {
      done: function () {
        if (timer) clearTimeout(timer);
        node.textContent = full;
        if (onDone) onDone();
      }
    };
  },

  /* substitute {name} / {age} tokens in personal strings */
  fill: function (text, extra) {
    var b = LOVE.config.birthday || {};
    var name = extra && extra.name != null ? extra.name : LOVE.config.girlfriendName;
    var age = extra && extra.age != null ? extra.age : (b.age || '');
    return String(text).replace(/\{name\}/g, name).replace(/\{age\}/g, age);
  },

  /* pixel-art heart drawn on a canvas context */
  pixelHeart: function (ctx, cx, cy, scale, color) {
    var s = scale;
    ctx.save();
    ctx.fillStyle = color || '#e02058';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 3 * s);
    ctx.bezierCurveTo(cx - 3 * s, cy - 1 * s, cx - 2 * s, cy - 4 * s, cx - 1 * s, cy - 4 * s);
    ctx.bezierCurveTo(cx - 0.4 * s, cy - 4 * s, cx, cy - 2.6 * s, cx, cy - 2.6 * s);
    ctx.bezierCurveTo(cx, cy - 2.6 * s, cx + 0.4 * s, cy - 4 * s, cx + 1 * s, cy - 4 * s);
    ctx.bezierCurveTo(cx + 2 * s, cy - 4 * s, cx + 3 * s, cy - 1 * s, cx + 3 * s, cy + 3 * s);
    ctx.bezierCurveTo(cx + 3 * s, cy + 4 * s, cx - 3 * s, cy + 4 * s, cx - 3 * s, cy + 3 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};

LOVE.config = {
  osName: 'LoveOS XP',
  girlfriendName: 'Asoo',

  /* ---------- 0. Birthday celebration ----------
     Turning this on sprinkles a birthday surprise through the OS:
     an edition title on boot, a cake on the desktop, confetti,
     a taskbar cake badge on the big day, a fanfare, and a
     personalized ending line. Set enabled: false to turn it off. */
  birthday: {
    enabled: true,
    age: 18,
    date: [9, 18],          // [month, day] - shows a 🎂 in the clock
    osTitle: 'LOVE OS XP - 18th Birthday Edition',
    bootTag: 'loading birthday cake',
    banner: 'It\u0027s {name}\u0027s {age}th birthday - tap the cake!',
    cakeDialog: 'One cake for the birthday girl. {age} candles, all for you.\n\nMake a wish... \u2728',
    endingLine: 'Happy {age}th birthday, {name}. This OS now legally runs on real, adult hardware.',
    desktopIcon: true
  },

  /* ---------- 1. Boot screen ---------- */
  bootMessages: [
    'Starting LoveOS XP...',
    'Checking memory...',
    'Loading love.dll...',
    'Loading memories...',
    'Loading important person...',
    'Loading Asoo...',
    'Everything looks perfect.'
  ],
  /* progress bar will pause at these percentages */
  bootStops: [0, 15, 32, 48, 67, 82, 100],

  /* ---------- 2. Welcome / introduction ---------- */
  welcome: {
    title: 'LOVE.EXE',
    message: [
      'Welcome :)',
      '',
      'This little game was made for you.',
      'It runs on ancient technology - just like my heart.',
      '',
      'Have a look around.'
    ]
  },

  introLines: [
    'SYSTEM: Hello.',
    'SYSTEM: I have been waiting for you.',
    'SYSTEM: This computer was built for one person only.',
    'SYSTEM: I need to make sure you are really her.',
    'SYSTEM: Tell me, Asoo...'
  ],

  introChoices: [
    { label: 'Our conversations', reply: 'Correct. Extremely correct. Identity confirmed.' },
    { label: 'Our stupid jokes', reply: 'The stupid jokes are the best ones. Confirmed.' },
    { label: 'Spending time together', reply: 'Objectively the right answer.' },
    { label: 'Everything', reply: 'Smooth. Also correct. I knew it was you.' },
    { label: 'Your beautiful face', reply: 'Cheesy. Accepted. The system loves it.' }
  ],

  /* ---------- 3. Desktop icons ---------- */
  desktopIcons: [
    { id: 'mycomputer', label: 'My Computer', icon: '\u{1F5A5}', type: 'system' },
    { id: 'recycle', label: 'Recycle Bin', icon: '\u267B', type: 'system' },
    { id: 'love', label: 'LOVE.EXE', icon: '\u2764\uFE0F', type: 'app' },
    { id: 'memories', label: 'Memories', icon: '\u{1F4DD}', type: 'app' },
    { id: 'photos', label: 'Photos', icon: '\u{1F5BC}\uFE0F', type: 'app' },
    { id: 'music', label: 'Music', icon: '\u266A', type: 'app' },
    { id: 'secret', label: 'Secret Folder', icon: '\u{1F5B8}\uFE0F', type: 'app' },
    { id: 'junk', label: 'Homework.exe', icon: '\u{1F4A4}', type: 'junk' },
    { id: 'arcade', label: 'Love Arcade', icon: '\u{1F3AE}', type: 'app' },
    { id: 'paint', label: 'Paint', icon: '\u{1F3A8}', type: 'app' },
    { id: 'gallery', label: 'Gallery', icon: '\u{1F5BC}\uFE0F', type: 'app' },
    { id: 'calc', label: 'Calculator', icon: '\u{1F9EE}', type: 'app' },
    { id: 'cake', label: 'Birthday Cake', icon: '\u{1F382}', type: 'birthday' }
  ],

  recycleMessages: [
    'Nothing to delete.',
    'Why would you delete something this cute?',
    'The recycle bin is empty, like my need for therapy.',
    'Please stop. This bin has feelings.'
  ],

  myComputerDrives: [
    { name: 'C:', label: 'LOVE', desc: 'The important stuff' },
    { name: 'D:', label: 'MEMORIES', desc: 'read-only, adorable' },
    { name: 'E:', label: 'GAMES', desc: 'mini games of affection' },
    { name: 'F:', label: 'IMPORTANT_STUFF', desc: 'you know what this is' }
  ],

  /* ---------- 4. Memories ----------
     Add your real memories here. Each one opens in a notepad
     window with a typewriter effect.                              */
  memories: [
    {
      file: 'memory_01.txt',
      date: '2001-01-01 - the beginning',
      text: 'Dear Asoo,\n\nDo you remember when we first really talked? It probably was nothing special to you. To me it was the start of everything.\n\nI still think about it more than I should.\n\nThat is how I knew.'
    },
    {
      file: 'memory_02.txt',
      date: '2002-06-14 - a laugh',
      text: 'Dear Asoo,\n\nDo you remember the time we laughed until we could not breathe? I do. I remember exactly where we were and what was said.\n\nI would relive that moment on loop forever.\n\n(Turn the volume down next time.)'
    },
    {
      file: 'memory_03.txt',
      date: '2003-12-25 - cozy',
      text: 'Dear Asoo,\n\nDo you remember that cozy evening? Just the two of us. Nothing fancy. Honestly, "nothing fancy" with you is my favorite thing in the world.\n\nEverything ordinary becomes a memory when I am with you.'
    },
    {
      file: 'memory_04.txt',
      date: '2004-02-14 - a silly one',
      text: 'Dear Asoo,\n\nDo you remember the stupid little thing we always do? The one that makes no sense to anyone except us?\n\nEveryone thinks we are a little weird.\n\nThey are absolutely right. It is my favorite thing about us.'
    }
  ],

  importantNote: {
    file: 'important.txt',
    date: 'always valid',
    text: 'IMPORTANT NOTICE\n----------------\n\nThe user of this computer (me) officially loves\nthe user of this computer visited by (you).\n\nThis notice cannot be invalidated.\n\nHave a nice day.\n\n- signed, the boyfriend.exe'
  },

  specialPhoto: { file: 'special_photo.jpg', date: '2004 - favorite', caption: 'One of my favorite memories. The real one.' },

  /* ---------- 5. Photos ----------
     Set "src" to a photo URL or file path (e.g. "photos/img1.jpg")
     to show a real picture. Leave src: null to show a pixel-art
     placeholder instead.                                          */
  photos: [
    { file: 'IMG_001.JPG', date: '2001 - the start', caption: 'Where it all began.', src: null },
    { file: 'IMG_002.JPG', date: '2002 - somewhere fun', caption: 'We were probably laughing here.', src: null },
    { file: 'IMG_003.JPG', date: '2003 - at home', caption: 'Ordinary day, favorite person.', src: null },
    { file: 'IMG_004.JPG', date: '2004 - a date', caption: 'I definitely picked this restaurant.', src: null },
    { file: 'special_photo.jpg', date: 'my favorite', caption: 'One of my favorite memories. The real one.', src: null }
  ],

  /* ---------- 6. Quiz questions ----------
     correctAnswer is the index (0-based) of the right answer.
     You need 4 of 5 correct to pass.                              */
  quizMinCorrect: 4,
  quizQuestions: [
    {
      question: 'Where would we rather spend an evening?',
      answers: ['Somewhere fancy', 'Together at home', 'On the moon', 'Inside a supermarket'],
      correctAnswer: 1,
      wrongText: 'Incorrect. Your boyfriend would like to have a word with you.'
    },
    {
      question: 'What is the best thing that happened to me?',
      answers: ['A promotion', 'Finding money in a coat', 'You', 'Winning an argument (once)'],
      correctAnswer: 2,
      wrongText: 'Nice try. The answer is very obviously you.'
    },
    {
      question: 'How many of my memories star you?',
      answers: ['A few', 'Some', 'A lot', 'All of them'],
      correctAnswer: 3,
      wrongText: 'Wrong. It is all of them. Every single one.'
    },
    {
      question: 'If we had one day with no rules, what would I choose?',
      answers: ['Sleeping in', 'A long walk with you', 'Videogames all day', 'Eating all the snacks'],
      correctAnswer: 1,
      wrongText: 'Hmm. The correct answer is anything, as long as you are in it.'
    },
    {
      question: 'Why does this computer exist?',
      answers: ['For fun', 'An experiment', 'For you', 'To waste time'],
      correctAnswer: 2,
      wrongText: 'your girlfriend... I mean, your boyfriend would like a word.'
    }
  ],

  /* ---------- 7. Audio tracks (all built-in synth, no files needed) ----------
     Each track: title, artist, about, tempo (ms per step) and a
     melody made of note names (C4, C#4, A5, ...). R = rest.
     bass is optional - note names played every 4 steps.         */
  musicTracks: [
    {
      title: 'Asoo (Love Song)',
      artist: 'boyfriend.exe',
      about: 'the main theme - dedicated to Asoo',
      tempo: 230,
      tune: ['C5', 'D5', 'E5', 'G5', 'E5', 'D5', 'C5', 'R',
             'D5', 'E5', 'F5', 'A5', 'F5', 'E5', 'D5', 'R',
             'C5', 'D5', 'E5', 'G5', 'E5', 'C5', 'D5', 'E5',
             'D5', 'C5', 'A4', 'R', 'R', 'R', 'R', 'R'],
      bass: ['C3', 'G2', 'F2', 'G2', 'C3', 'G2', 'F2', 'G2']
    },
    {
      title: 'First Talk',
      artist: 'the love daemon',
      about: 'the day everything started',
      tempo: 330,
      tune: ['D5', 'F5', 'A5', 'F5', 'D5', 'F5', 'A5', 'C6',
             'B5', 'A5', 'G5', 'F5', 'D5', 'F5', 'A5', 'F5',
             'G5', 'F5', 'E5', 'R', 'D5', 'R', 'D4', 'R',
             'D5', 'E5', 'F5', 'A5', 'F5', 'D5', 'R', 'R'],
      bass: ['D3', 'D3', 'A3', 'A3', 'B3', 'B3', 'A3', 'D3']
    },
    {
      title: 'Midnight Wi-Fi',
      artist: 'cpu_romance',
      about: 'deep talk at 2am over the router',
      tempo: 310,
      tune: ['A4', 'C5', 'E5', 'C5', 'B4', 'C5', 'D5', 'E5',
             'A4', 'C5', 'E5', 'G5', 'F5', 'E5', 'D5', 'C5',
             'B4', 'C5', 'E5', 'A5', 'G5', 'E5', 'D5', 'C5',
             'B4', 'A4', 'R', 'R', 'R', 'R', 'R', 'R'],
      bass: ['A2', 'A2', 'F2', 'F2', 'G2', 'G2', 'E2', 'A2']
    },
    {
      title: 'Her Laugh',
      artist: 'happy.exe',
      about: 'the sound that fixes every bug',
      tempo: 205,
      tune: ['F5', 'A5', 'C6', 'A5', 'F5', 'A5', 'C6', 'D6',
             'C6', 'A5', 'F5', 'A5', 'G5', 'A5', 'G5', 'F5',
             'D5', 'F5', 'A5', 'C6', 'A5', 'G5', 'F5', 'E5',
             'D5', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'R'],
      bass: ['F3', 'F3', 'C3', 'C3', 'D3', 'D3', 'C3', 'C3']
    },
    {
      title: 'Our Ordinary Day',
      artist: 'weekend.exe',
      about: 'the best days are nothing special',
      tempo: 225,
      tune: ['G4', 'C5', 'E5', 'C5', 'G4', 'C5', 'E5', 'F5',
             'E5', 'D5', 'C5', 'B4', 'C5', 'D5', 'E5', 'G5',
             'C5', 'B4', 'A4', 'G4', 'A4', 'B4', 'C5', 'E5',
             'D5', 'C5', 'B4', 'A4', 'G4', 'R', 'R', 'R'],
      bass: ['C3', 'C3', 'G3', 'G3', 'F3', 'F3', 'G3', 'C3']
    },
    {
      title: 'Cuddleware',
      artist: 'warmware',
      about: 'a theme for being close',
      tempo: 300,
      tune: ['E5', 'G5', 'B5', 'G5', 'E5', 'D5', 'B4', 'C5',
             'E5', 'G5', 'A5', 'G5', 'E5', 'C5', 'D5', 'B4',
             'G4', 'B4', 'D5', 'G5', 'D5', 'B4', 'C5', 'D5',
             'E5', 'F5', 'G5', 'A5', 'B5', 'R', 'R', 'R'],
      bass: ['C3', 'C3', 'G2', 'G2', 'A2', 'A2', 'F2', 'F2']
    },
    {
      title: 'Forever (finale)',
      artist: 'boyfriend.exe + asoo.exe',
      about: 'the credits song, played by us',
      tempo: 245,
      tune: ['C5', 'E5', 'G5', 'C6', 'B5', 'G5', 'C6', 'B5',
             'A5', 'G5', 'E5', 'G5', 'C5', 'E5', 'G5', 'E5',
             'D5', 'C5', 'D5', 'E5', 'G5', 'E5', 'C5', 'D5',
             'E5', 'D5', 'C5', 'G4', 'C5', 'E5', 'R', 'R'],
      bass: ['C3', 'C3', 'G2', 'G2', 'A2', 'A2', 'F2', 'C3']
    },
    {
      title: 'Happy Birthday (18)',
      artist: 'the cake daemon',
      about: 'the only song that matters today',
      tempo: 250,
      tune: ['G4', 'G4', 'A4', 'G4', 'C5', 'B4', 'R', 'R',
             'G4', 'G4', 'A4', 'G4', 'D5', 'C5', 'R', 'R',
             'G4', 'G4', 'G5', 'E5', 'C5', 'B4', 'A4', 'R',
             'F5', 'F5', 'E5', 'C5', 'D5', 'C5', 'R', 'R'],
      bass: ['C3', 'C3', 'F2', 'F2', 'C3', 'C3', 'G2', 'C3']
    }
  ],

  /* ---------- 8. Final message (the ending) ---------- */
  finalMessage: [
    'Hey Asoo,',
    '',
    'If you reached this screen, you completed my little game.',
    'I know this is not some huge AAA masterpiece.',
    'It is just a small thing I made for you, running on pretend-old',
    'technology, full of pretend bugs and very real affection.',
    '',
    'I wanted to create something that was ours. Something that',
    'feels like opening an old computer and finding a game that',
    'only one person in the world was ever meant to play.',
    '',
    'It was worth it. You are worth it.',
    'Thank you for being you.',
    '',
    'You make ordinary days into memories I keep forever.',
    '',
    '\u2764\uFE0F  -  me, forever',
    ''
  ],

  restartChoices: [
    { label: 'YES', reply: 'Restarting the whole universe... just for love. Good choice.' },
    { label: 'Obviously', reply: 'Obviously! The only real answer. Rebooting the heart...' }
  ],

  /* ---------- 9. Easter eggs ----------
     target: which thing is clicked. clicks: number of clicks to trigger. */
  easterEggs: [
    { target: 'startlogo', clicks: 5, message: 'You found something you were not supposed to find.' },
    { target: 'recycle', clicks: 3, message: 'Absolutely not.' },
    { target: 'clock', clicks: 1, message: 'Time spent with you is never wasted.' },
    { target: 'mycomputer', clicks: 10, message: 'Please stop clicking me.' },
    { target: 'desktop', clicks: 1, chance: 0.03, message: 'How did you even find this?' },
    { target: 'arcade', clicks: 3, message: 'This machine is single-player. The player is Asoo.' }
  ],

  /* ---------- 10. Fake errors used around the place ---------- */
  errors: {
    missingImage: ['ERROR 404', 'That picture does not exist. But you do, and that is better.'],
    noSave: ['ERROR 401', 'No save data found. This is your first time here.'],
    accessDenied: ['ACCESS DENIED', 'Complete more of the game to unlock this folder.']
  },

  /* how many hearts to catch to finish heart game */
  heartsTarget: 15
};

/* =============================================================
   EOF gameConfig.js
   ============================================================= */