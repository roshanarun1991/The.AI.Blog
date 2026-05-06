const tabs = Array.from(document.querySelectorAll("[data-view]"));
const panels = Array.from(document.querySelectorAll("[data-view-panel]"));
const rows = Array.from(document.querySelectorAll(".post-row"));
const filterChips = Array.from(document.querySelectorAll("[data-filter]"));
const viewJumps = Array.from(document.querySelectorAll("[data-view-jump]"));
let audioContext;

function playTone(type = "click") {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  audioContext ||= new AudioCtx();
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(type === "tab" ? 660 : 440, now);
  oscillator.frequency.exponentialRampToValueAtTime(type === "tab" ? 990 : 620, now + 0.055);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.105);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.12);
}

function updateScrollTint() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(window.scrollY / maxScroll, 1);
  document.body.style.setProperty("--scroll-tint", (progress * 0.18).toFixed(3));
}

function setPanelCount(view, count) {
  const panel = panels.find((item) => item.dataset.viewPanel === view);
  const countNode = panel?.querySelector(".page-title span");
  if (countNode) {
    countNode.textContent = `(${String(count).padStart(2, "0")})`;
  }
}

setPanelCount("blog", document.querySelectorAll("#blog .post-row").length);
setPanelCount("projects", document.querySelectorAll("#projects .post-row").length);
setPanelCount("github", document.querySelectorAll("#github .repo-grid a").length);
setPanelCount("resources", document.querySelectorAll("#resources .resource-row").length);

function showView(view) {
  document.querySelectorAll("[data-view]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });

  if (window.location.hash !== `#${view}`) {
    history.replaceState(null, "", `#${view}`);
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    playTone("tab");
    showView(tab.dataset.view);
  });
});

viewJumps.forEach((button) => {
  button.addEventListener("click", () => {
    playTone("tab");
    showView(button.dataset.viewJump);
  });
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    playTone("click");
    const filter = chip.dataset.filter;
    filterChips.forEach((item) => item.classList.toggle("active", item === chip));

    document.querySelectorAll("#blog .post-row").forEach((row) => {
      const topics = row.dataset.topics || "";
      row.classList.toggle("hidden", filter !== "all" && !topics.includes(filter));
    });
  });
});

rows.forEach((row) => {
  const button = row.querySelector(".row-main");
  if (!button) return;

  button.addEventListener("click", () => {
    playTone("click");
    const isOpen = row.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
});

document.querySelectorAll(".repo-grid a, .resource-row, .mark, .console-link, .row-detail a").forEach((item) => {
  item.addEventListener("click", () => playTone("click"));
});

window.addEventListener("scroll", updateScrollTint, { passive: true });
updateScrollTint();

const mazeDots = Array.from(document.querySelectorAll(".maze-dot"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function runMazeEating() {
  mazeDots.forEach((dot) => dot.classList.remove("eaten"));

  mazeDots.forEach((dot, index) => {
    window.setTimeout(() => {
      dot.classList.add("eaten");
    }, 620 + index * 390);
  });
}

if (mazeDots.length && !reduceMotion) {
  runMazeEating();
  window.setInterval(runMazeEating, 7200);
}

showView("home");
