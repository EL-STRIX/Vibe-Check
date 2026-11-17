// app.js - Main Application Logic
import { analyzeProfile } from './reactions.js';

// Loading screen lines that rotate every 1.5 seconds
const LOADING_LINES = [
  'stalking your commits...',
  'judging your commit messages...',
  'counting your stars, relax...',
  'asking your repos how they feel...'
];

let loadingInterval = null;
const THEME_STORAGE_KEY = 'vibe-check-theme';

// Helper: Safely get DOM element
function getEl(id) {
  return typeof document !== 'undefined' ? document.getElementById(id) : null;
}

// Theme Management
export function initTheme() {
  if (typeof localStorage === 'undefined' || typeof document === 'undefined') return;
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  applyTheme(savedTheme);
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  const themeIcon = getEl('theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

export function toggleTheme() {
  if (typeof document === 'undefined') return;
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// Screen Navigation
export function showScreen(screenName) {
  const screenLanding = getEl('screen-landing');
  const screenLoading = getEl('screen-loading');
  const screenResult = getEl('screen-result');

  if (screenLanding) screenLanding.hidden = (screenName !== 'landing');
  if (screenLoading) screenLoading.hidden = (screenName !== 'loading');
  if (screenResult) screenResult.hidden = (screenName !== 'result');
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Shake animation helper for input errors
export function triggerInputShake(customPlaceholder) {
  const usernameInput = getEl('username-input');
  if (!usernameInput) return;
  usernameInput.classList.remove('shake');
  void usernameInput.offsetWidth; // Force DOM reflow to restart animation
  usernameInput.classList.add('shake');
  if (customPlaceholder) {
    usernameInput.value = '';
    usernameInput.placeholder = customPlaceholder;
  }
  usernameInput.focus();
}

// Abbreviate numbers (1.2k, 3.4M) so cards never break
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  const n = Number(num);
  if (isNaN(n)) return '0';
  if (n >= 1_000_000) {
    const formatted = (n / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (n >= 1_000) {
    const formatted = (n / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
  }
  return n.toLocaleString();
}

// Loading Animation
export function startLoading() {
  showScreen('loading');
  const loadingLineEl = getEl('loading-line');
  let lineIndex = 0;
  if (loadingLineEl) {
    loadingLineEl.textContent = LOADING_LINES[0];
  }

  if (loadingInterval) clearInterval(loadingInterval);
  loadingInterval = setInterval(() => {
    lineIndex = (lineIndex + 1) % LOADING_LINES.length;
    if (loadingLineEl) {
      loadingLineEl.classList.add('fade-out');
      setTimeout(() => {
        loadingLineEl.textContent = LOADING_LINES[lineIndex];
        loadingLineEl.classList.remove('fade-out');
      }, 250);
    }
  }, 1500);
}

export function stopLoading() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

// Render Profile and Basic Stats
export function renderBasicResult(data) {
  const { profile, stats } = data;

  // 1. Profile Card
  const avatarEl = getEl('profile-avatar');
  const nameEl = getEl('profile-name');
  const handleEl = getEl('profile-handle');
  const bioEl = getEl('profile-bio');

  if (avatarEl) {
    avatarEl.style.display = 'block';
    avatarEl.src = profile.avatar || '';
    avatarEl.alt = `${profile.login}'s avatar`;
    avatarEl.onerror = () => {
      avatarEl.style.display = 'none';
    };
  }

  if (nameEl) nameEl.textContent = profile.name || profile.login;
  if (handleEl) handleEl.textContent = `@${profile.login}`;

  if (bioEl) {
    if (profile.bio && profile.bio.trim()) {
      bioEl.textContent = profile.bio.trim();
      bioEl.style.display = '-webkit-box';
    } else {
      bioEl.textContent = '';
      bioEl.style.display = 'none';
    }
  }

  // 4. Stats Row
  const reposEl = getEl('stat-repos');
  const starsEl = getEl('stat-stars');
  const commitsEl = getEl('stat-commits');
  const prsEl = getEl('stat-prs');
  const followersEl = getEl('stat-followers');
  const streakEl = getEl('stat-streak');

  if (reposEl) reposEl.textContent = formatNumber(profile.publicRepos || 0);
  if (starsEl) starsEl.textContent = formatNumber(stats.stars || 0);
  if (commitsEl) commitsEl.textContent = formatNumber(stats.commits || 0);
  if (prsEl) prsEl.textContent = formatNumber(stats.prsMerged || 0);
  if (followersEl) followersEl.textContent = formatNumber(profile.followers || 0);
  if (streakEl) streakEl.textContent = formatNumber(stats.longestStreak || 0);
}

// Render Full Result including Reaction Engine
export function renderFullResult(data) {
  // 1. Render Basic Profile & Stats
  renderBasicResult(data);

  // Run Reaction Engine
  const analysis = analyzeProfile(data);

  // 2. Dev Title & Vibe Score
  const scoreNumEl = getEl('score-number');
  const scoreLabelEl = getEl('score-label');
  const devTitleEl = getEl('dev-title');

  if (scoreNumEl) scoreNumEl.textContent = analysis.score;
  if (scoreLabelEl) scoreLabelEl.textContent = analysis.label;
  if (devTitleEl) devTitleEl.textContent = analysis.title;

  // 3. Reaction Lines (2-3 short lines)
  const reactionLinesEl = getEl('reaction-lines');
  if (reactionLinesEl) {
    reactionLinesEl.innerHTML = '';
    analysis.reactionLines.forEach(line => {
      const p = document.createElement('p');
      p.className = 'reaction-line';
      p.textContent = line;
      reactionLinesEl.appendChild(p);
    });
  }

  // 8. Badges (small pills, max 4)
  const badgesContainerEl = getEl('badges-container');
  if (badgesContainerEl) {
    badgesContainerEl.innerHTML = '';
    if (analysis.badges && analysis.badges.length > 0) {
      analysis.badges.forEach(badge => {
        const pill = document.createElement('span');
        pill.className = 'badge-pill';
        pill.textContent = badge;
        badgesContainerEl.appendChild(pill);
      });
      badgesContainerEl.style.display = 'flex';
    } else {
      badgesContainerEl.style.display = 'none';
    }
  }

  // 9. Verdict
  const verdictTextEl = getEl('verdict-text');
  if (verdictTextEl) {
    verdictTextEl.textContent = `"${analysis.verdict}"`;
  }

  return analysis;
}

// Fetch vibe data from serverless API
export async function handleCheckVibe(rawInput) {
  const username = rawInput ? rawInput.trim() : '';
  if (!username) {
    triggerInputShake('type something bestie');
    return;
  }

  startLoading();

  try {
    const res = await fetch(`/api/vibe?user=${encodeURIComponent(username)}`);
    const data = await res.json();
    stopLoading();

    if (!res.ok || data.error) {
      showScreen('landing');
      if (data.error === 'not_found') {
        triggerInputShake("this id doesn't exist. did you make it up? 💀 try again");
      } else if (data.error === 'rate_limited') {
        triggerInputShake("github is tired rn, try again in a minute");
      } else {
        triggerInputShake("github is tired rn, try again in a minute");
      }
      return;
    }

    renderFullResult(data);
    showScreen('result');
  } catch (err) {
    stopLoading();
    showScreen('landing');
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      triggerInputShake("you're offline. touch grass, then come back");
    } else {
      triggerInputShake("github is tired rn, try again in a minute");
    }
  }
}

// Browser Initialization
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const themeToggleBtn = getEl('theme-toggle');
  const vibeForm = getEl('vibe-form');
  const usernameInput = getEl('username-input');
  const tryAnotherBtn = getEl('try-another-btn');

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
      handleCheckVibe(value);
    });
  }

  if (tryAnotherBtn) {
    tryAnotherBtn.addEventListener('click', () => {
      showScreen('landing');
      if (usernameInput) {
        usernameInput.value = '';
        usernameInput.placeholder = 'github username or profile url';
        usernameInput.focus();
      }
    });
  }

  initTheme();
  showScreen('landing');
}
