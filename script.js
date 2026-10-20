(function fitCheck() {
  function check() {
    const fits = document.body.scrollHeight <= window.innerHeight;
    document.body.classList.toggle("fits", fits);
  }

  check();
  window.addEventListener("resize", check);
  window.fitCheck = check;
})();

(function dropdowns() {
  const pairs = [
    ["socials-toggle", "socials-list"],
    ["projects-toggle", "projects-list"],
    ["donate-toggle", "donate-list"],
  ];

  pairs.forEach(([toggleId, wrapId]) => {
    const toggle = document.getElementById(toggleId);
    const wrap = document.getElementById(wrapId);
    if (!toggle || !wrap) return;

    toggle.addEventListener("click", () => {
      const open = wrap.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      window.fitCheck();
      wrap.addEventListener("transitionend", window.fitCheck, { once: true });
    });
  });
})();

(function copyButtons() {
  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  document.querySelectorAll(".copy-btn").forEach((btn) => {
    let resetTimer;
    btn.addEventListener("click", async () => {
      const address = btn.dataset.address;
      if (!address) return;

      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(address);
          copied = true;
        } catch (err) {
          copied = fallbackCopy(address);
        }
      } else {
        copied = fallbackCopy(address);
      }

      if (!copied) return;

      btn.classList.add("copied");
      btn.setAttribute("aria-label", "copied");
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        btn.classList.remove("copied");
        btn.setAttribute("aria-label", "copy address");
      }, 1500);
    });
  });
})();

// Songs are hosted on assets.jshrsz.dev. Shape: { title, artist, src }
// Small gif shown on the music bar between songs. Falls back to a spinner if empty.
const LOADING_GIF = "https://assets.jshrsz.dev/u/loading-chibi.gif";

const SONGS = [
  { title: "mosi mosi?", artist: "sanane (cv: saba)", src: "https://assets.jshrsz.dev/u/mosi-mosi-saba.mp3" },
  { title: "mutual panorama", artist: "mitsukiyo ft. aitsuki nakuru", src: "https://assets.jshrsz.dev/u/mutual-pano.mp3" },
  { title: "snow halation", artist: "μ's", src: "https://assets.jshrsz.dev/u/snow-halation.mp3" },
  { title: "galtic love", artist: "ebareshi", src: "https://assets.jshrsz.dev/u/GALticLove.mp3" },
  { title: "lunaria", artist: "krimek ft. michiri9", src: "https://assets.jshrsz.dev/u/Krimek%20feat.%20michiri9%20-%20Lunaria.mp3" },
  { title: "killy killy joker", artist: "kanon wakeshima", src: "https://assets.jshrsz.dev/u/killy%20killy%20JOKER%20%5BW6I1xm49Lpw%5D.mp3" },
  { title: "wasureji no saihate", artist: "nayuta", src: "https://assets.jshrsz.dev/u/nayuta%20-%20Wasureji%20no%20Saihate.mp3" },
];

(function musicPlayer() {
  const VOLUME = 0.75;
  const FADE_MS = 700;
  const NEXT_DELAY_MS = 1000;

  const btn = document.getElementById("music-btn");
  const popup = document.getElementById("music-popup");
  const titleEl = document.getElementById("music-title");
  const artistEl = document.getElementById("music-artist");
  const playBtn = document.getElementById("music-play");
  const seek = document.getElementById("music-seek");
  const timeEl = document.getElementById("music-time");
  if (!btn || !popup || !SONGS.length) return;

  btn.hidden = false;

  const picker = document.getElementById("music-picker");
  const listEl = document.getElementById("music-list");
  const controlsEl = document.getElementById("music-controls");
  const loadingEl = document.getElementById("music-loading");

  if (LOADING_GIF) loadingEl.style.backgroundImage = 'url("' + LOADING_GIF + '")';
  else loadingEl.classList.add("spinner");

  let nextTimer = 0;

  function setLoading(on) {
    loadingEl.hidden = !on;
    controlsEl.classList.toggle("loading", on);
  }

  function cancelNext() {
    clearTimeout(nextTimer);
    nextTimer = 0;
    setLoading(false);
  }

  const audio = new Audio();
  audio.preload = "none";
  audio.volume = 0;

  let fadeId = 0;
  let endFading = false;
  let seeking = false;

  function fadeTo(target, ms, done) {
    const id = ++fadeId;
    const from = audio.volume;
    const start = performance.now();
    function step(now) {
      if (id !== fadeId) return;
      const t = ms > 0 ? Math.min((now - start) / ms, 1) : 1;
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * t));
      if (t < 1) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
  }

  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    return m + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  }

  function setPlaying(on) {
    playBtn.classList.toggle("playing", on);
    playBtn.setAttribute("aria-label", on ? "pause" : "play");
  }

  let current = -1;

  function loadSong(i, autoplay) {
    cancelNext();
    current = i;
    const song = SONGS[i];
    fadeId++;
    audio.pause();
    audio.src = song.src;
    audio.volume = 0;
    endFading = false;
    seek.value = "0";
    timeEl.textContent = "0:00";
    titleEl.textContent = song.title;
    artistEl.textContent = song.artist;
    setPlaying(false);
    listEl.querySelectorAll(".music-option").forEach((o, idx) => {
      o.setAttribute("aria-selected", String(idx === i));
    });
    if (autoplay) play();
  }

  function play() {
    endFading = false;
    audio.volume = 0;
    audio.play().then(() => {
      setPlaying(true);
      fadeTo(VOLUME, FADE_MS);
    }).catch(() => setPlaying(false));
  }

  function pause() {
    setPlaying(false);
    fadeTo(0, FADE_MS, () => audio.pause());
  }

  playBtn.addEventListener("click", () => {
    if (playBtn.classList.contains("playing")) pause();
    else play();
  });

  audio.addEventListener("timeupdate", () => {
    if (!seeking && audio.duration) {
      seek.value = String((audio.currentTime / audio.duration) * 1000);
    }
    timeEl.textContent = fmt(audio.currentTime);

    if (!audio.duration || audio.paused) return;
    const remaining = audio.duration - audio.currentTime;
    const fadeSec = FADE_MS / 1000;
    if (remaining <= fadeSec && !endFading) {
      endFading = true;
      fadeTo(0, Math.max(remaining * 1000, 0));
    } else if (remaining > fadeSec + 0.2 && endFading) {
      endFading = false;
      fadeTo(VOLUME, FADE_MS);
    }
  });

  audio.addEventListener("ended", () => {
    setPlaying(false);
    audio.currentTime = 0;
    seek.value = "0";
    timeEl.textContent = "0:00";
    setLoading(true);
    nextTimer = setTimeout(() => {
      loadSong((current + 1) % SONGS.length, true);
    }, NEXT_DELAY_MS);
  });

  seek.addEventListener("input", () => {
    seeking = true;
    if (audio.duration) {
      timeEl.textContent = fmt((seek.value / 1000) * audio.duration);
    }
  });
  seek.addEventListener("change", () => {
    seeking = false;
    if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
  });

  if (SONGS.length > 1) {
    picker.classList.add("multi");
    SONGS.forEach((song, i) => {
      const li = document.createElement("li");
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "music-option";
      opt.setAttribute("role", "option");
      opt.innerHTML = "<span></span><small></small>";
      opt.firstChild.textContent = song.title;
      opt.lastChild.textContent = song.artist;
      opt.addEventListener("click", () => {
        const wasPlaying = playBtn.classList.contains("playing");
        if (i !== current) loadSong(i, wasPlaying);
        picker.classList.add("dismissed");
        document.activeElement.blur();
      });
      li.appendChild(opt);
      listEl.appendChild(li);
    });
  }

  // Clicking the title while the list is showing closes it. Hover would
  // otherwise keep it open, so it stays dismissed until the pointer leaves.
  const currentBtn = document.getElementById("music-current");
  let listWasOpen = false;
  currentBtn.addEventListener("pointerdown", () => {
    listWasOpen = getComputedStyle(listEl).display !== "none";
  });
  currentBtn.addEventListener("click", () => {
    const wasOpen = listWasOpen;
    listWasOpen = false;
    if (!picker.classList.contains("multi") || !wasOpen) return;
    picker.classList.add("dismissed");
    currentBtn.blur();
  });
  picker.addEventListener("pointerleave", () => picker.classList.remove("dismissed"));
  picker.addEventListener("focusin", () => picker.classList.remove("dismissed"));

  loadSong(Math.floor(Math.random() * SONGS.length), false);

  function setOpen(open) {
    popup.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(popup.hidden);
  });
  document.addEventListener("click", (e) => {
    if (!popup.hidden && !popup.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !popup.hidden) {
      setOpen(false);
      btn.focus();
    }
  });
})();
