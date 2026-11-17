// app.js - Main Application Logic, Visual Extras & Edge Cases
import { analyzeProfile } from './reactions.js';

// Loading screen lines that rotate every 1.5 seconds
const LOADING_LINES = [
  'stalking your commits...',
  'judging your commit messages...',
  'counting your stars, relax...',
  'asking your repos how they feel...'
];

let loadingInterval = null;
let lastAttemptedUser = '';
const THEME_STORAGE_KEY = 'vibe-check-theme';

// Standard GitHub language colors
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Rust: '#dea584',
  Go: '#00ADD8',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Java: '#b07219',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00'
};

const FALLBACK_PALETTE = ['#A78BFA', '#F472B6', '#FB923C', '#38BDF8', '#4ADE80', '#FBBF24'];

function getLanguageColor(name, index) {
  if (LANGUAGE_COLORS[name]) return LANGUAGE_COLORS[name];
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

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

// Clean and normalize username input (removes @, accepts URLs)
export function cleanInputUsername(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();

  // If pasted profile link (e.g., https://github.com/octocat or github.com/octocat/)
  if (cleaned.includes('github.com') || cleaned.includes('/')) {
    cleaned = cleaned.split('?')[0].split('#')[0];
    cleaned = cleaned.replace(/\/+$/, '');
    const parts = cleaned.split('/');
    cleaned = parts[parts.length - 1];
  }

  // Remove leading @
  cleaned = cleaned.replace(/^@+/, '').trim();
  return cleaned;
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

// Error Banner handling with Retry button
export function showError(message, showRetry = false) {
  const banner = getEl('error-banner');
  const msgEl = getEl('error-message');
  const retryBtn = getEl('retry-btn');

  if (!banner || !msgEl) return;
  msgEl.textContent = message;
  if (retryBtn) {
    retryBtn.hidden = !showRetry;
  }
  banner.hidden = false;
}

export function hideError() {
  const banner = getEl('error-banner');
  if (banner) banner.hidden = true;
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

// Count-up animation for numbers (under 0.8s)
export function animateCountUp(element, target, duration = 600, isFormatted = false) {
  if (!element) return;
  const targetNum = Number(target) || 0;
  if (targetNum <= 0) {
    element.textContent = isFormatted ? formatNumber(0) : '0';
    return;
  }
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(targetNum * ease);
    element.textContent = isFormatted ? formatNumber(current) : current;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = isFormatted ? formatNumber(targetNum) : targetNum;
    }
  }
  requestAnimationFrame(update);
}

// Loading Animation
export function startLoading() {
  hideError();
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

// Confetti burst for high scores (>= 80)
export function triggerConfetti() {
  if (typeof window !== 'undefined' && typeof window.confetti === 'function') {
    window.confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#A78BFA', '#F472B6', '#FB923C', '#E9D5FF', '#FDF2F8'],
      ticks: 200,
      disableForReducedMotion: true
    });
  }
}

// Render Smooth SVG Score Ring
export function renderScoreRing(score) {
  const circleEl = getEl('score-ring-circle');
  const scoreNumEl = getEl('score-number');
  const circumference = 263.89; // 2 * PI * 42

  if (scoreNumEl) {
    animateCountUp(scoreNumEl, score, 650, false);
  }

  if (circleEl) {
    circleEl.style.strokeDashoffset = circumference;
    const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
    requestAnimationFrame(() => {
      circleEl.style.strokeDashoffset = offset;
    });
  }
}

// Render Top 4 Languages Bar & Legend
export function renderLanguageBar(languages) {
  const barEl = getEl('language-bar');
  const legendEl = getEl('language-legend');
  if (!barEl || !legendEl) return;

  barEl.innerHTML = '';
  legendEl.innerHTML = '';

  if (!languages || languages.length === 0) {
    legendEl.innerHTML = '<span class="legend-item" style="color:var(--muted-text);">no public code languages detected</span>';
    return;
  }

  languages.forEach((lang, idx) => {
    const color = getLanguageColor(lang.name, idx);

    // Bar segment
    const segment = document.createElement('div');
    segment.className = 'lang-segment';
    segment.style.width = `${lang.percent}%`;
    segment.style.backgroundColor = color;
    segment.title = `${lang.name}: ${lang.percent}%`;
    barEl.appendChild(segment);

    // Legend item
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="lang-dot" style="background-color:${color};"></span>
      <span class="lang-name">${lang.name}</span>
      <span class="lang-pct">${lang.percent}%</span>
    `;
    legendEl.appendChild(item);
  });
}

// Render Mini Contribution Heatmap (SVG)
export function renderHeatmap(calendar) {
  const chartEl = getEl('heatmap-chart');
  if (!chartEl) return;

  chartEl.innerHTML = '';

  if (!calendar || calendar.length === 0) {
    chartEl.innerHTML = '<p class="heatmap-empty-msg">contribution graph unlocks with your github token ✨</p>';
    return;
  }

  const weeks = [];
  let currentWeek = [];

  calendar.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === calendar.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const cellSize = 8;
  const cellGap = 3;
  const colWidth = cellSize + cellGap;
  const totalWidth = weeks.length * colWidth;
  const totalHeight = 7 * colWidth;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  svg.setAttribute('width', `${totalWidth}`);
  svg.setAttribute('height', `${totalHeight}`);

  weeks.forEach((week, wIdx) => {
    week.forEach((day, dIdx) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', `${wIdx * colWidth}`);
      rect.setAttribute('y', `${dIdx * colWidth}`);
      rect.setAttribute('width', `${cellSize}`);
      rect.setAttribute('height', `${cellSize}`);
      rect.setAttribute('rx', '2');

      const count = day.count || 0;
      let fill = 'var(--heatmap-empty)';
      if (count >= 8) fill = 'rgba(251, 146, 60, 0.95)';
      else if (count >= 4) fill = 'rgba(244, 114, 182, 0.75)';
      else if (count >= 1) fill = 'rgba(167, 139, 250, 0.55)';

      rect.setAttribute('fill', fill);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${day.date}: ${count} contribution${count === 1 ? '' : 's'}`;
      rect.appendChild(title);

      svg.appendChild(rect);
    });
  });

  chartEl.appendChild(svg);
}

// Render Top 2 Repos
export function renderTopRepos(repos) {
  const listEl = getEl('repos-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (!repos || repos.length === 0) {
    listEl.innerHTML = '<p class="heatmap-empty-msg">no public repos. mysterious. we respect it.</p>';
    return;
  }

  repos.forEach((repo, idx) => {
    const color = getLanguageColor(repo.language || 'Plain Text', idx);
    const item = document.createElement('div');
    item.className = 'repo-item';
    item.innerHTML = `
      <span class="repo-title" title="${repo.name}">${repo.name}</span>
      <div class="repo-meta">
        <span class="repo-stat">
          <span class="lang-dot" style="background-color:${color};"></span>
          ${repo.language || 'Code'}
        </span>
        <span class="repo-stat">
          ⭐ ${formatNumber(repo.stars || 0)}
        </span>
      </div>
    `;
    listEl.appendChild(item);
  });
}

// Stagger Card Slide Up Animation
export function animateCards() {
  const container = getEl('result-container');
  if (!container) return;

  const cards = container.querySelectorAll('.vibe-card');
  cards.forEach((card, index) => {
    card.classList.remove('card-animate');
    void card.offsetWidth; // Reflow
    card.style.animationDelay = `${index * 0.07}s`;
    card.classList.add('card-animate');
  });
}

// Render Profile and Basic Stats with count-up numbers
export function renderBasicResult(data) {
  const { profile, stats } = data;

  // 1. Profile Card (handles missing bio or name)
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

  // Missing bio: hide the bio line completely
  if (bioEl) {
    if (profile.bio && profile.bio.trim()) {
      bioEl.textContent = profile.bio.trim();
      bioEl.style.display = '-webkit-box';
    } else {
      bioEl.textContent = '';
      bioEl.style.display = 'none';
    }
  }

  // 4. Stats Row with Count-Up Animations
  const reposEl = getEl('stat-repos');
  const starsEl = getEl('stat-stars');
  const commitsEl = getEl('stat-commits');
  const prsEl = getEl('stat-prs');
  const followersEl = getEl('stat-followers');
  const streakEl = getEl('stat-streak');

  if (reposEl) animateCountUp(reposEl, profile.publicRepos || 0, 600, true);
  if (starsEl) animateCountUp(starsEl, stats.stars || 0, 600, true);
  if (commitsEl) animateCountUp(commitsEl, stats.commits || 0, 600, true);
  if (prsEl) animateCountUp(prsEl, stats.prsMerged || 0, 600, true);
  if (followersEl) animateCountUp(followersEl, profile.followers || 0, 600, true);
  if (streakEl) animateCountUp(streakEl, stats.longestStreak || 0, 600, true);
}

// Render Full Result
export function renderFullResult(data) {
  // 1. Render Basic Profile & Animated Stats
  renderBasicResult(data);

  // Run Reaction Engine
  const analysis = analyzeProfile(data);

  // 2. Dev Title & Score Ring
  const scoreLabelEl = getEl('score-label');
  const devTitleEl = getEl('dev-title');

  if (scoreLabelEl) scoreLabelEl.textContent = analysis.label;
  if (devTitleEl) devTitleEl.textContent = analysis.title;
  renderScoreRing(analysis.score);

  // 3. Reaction Lines
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

  // 5. Language Bar
  renderLanguageBar(data.languages);

  // 6. Contribution Heatmap
  renderHeatmap(data.calendar);

  // 7. Top 2 Repos
  renderTopRepos(data.topRepos);

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

  // Staggered card animation
  animateCards();

  // 10. Confetti if score >= 80
  if (analysis.score >= 80) {
    setTimeout(() => {
      triggerConfetti();
    }, 450);
  }

  return analysis;
}

// Fetch vibe data from serverless API (with full Edge Cases support)
export async function handleCheckVibe(rawInput) {
  const username = cleanInputUsername(rawInput);
  lastAttemptedUser = username;

  // Edge case: Empty input
  if (!username) {
    triggerInputShake('type something bestie');
    return;
  }

  // Edge case: No internet
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    showError("you're offline. touch grass, then come back", true);
    triggerInputShake("you're offline. touch grass, then come back");
    return;
  }

  startLoading();

  try {
    const res = await fetch(`/api/vibe?user=${encodeURIComponent(username)}`);
    const data = await res.json();
    stopLoading();

    // Edge case: API returned error
    if (!res.ok || data.error) {
      showScreen('landing');
      if (data.error === 'not_found') {
        // Username not found
        triggerInputShake("this id doesn't exist. did you make it up? 💀 try again");
        showError("this id doesn't exist. did you make it up? 💀 try again", false);
      } else if (data.error === 'rate_limited' || data.error === 'server_error') {
        // Rate limit or server error: show message with retry button
        triggerInputShake("github is tired rn, try again in a minute");
        showError("github is tired rn, try again in a minute", true);
      } else {
        triggerInputShake("github is tired rn, try again in a minute");
        showError("github is tired rn, try again in a minute", true);
      }
      return;
    }

    hideError();
    renderFullResult(data);
    showScreen('result');
  } catch (err) {
    stopLoading();
    showScreen('landing');

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      triggerInputShake("you're offline. touch grass, then come back");
      showError("you're offline. touch grass, then come back", true);
    } else {
      triggerInputShake("github is tired rn, try again in a minute");
      showError("github is tired rn, try again in a minute", true);
    }
  }
}

// Browser Initialization
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const themeToggleBtn = getEl('theme-toggle');
  const vibeForm = getEl('vibe-form');
  const usernameInput = getEl('username-input');
  const tryAnotherBtn = getEl('try-another-btn');
  const retryBtn = getEl('retry-btn');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  if (vibeForm) {
    vibeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = usernameInput?.value?.trim();
      handleCheckVibe(value);
    });
  }

  if (tryAnotherBtn) {
    tryAnotherBtn.addEventListener('click', () => {
      hideError();
      showScreen('landing');
      if (usernameInput) {
        usernameInput.value = '';
        usernameInput.placeholder = 'github username or profile url';
        usernameInput.focus();
      }
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (lastAttemptedUser) {
        handleCheckVibe(lastAttemptedUser);
      }
    });
  }

  initTheme();
  showScreen('landing');
}
