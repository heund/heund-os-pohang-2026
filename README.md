# 포항에서 시작된 예술적 실험과 그 이후 · HEUND OS

A static web presentation (no build step) plus a phone remote.

Live: https://heund.github.io/heund-os-pohang-2026/ (GitHub Pages, from `main`)

- `/` the presentation (1920 × 1080 stage, scaled to the window)
- `/remote.html` the phone remote: slide n / total with a description, speaker notes, ◀ / video ❚❚▶ / ▶

## Keys on the presentation

| Key | |
|---|---|
| → Space PageDown Enter, click | next |
| ← PageUp Backspace, right-click | back |
| Home / End | first / last |
| F | fullscreen |
| K | pause / resume the video on screen |
| H | hide the progress bar |
| R | pair with the phone remote (passphrase) |
| M | mute / unmute the typewriter and click sounds |
| URL `#12` | open at step 12 |

## 1. Supabase

Project **heund-os-remote** (Seoul), already set in `remote-config.js`: the Project URL and the
publishable key, both meant to be public. Realtime → Settings keeps **Allow public access** on: the
remote uses a public Broadcast channel whose name is derived from your passphrase, so nothing needs a
table, a policy or a login.

## 2. GitHub Pages

The repo `heund/heund-os-pohang-2026` is published by GitHub Pages from the root of `main`
(`.nojekyll` serves the files as they are). To update the live site:

```
git add -A
git commit -m "update"
git push
```

Pages rebuilds in about a minute. `.gitignore` keeps the original videos out (GitHub rejects files
over 100 MB); the site plays `assets/isea/ISEA_5min_web.mp4` and `assets/jeju/jeju_biennale_web.mp4`.
The whole site is about 65 MB.

## 3. On the day

1. Laptop: open the site in Chrome, press **R**, type a passphrase. It is remembered on that laptop.
2. Click once on the presentation or press **F** (fullscreen). Browsers only allow video sound after
   the page has been clicked or a key pressed once; the phone shows a red notice until then.
3. Phone: open `https://heund.github.io/heund-os-pohang-2026/remote.html`, type the same passphrase → **연결**.
   The status reads **화면 연결됨** once the laptop answers.
4. ◀ / ▶ move the talk; the middle button pauses / resumes the video on screen and shows its time.

**잠금** on the phone forgets the passphrase there. **R** with an empty passphrase unpairs the laptop.

Testing without Supabase: leave `remote-config.js` empty, open the presentation and `/remote.html`
in two tabs of the same browser and use the same passphrase in both.

## Notes

Edit `notes.js`. Notes are keyed by the step label shown next to the progress bar (`'POSTECH'`,
`'작가와의 대화'` …); `desc` is the line under the slide number on the phone. `notes.js` is a public
file on the deployed site (only the remote loads it, but anyone with its URL can read it).
