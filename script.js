/* ==========================================================================
   तीन बजे (Teen Baje) - JavaScript Application Logic (YouTube Version)
   ========================================================================== */

let ytPlayer = null;
let ytReady = false;

function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('ytPlayer', {
    height: '1',
    width: '1',
    playerVars: {
      'autoplay': 0,
      'controls': 0,
      'disablekb': 1,
      'fs': 0,
      'modestbranding': 1,
      'rel': 0
    },
    events: {
      'onReady': function() { ytReady = true; },
      'onStateChange': onYtStateChange
    }
  });
}

function onYtStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    if (window._nextTrackCallback) window._nextTrackCallback();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  
  const rainAudio = document.getElementById("rainAudio");
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
  const windowRainToggleBtn = document.getElementById("windowRainToggleBtn");
  const windowRainStatus = document.getElementById("windowRainStatus");
  const quoteTicker = document.getElementById("quoteTicker");
  const listenerCountEl = document.getElementById("listenerCount");
  const toggleTracklistBtn = document.getElementById("toggleTracklistBtn");
  const tracklistModal = document.getElementById("tracklistModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const trackListUl = document.getElementById("trackList");
  const currentPlaylistNameEl = document.getElementById("currentPlaylistName");

  let currentPlaylistIndex = 0;
  let currentTrackIndex = 0;
  let isPlaying = false;
  let isRainPlaying = false;
  let currentQuoteIndex = 0;
  let seekInterval = null;

  initRealOnlineCounter();

  window._nextTrackCallback = function() {
    nextTrack();
  };

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

  function selectPlaylist(index) {
    currentPlaylistIndex = index;
    currentTrackIndex = 0;
    const tabs = playlistTabsContainer.querySelectorAll(".playlist-tab-btn");
    tabs.forEach((tab, idx) => tab.classList.toggle("active", idx === index));
    loadTrack(currentPlaylistIndex, currentTrackIndex);
    if (isPlaying) playAudio();
  }

  function loadTrack(playlistIdx, trackIdx) {
    const playlist = window.PLAYLISTS[playlistIdx];
    const track = playlist.tracks[trackIdx];
    currentPlaylistNameEl.innerText = playlist.name;
    trackTitleEl.innerText = track.title;
    artistNameEl.innerText = track.artist;
    seekBar.value = 0;
    currentTimeEl.innerText = "0:00";
    durationTimeEl.innerText = track.duration || "3:30";
    renderModalTracklist();
  }

  function togglePlay() {
    if (isPlaying) pauseAudio();
    else playAudio();
  }

  function playAudio() {
    if (!ytReady || !ytPlayer) {
      console.log("YouTube player not ready yet");
      return;
    }
    const playlist = window.PLAYLISTS[currentPlaylistIndex];
    const track = playlist.tracks[currentTrackIndex];
    
    if (track.yt !== window._currentYtId) {
      ytPlayer.loadVideoById(track.yt);
      window._currentYtId = track.yt;
    } else {
      ytPlayer.playVideo();
    }
    
    isPlaying = true;
    playBtn.innerText = "⏸️";
    vinylDisc.classList.add("spinning");
    startTimeUpdate();
  }

  function pauseAudio() {
    if (ytPlayer) ytPlayer.pauseVideo();
    isPlaying = false;
    playBtn.innerText = "▶️";
    vinylDisc.classList.remove("spinning");
    stopTimeUpdate();
  }

  function startTimeUpdate() {
    stopTimeUpdate();
    seekInterval = setInterval(() => {
      if (ytPlayer && ytPlayer.getCurrentTime) {
        const current = ytPlayer.getCurrentTime();
        const duration = ytPlayer.getDuration();
        if (duration > 0) {
          seekBar.value = (current / duration) * 100;
          currentTimeEl.innerText = formatTime(current);
          durationTimeEl.innerText = formatTime(duration);
        }
      }
    }, 500);
  }

  function stopTimeUpdate() {
    if (seekInterval) {
      clearInterval(seekInterval);
      seekInterval = null;
    }
  }

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

  let isSeeking = false;

  seekBar.addEventListener("input", () => {
    isSeeking = true;
    if (ytPlayer && ytPlayer.getDuration) {
      const duration = ytPlayer.getDuration();
      if (duration > 0) {
        currentTimeEl.innerText = formatTime((seekBar.value / 100) * duration);
      }
    }
  });

  seekBar.addEventListener("change", () => {
    if (ytPlayer && ytPlayer.getDuration) {
      const duration = ytPlayer.getDuration();
      if (duration > 0) {
        ytPlayer.seekTo((seekBar.value / 100) * duration, true);
      }
    }
    isSeeking = false;
  });

  musicVol.addEventListener("input", () => {
    if (ytPlayer) ytPlayer.setVolume(musicVol.value * 100);
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

  function initRealOnlineCounter() {
    let visitorId = localStorage.getItem("tb_visitor_id");
    if (!visitorId) {
      visitorId = "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("tb_visitor_id", visitorId);
    }
    const endpoint = "/api/online";

    function heartbeat() {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: visitorId }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          if (data && typeof data.count === "number") {
            listenerCountEl.innerText = data.count.toLocaleString();
          }
        })
        .catch(() => {});
    }

    function refreshCount() {
      fetch(endpoint)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          if (data && typeof data.count === "number") {
            listenerCountEl.innerText = data.count.toLocaleString();
          }
        })
        .catch(() => {});
    }

    heartbeat();
    setInterval(heartbeat, 25000);
    setInterval(refreshCount, 30000);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        heartbeat();
        refreshCount();
      }
    });
  }

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

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); togglePlay(); }
    else if (e.code === "KeyN") nextTrack();
    else if (e.code === "KeyP") prevTrack();
    else if (e.code === "KeyR") toggleWindowRain();
  });

  toggleTracklistBtn.addEventListener("click", () => tracklistModal.classList.add("open"));
  closeModalBtn.addEventListener("click", () => tracklistModal.classList.remove("open"));
  playBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", prevTrack);
  nextBtn.addEventListener("click", nextTrack);
  windowRainToggleBtn.addEventListener("click", toggleWindowRain);

  initSecretScenePicker();

  initWindowRainCanvas();
  initRainState();
  initPlaylists();
  initWeatherBackground();
});

const WEATHER_BG = {
  clear: "assets/bg-clear.png",
  cloudy: "assets/bg-cloudy.png",
  foggy: "assets/bg-foggy.png",
  drizzle: "assets/bg-drizzle.png",
  rain: "assets/bg-rain.png",
  storm: "assets/bg-storm.png",
  night: "assets/bg-night.png"
};

function initSecretScenePicker() {
  const hotspot = document.getElementById("sceneHotspot");
  const menu = document.getElementById("sceneMenu");
  if (!hotspot || !menu) return;

  function highlight() {
    const cur = localStorage.getItem("tb_scene") || "auto";
    menu.querySelectorAll(".scene-opt").forEach((b) => {
      b.classList.toggle("scene-active", b.dataset.scene === cur);
    });
  }

  hotspot.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("open");
    if (isOpen) highlight();
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest(".scene-opt");
    if (!opt) return;
    const scene = opt.dataset.scene;
    if (scene === "auto") {
      localStorage.removeItem("tb_scene");
      applyWeatherBackground(weatherKeyFromCode(0, true, 0));
      setTimeout(initWeatherBackground, 50);
    } else {
      localStorage.setItem("tb_scene", scene);
      applyWeatherBackground(scene);
    }
    highlight();
    menu.classList.remove("open");
    e.stopPropagation();
  });

  document.addEventListener("click", () => menu.classList.remove("open"));
}

function weatherKeyFromCode(code, isDay, cloudCover) {
  if (code <= 1) {
    if (!isDay && cloudCover > 30) return "cloudy";
    return isDay ? "clear" : "night";
  }
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "foggy";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "foggy";
  if (code <= 82) return code === 82 ? "storm" : "rain";
  if (code <= 86) return "cloudy";
  return "storm";
}

function applyWeatherBackground(key) {
  const base = document.getElementById("bgLayerA");
  const fade = document.getElementById("bgLayerB");
  const img = WEATHER_BG[key] || WEATHER_BG.night;
  fade.style.backgroundImage = "url('" + img + "')";

  void fade.offsetWidth;
  fade.classList.add("show");
  fade.addEventListener(
    "transitionend",
    () => {
      base.style.backgroundImage = "url('" + img + "')";
      fade.classList.remove("show");
    },
    { once: true }
  );
}

function initWeatherBackground() {
  const DEFAULT_LOC = { lat: 28.62137, lon: 77.2148 };
  const choice = localStorage.getItem("tb_loc_choice");
  const override = localStorage.getItem("tb_scene");

  if (override && WEATHER_BG[override]) {
    console.log("Scene override active:", override);
    applyWeatherBackground(override);
    if (!initWeatherBackground._timer) {
      initWeatherBackground._timer = setInterval(initWeatherBackground, 30 * 60 * 1000);
    }
    return;
  }

  function fetchWeather(lat, lon) {
    return fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=" +
        lat +
        "&longitude=" +
        lon +
        "&current=weather_code,is_day,cloud_cover&timezone=auto",
      { signal: AbortSignal.timeout(8000) }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data && data.current) {
          const key = weatherKeyFromCode(
            data.current.weather_code,
            data.current.is_day === 1,
            data.current.cloud_cover
          );
          console.log("Weather:", data.current.weather_code, "is_day:", data.current.is_day, "cloud:", data.current.cloud_cover, "->", key);
          applyWeatherBackground(key);
        }
      })
      .catch(() => {});
  }

  function resolveByIp() {
    fetch("https://ip-api.com/json/", { signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((loc) => {
        if (loc && loc.status === "success" && loc.lat && loc.lon) {
          console.log("Weather location (IP):", loc.city, loc.regionName, loc.lat, loc.lon, "IP:", loc.query);
          return fetchWeather(loc.lat, loc.lon);
        }
        console.warn("IP lookup failed, using Delhi default:", loc);
        return fetchWeather(DEFAULT_LOC.lat, DEFAULT_LOC.lon);
      })
      .catch((e) => {
        console.warn("IP lookup error, using Delhi default:", e);
        return fetchWeather(DEFAULT_LOC.lat, DEFAULT_LOC.lon);
      });
  }

  function useGps() {
    if (!navigator.geolocation) {
      console.warn("GPS not supported, using IP lookup");
      return resolveByIp();
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("Weather location (GPS):", pos.coords.latitude, pos.coords.longitude);
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn("GPS denied/error, using IP lookup:", err.message);
        resolveByIp();
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  }

  if (choice === "allow") {
    useGps();
  } else if (choice === "deny") {
    resolveByIp();
  } else {
    showLocationPrompt(useGps, resolveByIp);
  }

  if (!initWeatherBackground._timer) {
    initWeatherBackground._timer = setInterval(initWeatherBackground, 30 * 60 * 1000);
  }
}

function showLocationPrompt(onAllow, onDeny) {
  const box = document.getElementById("locPrompt");
  if (!box) return onDeny();
  box.classList.add("open");
  document.getElementById("locAllowBtn").onclick = () => {
    localStorage.setItem("tb_loc_choice", "allow");
    box.classList.remove("open");
    onAllow();
  };
  document.getElementById("locDenyBtn").onclick = () => {
    localStorage.setItem("tb_loc_choice", "deny");
    box.classList.remove("open");
    onDeny();
  };
}
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
