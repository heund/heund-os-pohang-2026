# 포항에서 시작된 예술적 실험과 그 이후 · HEUND OS

A static web presentation (no build step) plus a phone remote.

- `/` the presentation (1920 × 1080 stage, scaled to the window)
- `/remote` the phone remote: slide n / total with a description, speaker notes, ◀ / video ❚❚▶ / ▶

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
| URL `#12` | open at step 12 |

## 1. Supabase (once)

1. Create a free project at supabase.com.
2. Project Settings → API: copy the **Project URL** and the **publishable key** (or the anon key).
3. Paste both into `remote-config.js`. They are meant to be public.
4. Realtime → Settings: leave **Allow public access** on. The remote uses a public Broadcast channel
   whose name is derived from your passphrase, so nothing needs a table, a policy or a login.

## 2. GitHub → Vercel

```
git init
git add .
git commit -m "HEUND OS presentation"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Vercel → Add New → Project → import the repo → Framework Preset **Other**, no build command,
output directory = root → Deploy. Every push to `main` redeploys.

`.gitignore` keeps the original videos out (GitHub rejects files over 100 MB and Vercel Hobby caps
static files at 100 MB); the site plays `assets/isea/ISEA_5min_web.mp4` and
`assets/jeju/jeju_biennale_web.mp4`. The whole deployment is about 65 MB.

## 3. On the day

1. Laptop: open the site in Chrome, press **R**, type a passphrase. It is remembered on that laptop.
2. Click once on the presentation or press **F** (fullscreen). Browsers only allow video sound after
   the page has been clicked or a key pressed once; the phone shows a red notice until then.
3. Phone: open `https://<your-site>/remote`, type the same passphrase → **연결**.
   The status reads **화면 연결됨** once the laptop answers.
4. ◀ / ▶ move the talk; the middle button pauses / resumes the video on screen and shows its time.

**잠금** on the phone forgets the passphrase there. **R** with an empty passphrase unpairs the laptop.

Testing without Supabase: leave `remote-config.js` empty, open the presentation and `/remote.html`
in two tabs of the same browser and use the same passphrase in both.

## Notes

Edit `notes.js`. Notes are keyed by the step label shown next to the progress bar (`'POSTECH'`,
`'작가와의 대화'` …); `desc` is the line under the slide number on the phone. `notes.js` is a public
file on the deployed site (only the remote loads it, but anyone with its URL can read it).
