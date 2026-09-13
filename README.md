# LOVE OS XP

A tiny Windows XP–style game made for one special person. It boots like an old
operating system, lives on a pretend desktop, and hides the real gift inside.

No build step. No install. Just open `index.html`.

## Run it

- **Easiest:** double-click `index.html`. It works from `file://`.
- **Or serve it locally** (nicer for sharing over WiFi):

  ```bash
  # python 3
  python -m http.server 8080
  # then open http://localhost:8080
  ```

- **Put it on a phone/tablet:** the layout scales itself. If audio does not
  play, tap the screen once — browsers only allow sound after a tap.

## The journey

1. **Boot screen** — pretend BIOS, "Press any key".
2. **LOVE.EXE** hub — shows your heart pieces, gates the mini-games, and shows
   the Love Meter (it fills up as the game notes add up).
3. **Hearts → Memory → Quiz → Secret Folder → Final Challenge** — each step
   unlocks the next. The final challenge paints the ending.
4. **Love Arcade** (desktop icon, Start menu, or LOVE.EXE) — five bonus games:
   Asoo Pong, Heart Snake, Whack-a-Love, Asoo Says and Heartfield
   (minesweeper with hearts). Wins are saved.
5. **Music Player** — 7 built-in chiptune songs (melody + bass), all composed
   about her. Pick a track, hit play, advance, or skip.
6. **Tools** — **Paint** (draw with pencil/eraser, 12 colors, 4 brush sizes,
   name + save into the **Gallery**, or set a drawing as the desktop wallpaper),
   **My Pictures** gallery (view, delete, set as wallpaper), and an XP-style
   **Calculator**. All three live on the desktop, in the Start menu, and in
   C:\ drive rows.
7. **Easter eggs** are scattered around (recycle bin, taskbar, drives, arcade...).

Progress, settings, music/CRT toggles and **the wallpaper** are saved in the
browser (`localStorage`, keys `loveos_xp_save_v1` + `loveos_xp_drawings_v1`).

## Make it truly yours

Everything personal lives in one place: **`src/data/gameConfig.js`**.

| What | Config field |
| --- | --- |
| Her name | `girlfriendName` |
| Boot screen lines | `bootMessages`, `bootStops` |
| Desktop icons | `desktopIcons` |
| My Computer drives | `myComputerDrives` |
| Notepad memories | `memories` |
| Photo pixel-art scenes | `photos` (drawn from a tiny grid) |
| The quiz | `quizQuestions` + `quizMinCorrect` (4) |
| Ending words | `finalMessage` |
| Easter-egg texts | `easterEggs`, `recycleMessages` |
| Welcome sequence | `welcome` |
| Music player songs | `musicTracks` (each has `title`, `artist`, `about`, `tempo`, `tune`, `bass`) |
| Arcade flavour | arcade wins are saved automatically in `arcadeWins` |

Targets live at the top of the file: `heartsTarget` (15) is the only count you
need — everything else auto-scales off the content above. The "About LoveOS XP"
dialog text lives in `LOVE.Game.showAbout()` (`src/main.js`).

### Swapping in real photos (optional)

Photo scenes are drawn as pixel art out of the box (`kind: 'pixel'`). To use a
real picture instead, set `kind: 'photo'` and `img: 'photos/name.jpg'` on a
photo entry, drop the file in a `photos/` folder, and the viewer will render it
with a scanline overlay.

### Changing the final letter / messages

The secret letter text is in `LOVE.Game.openSecretLetter()`
(`src/main.js`); deeper flavor lines live in `gameConfig.js`.

## Notes

- Works best in Chrome/Edge/Firefox. It will not self-destruct if run offline —
  only the pixel font falls back to a monospace one.
- Sound is synthesized in code (Web Audio), so the whole thing is one folder
  you can send as-is.
- If you ever break it, `Reset Progress` in the Start menu wipes the save.

Made with love, `null` closing tags, and exactly one ❤️.