// app.js - Main Application Logic

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const screenLanding = document.getElementById('screen-landing');
const screenLoading = document.getElementById('screen-loading');
const screenResult = document.getElementById('screen-result');
const vibeForm = document.getElementById('vibe-form');
const usernameInput = document.getElementById('username-input');

// Theme Management
const THEME_STORAGE_KEY = 'vibe-check-theme';

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// Screen Navigation
export function showScreen(screenName) {
  if (screenLanding) screenLanding.hidden = (screenName !== 'landing');
  if (screenLoading) screenLoading.hidden = (screenName !== 'loading');
  if (screenResult) screenResult.hidden = (screenName !== 'result');
}

// Shake animation helper for empty or invalid input
function triggerInputShake(customPlaceholder) {
  if (!usernameInput) return;
  usernameInput.classList.remove('shake');
  void usernameInput.offsetWidth; // Force DOM reflow to restart animation
  usernameInput.classList.add('shake');
  if (customPlaceholder) {
    usernameInput.placeholder = customPlaceholder;
  }
  usernameInput.focus();
}

// Event Listeners
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', toggleTheme);
}

if (vibeForm) {
  vibeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = usernameInput?.value?.trim();
    if (!value) {
      triggerInputShake('type something bestie');
      return;
    }
    // Form submission processing will be wired in Phase 3
  });
}

// Initialize on DOM load
initTheme();
showScreen('landing');
