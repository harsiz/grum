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
