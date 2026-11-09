/**
 * theme.js — Light/Dark theme toggle for CP Club VJTI Blog
 */

(function () {
  const STORAGE_KEY = 'cpclub-theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = theme === DARK
        ? '<span>☀️</span><span class="toggle-label">Light</span>'
        : '<span>🌙</span><span class="toggle-label">Dark</span>';
      btn.setAttribute('aria-label', theme === DARK ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  // Apply immediately to avoid flash
  applyTheme(getPreferredTheme());

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === DARK ? LIGHT : DARK);
  };

  // Re-apply on DOMContentLoaded to update button text
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getPreferredTheme());
  });
})();
