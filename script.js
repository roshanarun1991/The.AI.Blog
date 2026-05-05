const tabs = Array.from(document.querySelectorAll("[data-view]"));
const panels = Array.from(document.querySelectorAll("[data-view-panel]"));
const rows = Array.from(document.querySelectorAll(".post-row"));
const filterChips = Array.from(document.querySelectorAll("[data-filter]"));
const viewJumps = Array.from(document.querySelectorAll("[data-view-jump]"));
const homeMachine = document.querySelector(".home-machine");
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

if (homeMachine) {
  homeMachine.addEventListener("pointermove", (event) => {
    const rect = homeMachine.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    homeMachine.style.setProperty("--bot-x", `${(x * 18).toFixed(1)}px`);
    homeMachine.style.setProperty("--bot-y", `${(y * 12).toFixed(1)}px`);
    homeMachine.style.setProperty("--bot-tilt", `${(x * 5).toFixed(1)}deg`);
    homeMachine.style.transform = `translateY(${(y * -5).toFixed(1)}px)`;
  });

  homeMachine.addEventListener("pointerleave", () => {
    homeMachine.style.setProperty("--bot-x", "0px");
    homeMachine.style.setProperty("--bot-y", "0px");
    homeMachine.style.setProperty("--bot-tilt", "0deg");
    homeMachine.style.transform = "translateY(0)";
  });
}

const marsCanvas = document.querySelector("#marsBotCanvas");

if (marsCanvas) {
  const ctx = marsCanvas.getContext("2d");
  const state = { pointerX: 0, pointerY: 0, targetX: 0, targetY: 0 };

  const drawRoundRect = (x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  };

  const fillRoundRect = (x, y, width, height, radius, fill, stroke = "#1e1e1e", line = 4) => {
    drawRoundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = line;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };

  const drawEye = (x, y, t, px, py) => {
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 28);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.35, "rgba(255,255,255,0.9)");
    glow.addColorStop(1, "rgba(80,220,235,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    const blink = Math.sin(t * 0.0027) > 0.965 ? 0.18 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, blink);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(px * 5, py * 4, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawChip = (label, x, y, t, delay) => {
    const bob = Math.sin(t * 0.002 + delay) * 8;
    ctx.save();
    ctx.translate(x, y + bob);
    fillRoundRect(-38, -18, 76, 36, 8, "rgba(251,248,251,0.92)", "#1e1e1e", 2);
    ctx.font = "16px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#1e1e1e";
    ctx.fillText(label, 0, 1);
    ctx.restore();
  };

  const drawBot = (time) => {
    const dpr = window.devicePixelRatio || 1;
    const size = marsCanvas.clientWidth || 440;
    const pixels = Math.floor(size * dpr);
    if (marsCanvas.width !== pixels || marsCanvas.height !== pixels) {
      marsCanvas.width = pixels;
      marsCanvas.height = pixels;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    state.pointerX += (state.targetX - state.pointerX) * 0.08;
    state.pointerY += (state.targetY - state.pointerY) * 0.08;

    const t = time;
    const cx = size / 2 + state.pointerX * 16;
    const bob = Math.sin(t * 0.002) * 10 + state.pointerY * 8;
    const tilt = state.pointerX * 0.045 + Math.sin(t * 0.0015) * 0.025;
    const s = size / 640;

    ctx.save();
    ctx.translate(cx, 40 * s + bob);
    ctx.scale(s, s);
    ctx.rotate(tilt);

    // soft platform shadow
    ctx.save();
    ctx.translate(0, 520);
    ctx.scale(1 + Math.sin(t * 0.002) * 0.04, 1);
    const shadow = ctx.createRadialGradient(0, 0, 20, 0, 0, 155);
    shadow.addColorStop(0, "rgba(30,30,30,0.20)");
    shadow.addColorStop(1, "rgba(30,30,30,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 170, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawChip("LLM", -194, 128, t, 0);
    drawChip("API", 198, 154, t, 1.2);
    drawChip("RAG", -162, 348, t, 2.1);

    // antenna halo
    ctx.strokeStyle = "rgba(80,220,235,0.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 110, 188 + Math.sin(t * 0.002) * 8, 54, -0.15, 0, Math.PI * 2);
    ctx.stroke();

    // arms behind
    const armSwing = Math.sin(t * 0.003) * 12;
    ctx.save();
    ctx.translate(-154, 292);
    ctx.rotate((22 + armSwing) * Math.PI / 180);
    const armGrad = ctx.createLinearGradient(-26, 0, 26, 112);
    armGrad.addColorStop(0, "#e8e5df");
    armGrad.addColorStop(1, "#2d77cf");
    fillRoundRect(-24, 0, 48, 118, 22, armGrad, "#1e1e1e", 3);
    fillRoundRect(-18, 104, 36, 28, 12, "#dedad2", "#1e1e1e", 3);
    ctx.restore();

    ctx.save();
    ctx.translate(154, 292);
    ctx.rotate((-18 - armSwing * 0.8) * Math.PI / 180);
    const armGradR = ctx.createLinearGradient(-26, 0, 26, 112);
    armGradR.addColorStop(0, "#e8e5df");
    armGradR.addColorStop(1, "#2d77cf");
    fillRoundRect(-24, 0, 48, 118, 22, armGradR, "#1e1e1e", 3);
    fillRoundRect(-18, 104, 36, 28, 12, "#dedad2", "#1e1e1e", 3);
    ctx.restore();

    // legs
    fillRoundRect(-72, 398, 34, 82, 16, "#2c2b2c", "#1e1e1e", 3);
    fillRoundRect(38, 398, 34, 82, 16, "#2c2b2c", "#1e1e1e", 3);
    fillRoundRect(-104, 462 + Math.sin(t * 0.004) * 3, 78, 42, 16, "#e4e0d8", "#1e1e1e", 3);
    fillRoundRect(26, 462 + Math.cos(t * 0.004) * 3, 78, 42, 16, "#e4e0d8", "#1e1e1e", 3);

    // torso
    const torsoGrad = ctx.createLinearGradient(-94, 246, 96, 394);
    torsoGrad.addColorStop(0, "#fffaf3");
    torsoGrad.addColorStop(0.55, "#cbc4ba");
    torsoGrad.addColorStop(1, "#7d7770");
    fillRoundRect(-98, 232, 196, 174, 38, torsoGrad, "#1e1e1e", 4);

    ctx.fillStyle = "rgba(80,220,235,0.85)";
    ctx.beginPath();
    ctx.arc(-44, 274, 8 + Math.sin(t * 0.006) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(196,232,23,0.85)";
    ctx.beginPath();
    ctx.arc(42, 274, 7 + Math.cos(t * 0.005) * 2, 0, Math.PI * 2);
    ctx.fill();

    fillRoundRect(-50, 304, 100, 70, 18, "rgba(20,19,22,0.92)", "#1e1e1e", 3);
    ctx.fillStyle = "#c4e817";
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(-34 + i * 20, 334, 12, 18 + Math.sin(t * 0.005 + i) * 8);
    }

    // neck
    fillRoundRect(-38, 202, 76, 40, 16, "#9c968f", "#1e1e1e", 3);

    // head shell
    const shell = ctx.createLinearGradient(-144, 40, 144, 214);
    shell.addColorStop(0, "#ffffff");
    shell.addColorStop(0.45, "#d9d3ca");
    shell.addColorStop(1, "#7a746d");
    fillRoundRect(-152, 34, 304, 190, 62, shell, "#1e1e1e", 4);

    // RGB rim
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    const hueShift = Math.sin(t * 0.0018);
    const rim = ctx.createLinearGradient(-126, 72, 126, 210);
    rim.addColorStop(0, "#50dce9");
    rim.addColorStop(0.45, hueShift > 0 ? "#7b61ff" : "#c4e817");
    rim.addColorStop(1, "#f58f72");
    ctx.strokeStyle = rim;
    drawRoundRect(-122, 68, 244, 122, 38);
    ctx.stroke();

    // visor
    drawRoundRect(-112, 74, 224, 112, 32);
    const visor = ctx.createLinearGradient(-112, 74, 112, 186);
    visor.addColorStop(0, "#11131b");
    visor.addColorStop(0.5, "#050508");
    visor.addColorStop(1, "#201c26");
    ctx.fillStyle = visor;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1e1e1e";
    ctx.stroke();

    // visor grid
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "rgba(80,220,235,0.14)";
    ctx.lineWidth = 1;
    for (let gx = -102; gx <= 102; gx += 22) {
      ctx.beginPath();
      ctx.moveTo(gx, 74);
      ctx.lineTo(gx, 186);
      ctx.stroke();
    }
    for (let gy = 84; gy <= 176; gy += 22) {
      ctx.beginPath();
      ctx.moveTo(-112, gy);
      ctx.lineTo(112, gy);
      ctx.stroke();
    }
    ctx.restore();

    drawEye(-45, 128, t, state.pointerX, state.pointerY);
    drawEye(45, 128, t, state.pointerX, state.pointerY);

    // antenna glow
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.lineTo(0, 2);
    ctx.stroke();
    ctx.fillStyle = "#c4e817";
    ctx.beginPath();
    ctx.arc(0, -8, 13 + Math.sin(t * 0.005) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // tiny drifting sparks
    for (let i = 0; i < 9; i += 1) {
      const a = t * 0.001 + i * 0.72;
      const r = 178 + Math.sin(t * 0.001 + i) * 22;
      ctx.fillStyle = i % 3 === 0 ? "#c4e817" : i % 3 === 1 ? "#50dce9" : "#f58f72";
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, 176 + Math.sin(a * 1.4) * 126, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    requestAnimationFrame(drawBot);
  };

  marsCanvas.addEventListener("pointermove", (event) => {
    const rect = marsCanvas.getBoundingClientRect();
    state.targetX = (event.clientX - rect.left) / rect.width - 0.5;
    state.targetY = (event.clientY - rect.top) / rect.height - 0.5;
  });

  marsCanvas.addEventListener("pointerleave", () => {
    state.targetX = 0;
    state.targetY = 0;
  });

  requestAnimationFrame(drawBot);
}

const initialView = window.location.hash.replace("#", "");
if (tabs.some((tab) => tab.dataset.view === initialView)) {
  showView(initialView);
} else {
  showView("home");
}
