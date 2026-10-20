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
const SONGS = [
  { title: "mosi mosi?", artist: "sanane (cv: saba)", src: "https://assets.jshrsz.dev/u/mosi-mosi-saba.mp3" },
];

(function musicPlayer() {
  const VOLUME = 0.75;
  const FADE_MS = 700;

  const btn = document.getElementById("music-btn");
  const popup = document.getElementById("music-popup");
  const titleEl = document.getElementById("music-title");
  const artistEl = document.getElementById("music-artist");
  const playBtn = document.getElementById("music-play");
  const seek = document.getElementById("music-seek");
  const timeEl = document.getElementById("music-time");
  if (!btn || !popup || !SONGS.length) return;

  btn.hidden = false;

  const song = SONGS[Math.floor(Math.random() * SONGS.length)];
  titleEl.textContent = song.title;
  artistEl.textContent = song.artist;

  const audio = new Audio();
  audio.preload = "none";
  audio.src = song.src;
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
