# HEUND OS · 포항에서 시작된 예술적 실험과 그 이후

Handover from Claude Code on the Windows PC to Claude Code on the Mac. Written 2026-11-19 (KST).
The whole project was built in one long session on the PC on 2026-11-18/19. That conversation does
not exist on the Mac, so everything you need from it is here. Read it all before changing anything.

## Where things stand

- **What it is:** a web presentation styled as a desktop OS ("HEUND OS"). The talk is
  「포항에서 시작된 예술적 실험과 그 이후」 by 김희은 (Hee-Eun Kim, heund.net) at 포항융합예술주간 2026
  성과 공유회, on **2026.11.20**.
- **Live:** https://heund.github.io/heund-os-pohang-2026/ (phone remote: `…/remote.html`, keep the `.html`).
- **Repo:** `heund/heund-os-pohang-2026`, branch `main`, **public**. GitHub Pages serves the root of `main`.
- **Last commit when this was written:** `66d9edb Add the sound audition page under tools/`.
  The Mac folder is a copy of the PC folder. Run `git status` and `git log -1` first, then `git pull`
  if GitHub is ahead.
- **One place at a time.** The PC session was moved to a cloud session on claude.ai/code before this
  handover. That session is not being used; work happens on the Mac now. If the user ever switches
  machines again: pull before working, push after.

## Rules from the user (follow them exactly)

1. **No invented copy.** Every visible line on a slide comes from the user's talk document, the
   user's own messages, or the user's own apps (e.g. the encounter app's HQ text). Don't write
   taglines, subtitles under works, "DISPLAY 1" tags or made-up names. If a label is needed and the
   document has none, ask. The user strongly objected each time this happened.
2. **Artwork titles always use 《》,** never 〈〉. Real titles: 《흐르는 알고리즘》 (2025),
   《기술의 미학》 (2025 exhibition), 《조우: 서천꽃밭》 (2026 app), 《조우의 목격》 (display 1, the
   floating island), 《바람, 질서》 (display 2, the weather/clouds). 제주비엔날레 work context: 《문전》.
3. **No em dashes in Korean text.**
4. **Sound:** recorded royalty-free samples only, never synthesised. Short one-shots, not bells or
   anything that rings on.
5. **Check your work in the browser** (run the local server, step through the affected slides, look
   for console errors) and report what you checked. The PC sessions did this for every change.
6. **Commits** use the user's GitHub identity, set in this repo only:
   `git config --local user.name heund` and
   `git config --local user.email 179378149+heund@users.noreply.github.com`.
   Check `git config --local --list` on the Mac; `.git/config` should have come along with the copy.
   Commit and push only when the user asks ("commit and deploy" means commit + push).
7. The user writes in a mix of Korean and English and wants plain, short answers.

## Source material

- **Talk document:** `../4_포항에서 시작된 예술적 실험과 그 이후_김희은20일발표자료.pdf` (one folder up,
  not inside PRESENTATION). If only PRESENTATION was copied, it isn't on the Mac; ask for it.
  Its text is also split by slide into `notes.js`.
- In this folder (kept out of git): `CV4-korean-2026-3.pdf` (the CV shown on screen),
  `ISEA2026_Kim_468_Full_Paper.pdf` (rendered as `assets/isea/paper-1..8.png`), `REF/` (design
  reference images).

## How the presentation works

Static site, no build step, no framework.

| File | Role |
|---|---|
| `index.html` | every window (`data-win="…"`) on the 1920×1080 `#stage`, scaled to fit |
| `os.css` | all styles |
| `talk.js` | the script: `window.TALK`, one entry per click → `{label, do: [[action, ...args]]}`; also place data (`PLACES`, `GLOBE_PLACES`, `ENC_*`) |
| `os.js` | the engine: runs actions (`const A = {…}`), navigation, keys, video players, maps |
| `sfx.js` | sounds (`SFX.key / click / pop / big`) |
| `map.js`, `wide.js`, `globe.js`, `encmap.js` | pre-built SVG map data (OpenStreetMap / Natural Earth). Generated on the PC; the generator scripts are not in the repo |
| `notes.js` | speaker notes and on-screen descriptions for the phone, keyed by step **label** |
| `remote.html`, `remote.js`, `remote-link.js`, `remote-display.js`, `remote-config.js` | phone remote |
| `tools/sound-audition.html` | listening page for choosing sounds (also live, `noindex`) |

- Going back or jumping replays steps instantly from a snapshot of the desk (`INITIAL = desk.innerHTML`).
  Actions in `AMBIENT` (`autoscroll`, `playVideo`, `videoCues`, `resume`, `encNode`) re-run after a jump.
- Pressing → while a step is still animating finishes it instantly; press again to move on.
- Renaming a step label means renaming its key in `notes.js` too.

### Steps (31, numbered 0–30; URL `#12` opens step 12)

| # | Label | # | Label |
|---|---|---|---|
| 0 | boot | 16 | 시민들 2025 |
| 1 | 제목 | 17 | CH 03 포항 → 세계 (Pohang map zooms out to the globe) |
| 2 | CV 열기 | 18 | 제주 · 폴더 (folder opens from the globe's 제주 tag) |
| 3 | ‘포항’ 검색 | 19 | 《조우: 서천꽃밭》 (munjeon.info window) |
| 4 | ISEA (MEMO note) | 20 | 작가와의 대화 (Jeju artist-talk video + timed popup) |
| 5 | 찾을 수 없음 (alert) | 21 | ISEA 논문 (paper, one-page view) |
| 6 | CV에 기록된 것 (relations.map) | 22 | 관객 반응 (two-page view, audience photos, no highlights) |
| 7 | 관계망 | 23 | Acknowledgements (zoom + highlights) |
| 8 | 질문 | 24 | ISEA2026 (logo window) |
| 9 | CH 01 | 25 | 발표 영상 (ISEA video: click full screen, click play) |
| 10 | POSTECH | 26 | CH 04 |
| 11 | 형산강 | 27 | 관계망, 다시 |
| 12 | 가속기연구소 | 28 | 기획·지원 체계 |
| 13 | 관객 2024 | 29 | outro |
| 14 | CH 02 | 30 | 감사합니다 |
| 15 | 명장님 | | |

**Step 20 popup timeline** (follows the video's own clock, set in `talk.js` → `videoCues`):
0:16 the `system` window opens with only the app lit · 0:30 《조우의 목격》 lights up · 0:35
《바람, 질서》 and everything runs · 0:41 the connections are emphasised · 0:46 fades out over 1.6 s
(`fade: 1600`). The video keeps playing underneath. The phone in the popup plays
`assets/jeju/encounter/nodes-montage.mp4`, a montage of real app recordings of nodes
1, 2, 4, 5, 6, 10, 11, 12, 13, 14 (5 KR / 5 EN). The HQ box text is the app's own.

### Videos

The site plays web copies under 100 MB: `assets/isea/ISEA_5min_web.mp4` (5:20) and
`assets/jeju/jeju_biennale_web.mp4` (2:00, made from `jeju_biennale_shorter.mp4`). The originals
(`ISEA_5min.mp4`, `jeju_biennale.mp4`, `jeju_biennale_shorter.mp4`) are git-ignored because GitHub
rejects files over 100 MB.

### Sound (`sfx.js`, files in `assets/sfx/`, licences in `CREDITS.txt`)

| Sound | File | When |
|---|---|---|
| typewriter | `type.wav` · Kenney click_003 (CC0), slight random pitch per key | every typed character |
| click | `click.wav` · Mixkit #2354 "Message pop alert", trimmed | the on-screen cursor's clicks |
| big | `big.wav` · Mixkit #1107 "Page forward single chime", trimmed to 0.7 s | CH 02, CH 03, CH 04 and the ISEA full screen. CH 01 (`wall … {quiet: true}`) and 감사합니다 are silent on purpose |
| pop | **not chosen yet** (`FILES.pop = ''`) | elements with `data-pop`: MEMO note (4), alert (5), question (8), Jeju popup (20) |

**M** mutes. Browsers only allow audio after one click or key press on the page.

### Keys

→ Space PageDown Enter / click: next · ← PageUp Backspace / right-click: back · Home / End ·
F: full screen · K: pause/resume the video on screen · H: hide the progress bar ·
R: pair with the phone remote · M: mute.

### Phone remote

Supabase Realtime **Broadcast** on the project **heund-os-remote** (Seoul). The URL and publishable
key in `remote-config.js` are meant to be public. The laptop (press R) and the phone type the same
passphrase, which becomes the channel name; it is never stored in the code. The phone shows
slide n / total with a description, the notes (read-only; the user chose not to make them editable),
◀ / video ❚❚▶ / ▶, and a stopwatch. No tables, policies or logins.

## Run it locally on the Mac

`.claude/launch.json` (git-ignored, copied from the PC) starts `python -m http.server 5178 --bind 127.0.0.1`.
On macOS change `"python"` to `"python3"`, then open http://127.0.0.1:5178/. If the browser serves old
scripts, reload with `fetch(file, {cache: 'reload'})` or a hard reload.

## Deploy

```
git add -A
git commit -m "…"
git push
```

Pages rebuilds in about a minute. Everything tracked is public, including `notes.js` and this file
if it is committed. Never commit anything private.

## Open tasks

1. **Pop-up sound.** The user is choosing one short one-shot (S1–S60) on `tools/sound-audition.html`.
   Each candidate's preview URL is in that file's `SOUNDS.pop` array. Kenney files come from
   raw.githubusercontent.com (Calinou/kenney-ui-audio or kenney-interface-sounds). For a full-quality
   Mixkit file, the download URL is in the `data-download--modal-url-value` attribute of
   `mixkit.co/free-sound-effects/download/<id>/`; the plain `<id>.wav` pattern sometimes gives 403.
   Once the user picks: download it, trim it to start on the hit with a short fade-out (ffmpeg),
   save it as `assets/sfx/pop.wav`, set `FILES.pop` in `sfx.js`, add a line to `CREDITS.txt`,
   check it in the browser, then commit and push when asked.
2. **Unused leftovers** (left in place, ask before removing): the `encmap`, `encapp`, `works` and
   `metal` windows in `index.html`, `encmap.js` (still loaded), the `ENC_NODES` data in `talk.js` and
   the `encNode` / `gmapTo` actions in `os.js` (from the dropped per-node app slides), and the
   git-ignored `jeju.js` and `assets/jeju/encounter/node-*.mp4`.

## Only on the Windows PC

These aren't in the folder, so they're not on the Mac:
- the encounter app's source (the jeju-pwa-system project in the PC's INSTALLATION WORK folder),
  used to record the app clips
- the scripts that built the maps and recorded the app (they were in a temporary folder)
- ffmpeg on the PC (on the Mac: `brew install ffmpeg` if needed)
- Claude's saved notes on the PC (their content is in the rules above)

## Accounts (context only, don't change them without asking)

- **GitHub** `heund`: the repo was made public on 2026-11-19 for free GitHub Pages, with the user's OK.
- **Supabase:** `heund-os-remote` (Seoul) is the remote's project. "heund's Project" was paused by
  the user to free a slot. Another Supabase project belongs to the Jeju work: never touch it.
- **Vercel:** abandoned after sign-in loops. Not used.
