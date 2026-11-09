"use strict";

const THEME_STORAGE_KEY = "system-flow-stock-theme";
const themeToggle = document.getElementById("theme-toggle");

function setTheme(theme, persist = false) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);

  if (themeToggle) {
    const label = isDark ? "Modo claro" : "Modo noturno";
    const accessibleLabel = isDark ? "Ativar modo claro" : "Ativar modo noturno";
    const labelElement = themeToggle.querySelector(".theme-label");
    const iconElement = themeToggle.querySelector(".theme-icon");

    themeToggle.setAttribute("aria-label", accessibleLabel);
    themeToggle.setAttribute("title", accessibleLabel);
    if (labelElement) labelElement.textContent = label;
    if (iconElement) iconElement.textContent = isDark ? "☀" : "☾";
  }

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
    } catch (error) {
      console.error("Não foi possível salvar a preferência de tema.", error);
    }
  }
}

let savedTheme = "light";
try {
  savedTheme = localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
} catch (error) {
  console.error("Não foi possível carregar a preferência de tema.", error);
}
setTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", (event) => {
    const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    const changeTheme = () => setTheme(nextTheme, true);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!document.startViewTransition || prefersReducedMotion) {
      changeTheme();
      return;
    }

    const bounds = themeToggle.getBoundingClientRect();
    const originX = event.detail === 0 ? bounds.left + bounds.width / 2 : event.clientX;
    const originY = event.detail === 0 ? bounds.top + bounds.height / 2 : event.clientY;
    document.documentElement.style.setProperty("--theme-transition-x", `${originX}px`);
    document.documentElement.style.setProperty("--theme-transition-y", `${originY}px`);

    document.startViewTransition(changeTheme);
  });
}
