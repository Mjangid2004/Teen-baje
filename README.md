# तीन बजे — Teen Baje 🎧

**Hostel Room 304 Radio.** A late-night mood web radio built to play your own music library with a rain-soaked balcony view, a spinning vinyl, and absolutely no corporate energy.

---

## The Idea

Somewhere between 2 AM and 5 AM in Hostel Room 304, the vibe hits different — chai steam, rain outside the window, code compiling on the first try. Teen Baje (तीन बजे) is an attempt to bottle that into a web page.

The whole thing is a wink to the glorious wave of tiny, weird, hand-crafted internet microsites that refuse to be boring. If you know, you know:

- [deluxesalon.in](https://deluxesalon.in) — one page, one idea, no fluff
- [hornokplease.xyz](https://hornokplease.xyz) — honestly deserves a honk
- [busdriver.wtf](https://busdriver.wtf) — the .wtf speaks for itself
- [cutting-chai-xi.vercel.app](https://cutting-chai-xi.vercel.app) — chai, but with better margins than us
- [rickshaw-wala.vercel.app](https://rickshaw-wala.vercel.app) — pure Delhi energy, zero rupees lost
- [corporatesucks.vercel.app](https://corporatesucks.vercel.app) — yes. it does.

And now: **teen-baje** — the hostel kid joins the family.

These sites prove one thing — you don't need a framework platoon, an analytics suite, and a cookie banner to make something people actually want to open. One page. A strong idea. A little soul. Teen Baje follows the same recipe.

---

## What It Does

- 📻 **Plays your own music** — drop your MP3s in, five curated playlists appear as tactile tabs (the exact playlists are yours to edit — swap them anytime).
- 💿 **A spinning vinyl** that rotates along with the currently playing track.
- 🎚️ **Draggable seek bar** with live timestamps — jump to any second of the song.
- 🌧️ **Rain outside the window** — a canvas rain animation confined to the balcony window, with a real audio loop of rain and thunder playing on top.
- 🔊 **Two independent volume sliders** — one for the music, one for the rain.
- 💭 **A soft quote ticker** slowly pacing the room's mood, with a manual refresh button when you need a new one.
- 🛡️ **Rain remembers you** — rain state persists across visits and refreshes (`localStorage`), defaulting to ON.
- 🖼️ **A fullscreen scene** — a cozy desi-living-room backdrop with steam rising from chai cups, a flickering lamp glow, and a live "engineers awake" online counter.

---

## How It Was Made

The whole thing is **vanilla HTML + CSS + JS**. That's it. No build step, no bundler, no framework. One reader-friendly page, one stylesheet, and a single script file that does playback, seeking, rain, quotes, and the playlist UI.

Highlights of how the fiddly parts got solved:

| Problem | Solution |
| --- | --- |
| Seeking jumps to start | Python's `http.server` ignored HTTP `Range` headers, so a seek to unloaded audio re-sent the whole file from byte 0. Swapped to a tiny **Node.js static server** (`server.js`) that answers `206 Partial Content` correctly — seeking now lands exactly where you drag. |
| `?` marks everywhere | The file carried corrupted bytes from an old editor save. Rewrote it as clean UTF-8 so the Devanagari titles (तीन बजे) and emojis render properly. |
| Browser cache fighting us | Versioned asset URLs (`?v=n`) — bumped after every change so stale files never linger. |
| Rain from a dead link | The original rain sound 404'd; pulled a fresh ~8-hour "rain on window with thunder" loop from YouTube, trimmed to a tidy 10-minute seamless loop with **ffmpeg**. |
| Dragging vs. auto-updating seek | A `change`-only-apply pattern with an `isSeeking` flag so the `timeupdate` handler doesn't fight your thumb mid-drag. |
| Music served from OneDrive | A directory junction (`music → OneDrive/Music/Playlists`) lets the site stream real local MP3s without copying GBs into the repo. |

### Stack

```
HTML  — semantic, single page
CSS   — hand-written, gold-on-dark radio-room aesthetic
JS    — zero dependencies (existing replays at 69 tracks and counting, all local)
Node  — server.js, a ~50-line static server with HTTP Range support
```

### Run it locally

```bash
node server.js
# → http://localhost:8000
```

That's it. Open the URL, press play, watch it rain.

---

## Project Structure

```
teen-baje/
├── index.html      # the page
├── style.css       # the whole look, by hand
├── script.js       # playback, seeking, rain, quotes, tabs
├── playlists.js    # your playlists & quotes (edit freely)
├── server.js       # tiny static server with Range support
├── assets/
│   ├── background.png   # the room scene
│   └── rain.mp3         # 10-min seamless rain + thunder loop
└── music/               # junction → your local MP3 library
```

---

## F.A.Q.

**Why no build tools?** Because the site is one idea, not an app. A single file being refreshed is the whole charm.

**Why "तीन बजे"?** 3 AM. When the code finally compiles, the chai's finally done, and the rain is still going.

**Can I change the playlists?** Yes — edit `playlists.js`. Track files are referenced by name, so point any entry at any MP3 you have. The playlist names, order, and genre tags are fully yours to reshape.

**Where do the MP3s live?** Outside the repo, in your own music folder, linked in via a junction so streaming stays dead-simple and near-zero-latency.

---

## Shout-outs

To every weird microsite that fired the spark — keep making the internet non-corporate, one `.wtf` at a time.

And to the engineers awake at 3 AM: this one's for you.