/* ==========================================================================
   तीन बजे (Teen Baje) - JavaScript Application Logic
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  
  // Audio Elements
  const mainAudio = document.getElementById("mainAudio");
  const rainAudio = document.getElementById("rainAudio");

  // Horizontal Player UI Elements
  const playBtn = document.getElementById("playBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const seekBar = document.getElementById("seekBar");
  const currentTimeEl = document.getElementById("currentTime");
  const durationTimeEl = document.getElementById("durationTime");
const trackTitleEl = document.getElementById("trackTitle");
  const artistNameEl = document.getElementById("artistName");
  const vinylDisc = document.getElementById("vinylDisc");
  const musicVol = document.getElementById("musicVol");
  const rainVol = document.getElementById("rainVol");
  const playlistTabsContainer = document.getElementById("playlistTabs");

  // Window Rain Controls
  const windowRainToggleBtn = document.getElementById("windowRainToggleBtn");
  const windowRainStatus = document.getElementById("windowRainStatus");

  // Header & Modal Elements
  const quoteTicker = document.getElementById("quoteTicker");
  const listenerCountEl = document.getElementById("listenerCount");
  const toggleTracklistBtn = document.getElementById("toggleTracklistBtn");
  const tracklistModal = document.getElementById("tracklistModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const trackListUl = document.getElementById("trackList");
  const currentPlaylistNameEl = document.getElementById("currentPlaylistName");

  // State Variables
  let currentPlaylistIndex = 0;
  let currentTrackIndex = 0;
  let isPlaying = false;
  let isRainPlaying = false;
  let currentQuoteIndex = 0;

  // Real Active Visitor Tracker using BroadcastChannel & localStorage
  initRealOnlineCounter();

  // Initialize Playlists & Tabs
  function initPlaylists() {
    playlistTabsContainer.innerHTML = "";
    window.PLAYLISTS.forEach((pl, idx) => {
      const btn = document.createElement("button");
      btn.className = `playlist-tab-btn ${idx === 0 ? "active" : ""}`;
      btn.innerText = pl.name;
      btn.addEventListener("click", () => selectPlaylist(idx));
      playlistTabsContainer.appendChild(btn);
    });
    loadTrack(currentPlaylistIndex, currentTrackIndex);
  }

  // Select Playlist
  function selectPlaylist(index) {
    currentPlaylistIndex = index;
    currentTrackIndex = 0;
    
    const tabs = playlistTabsContainer.querySelectorAll(".playlist-tab-btn");
    tabs.forEach((tab, idx) => {
      tab.classList.toggle("active", idx === index);
    });

    loadTrack(currentPlaylistIndex, currentTrackIndex);
    if (isPlaying) playAudio();
  }

  // Load Track & Buffer Audio smoothly
  function loadTrack(playlistIdx, trackIdx) {
    const playlist = window.PLAYLISTS[playlistIdx];
    const track = playlist.tracks[trackIdx];

    currentPlaylistNameEl.innerText = playlist.name;
    trackTitleEl.innerText = track.title;
    artistNameEl.innerText = track.artist;
    
    // Set Audio Source & preload metadata
    mainAudio.src = track.url;
    mainAudio.load();

    seekBar.value = 0;
    currentTimeEl.innerText = "0:00";
    durationTimeEl.innerText = track.duration || "3:30";

    renderModalTracklist();
  }

  // Play / Pause Logic
  function togglePlay() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  function playAudio() {
    mainAudio.play().then(() => {
isPlaying = true;
      playBtn.innerText = "⏸️";
      vinylDisc.classList.add("spinning");
    }).catch(err => {
      console.log("Autoplay check:", err);
    });
  }

  function pauseAudio() {
    mainAudio.pause();
isPlaying = false;
    playBtn.innerText = "▶️";
    vinylDisc.classList.remove("spinning");
  }

  // Next & Previous Track
  function nextTrack() {
    const playlist = window.PLAYLISTS[currentPlaylistIndex];
    currentTrackIndex = (currentTrackIndex + 1) % playlist.tracks.length;
    loadTrack(currentPlaylistIndex, currentTrackIndex);
    if (isPlaying) playAudio();
  }

  function prevTrack() {
    const playlist = window.PLAYLISTS[currentPlaylistIndex];
    currentTrackIndex = (currentTrackIndex - 1 + playlist.tracks.length) % playlist.tracks.length;
    loadTrack(currentPlaylistIndex, currentTrackIndex);
    if (isPlaying) playAudio();
  }

  // Toggle Window Rain Ambient Sound
  function setRainState(on) {
    if (on) {
      rainAudio.volume = rainVol.value;
      rainAudio.play().catch(() => {});
      isRainPlaying = true;
      windowRainToggleBtn.classList.add("active");
      windowRainStatus.innerText = "Rain Sound ON";
    } else {
      rainAudio.pause();
      isRainPlaying = false;
      windowRainToggleBtn.classList.remove("active");
      windowRainStatus.innerText = "Rain Sound OFF";
    }
  }

  function toggleWindowRain() {
    const next = !isRainPlaying;
    setRainState(next);
    try { localStorage.setItem("teen_baje_rain", next ? "on" : "off"); } catch (e) {}
  }

  // Restore rain preference (default ON) & auto-start, with autoplay fallback
  function initRainState() {
    let saved = "on";
    try {
      const v = localStorage.getItem("teen_baje_rain");
      if (v === "on" || v === "off") saved = v;
    } catch (e) {}
    setRainState(saved === "on");
    if (saved === "on") {
      document.addEventListener("pointerdown", function resumeRain() {
        if (isRainPlaying) return;
        rainAudio.volume = rainVol.value;
        rainAudio.play().catch(() => {});
        isRainPlaying = true;
        document.removeEventListener("pointerdown", resumeRain);
      });
    }
  }

// Smooth Seeking Track Progress Bar
  let isSeeking = false;

  mainAudio.addEventListener("timeupdate", () => {
    if (isSeeking) return;
    if (mainAudio.duration && !isNaN(mainAudio.duration)) {
      const progress = (mainAudio.currentTime / mainAudio.duration) * 100;
      seekBar.value = progress;
      currentTimeEl.innerText = formatTime(mainAudio.currentTime);
      durationTimeEl.innerText = formatTime(mainAudio.duration);
    }
  });

  mainAudio.addEventListener("ended", () => {
    nextTrack();
  });

  // Precise seeking: update thumb + time while dragging, apply on release
  seekBar.addEventListener("input", () => {
    isSeeking = true;
    if (mainAudio.duration && !isNaN(mainAudio.duration)) {
      currentTimeEl.innerText = formatTime((seekBar.value / 100) * mainAudio.duration);
    }
  });

  seekBar.addEventListener("change", () => {
    if (mainAudio.duration && !isNaN(mainAudio.duration)) {
      mainAudio.currentTime = (seekBar.value / 100) * mainAudio.duration;
    }
    isSeeking = false;
  });

  mainAudio.addEventListener("loadedmetadata", () => {
    seekBar.value = 0;
    currentTimeEl.innerText = "0:00";
    durationTimeEl.innerText = formatTime(mainAudio.duration);
  });

// Volume Control
  musicVol.addEventListener("input", () => {
    mainAudio.volume = musicVol.value;
  });

  rainVol.addEventListener("input", () => {
    rainAudio.volume = rainVol.value;
  });

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // Render Tracklist Drawer
  function renderModalTracklist() {
    trackListUl.innerHTML = "";
    const playlist = window.PLAYLISTS[currentPlaylistIndex];

    playlist.tracks.forEach((t, idx) => {
      const li = document.createElement("li");
      li.className = `track-li ${idx === currentTrackIndex ? "active" : ""}`;
      li.innerHTML = `
        <div class="track-name-author">
          <span class="t-name">${t.title}</span>
          <span class="t-artist">${t.artist}</span>
        </div>
        <span class="t-duration">${t.duration || "3:30"}</span>
      `;
      li.addEventListener("click", () => {
        currentTrackIndex = idx;
        loadTrack(currentPlaylistIndex, currentTrackIndex);
        playAudio();
        tracklistModal.classList.remove("open");
      });
      trackListUl.appendChild(li);
    });
  }

  // Real Active Tab/User Online Counter Logic
  function initRealOnlineCounter() {
    const channel = new BroadcastChannel("teen_baje_online");
    const myId = Math.random().toString(36).substring(2, 9);
    let activePeers = new Set([myId]);

    function broadcastPing() {
      channel.postMessage({ type: "ping", id: myId });
    }

    channel.onmessage = (event) => {
      if (event.data.type === "ping") {
        activePeers.add(event.data.id);
        channel.postMessage({ type: "pong", id: myId });
      } else if (event.data.type === "pong") {
        activePeers.add(event.data.id);
      }
      updateDisplayCount();
    };

    function updateDisplayCount() {
      const count = Math.max(1, activePeers.size);
      listenerCountEl.innerText = count.toLocaleString();
    }

    setInterval(broadcastPing, 3000);
    broadcastPing();
    updateDisplayCount();
  }

// Auto-rotating Quotes Ticker
  const quoteRefreshBtn = document.getElementById("quoteRefreshBtn");

  function showNextQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % window.QUOTES.length;
    quoteTicker.style.opacity = 0;
    setTimeout(() => {
      quoteTicker.innerText = window.QUOTES[currentQuoteIndex];
      quoteTicker.style.opacity = 1;
    }, 400);
  }

  setInterval(showNextQuote, 9000);
  quoteRefreshBtn.addEventListener("click", showNextQuote);

  // Keyboard Event Shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      togglePlay();
    } else if (e.code === "KeyN") {
      nextTrack();
    } else if (e.code === "KeyP") {
      prevTrack();
    } else if (e.code === "KeyR") {
      toggleWindowRain();
    }
  });

  // Modal & Controls Event Handlers
  toggleTracklistBtn.addEventListener("click", () => tracklistModal.classList.add("open"));
  closeModalBtn.addEventListener("click", () => tracklistModal.classList.remove("open"));

  playBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", prevTrack);
  nextBtn.addEventListener("click", nextTrack);
  windowRainToggleBtn.addEventListener("click", toggleWindowRain);

initWindowRainCanvas();
  initRainState();
  initPlaylists();
});

/* Canvas Rain Engine - Confined strictly to Window Box */
function initWindowRainCanvas() {
  const container = document.getElementById("windowRainBox");
  const canvas = document.getElementById("rainCanvas");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const raindrops = [];
  const maxDrops = 100;

  for (let i = 0; i < maxDrops; i++) {
    raindrops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: Math.random() * 18 + 8,
      speed: Math.random() * 6 + 4,
      opacity: Math.random() * 0.5 + 0.2
    });
  }

  function renderRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(186, 230, 253, 0.6)";
    ctx.lineWidth = 1.3;

    raindrops.forEach(drop => {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 2, drop.y + drop.length);
      ctx.stroke();

      drop.y += drop.speed;
      drop.x -= 0.4;

      if (drop.y > canvas.height) {
        drop.y = -15;
        drop.x = Math.random() * canvas.width;
      }
    });

    requestAnimationFrame(renderRain);
  }

  renderRain();
}
