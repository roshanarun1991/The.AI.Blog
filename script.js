const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const nodes = Array.from(document.querySelectorAll(".pipeline-node"));

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    }
  });
}

let activeIndex = 0;

window.setInterval(() => {
  if (!nodes.length) return;
  nodes[activeIndex].classList.remove("active");
  activeIndex = (activeIndex + 1) % nodes.length;
  nodes[activeIndex].classList.add("active");
}, 1800);
