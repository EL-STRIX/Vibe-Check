// app.js - Main Application Logic, Visual Extras, Edge Cases & Game Features
import { analyzeProfile, evaluateBattle } from './reactions.js';

// Loading screen lines that rotate every 1.5 seconds
const LOADING_LINES = [
  'stalking your commits...',
  'judging your commit messages...',
  'counting your stars, relax...',
  'asking your repos how they feel...'
];

let loadingInterval = null;
let lastAttemptedUser = '';
let currentVibeData = null;
let currentAnalysis = null;
const THEME_STORAGE_KEY = 'vibe-check-theme';
const SECRETS_STORAGE_KEY = 'vibe-secrets-found';
const SOUND_STORAGE_KEY = 'vibe-sound-muted';
const TOTAL_SECRETS = 5;

let audioCtx = null;
let soundMuted = false;
let typingTimeoutId = null;
let currentTypingState = { isTyping: false, fullText: [] };

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

// --- 1. AUDIO & HAPTICS ---
export function initAudio() {
  if (typeof localStorage === 'undefined') return;
  soundMuted = localStorage.getItem(SOUND_STORAGE_KEY) === 'true';
  updateSoundIcon();
}

export function updateSoundIcon() {
  const icon = getEl('sound-icon');
  if (icon) {
    icon.textContent = soundMuted ? '🔇' : '🔊';
  }
}

export function toggleSound() {
  soundMuted = !soundMuted;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SOUND_STORAGE_KEY, soundMuted ? 'true' : 'false');
  }
  updateSoundIcon();
  if (!soundMuted) {
    playPop();
  }
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function triggerHaptic(duration = 30) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(duration);
    } catch (_) {}
  }
}

export function playPop() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.05);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (_) {}
}

export function playChime() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Note 1 (C5 - 523Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Note 2 (E5 - 659Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.09);
    gain2.gain.setValueAtTime(0.16, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.33);
  } catch (_) {}
}

export function playFanfare() {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.08;
      const dur = idx === notes.length - 1 ? 0.36 : 0.12;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  } catch (_) {}
}

// --- 2. THEME MANAGEMENT ---
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
  playPop();
}

// --- 3. SECRETS TRACKER ---
export function getDiscoveredSecrets() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SECRETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function recordSecretFound(title) {
  if (typeof localStorage === 'undefined' || !title) return;
  const list = getDiscoveredSecrets();
  if (!list.includes(title)) {
    list.push(title);
    localStorage.setItem(SECRETS_STORAGE_KEY, JSON.stringify(list));
  }
  updateSecretsUI();
}

export function updateSecretsUI() {
  const list = getDiscoveredSecrets();
  const count = list.length;
  const text = `secrets found: ${count}/${TOTAL_SECRETS}`;

  const landingBadge = getEl('landing-secrets-badge');
  const landingText = getEl('landing-secrets-text');
  const resultText = getEl('secrets-progress-text');

  if (landingText) landingText.textContent = text;
  if (resultText) resultText.textContent = text;
  if (landingBadge) {
    landingBadge.hidden = (count === 0);
  }
}

// --- 4. NAVIGATION & SCREENS ---
export function showScreen(screenName) {
  const screenLanding = getEl('screen-landing');
  const screenLoading = getEl('screen-loading');
  const screenResult = getEl('screen-result');
  const screenCompare = getEl('screen-compare');

  if (screenLanding) screenLanding.hidden = (screenName !== 'landing');
  if (screenLoading) screenLoading.hidden = (screenName !== 'loading');
  if (screenResult) screenResult.hidden = (screenName !== 'result');
  if (screenCompare) screenCompare.hidden = (screenName !== 'compare');

  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
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

// Gold confetti for Legendary Cards
export function triggerGoldConfetti() {
  if (typeof window !== 'undefined' && typeof window.confetti === 'function') {
    window.confetti({
      particleCount: 120,
      spread: 85,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FFFBEB'],
      ticks: 250,
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
    card.style.animationDelay = `${index * 0.06}s`;
    card.classList.add('card-animate');
  });
}

// --- 5. TYPING EFFECT WITH SKIP ---
export function stopTypingEffect() {
  if (typingTimeoutId) {
    clearTimeout(typingTimeoutId);
    typingTimeoutId = null;
  }
  currentTypingState.isTyping = false;
}

export function skipTypingInstantly() {
  if (!currentTypingState.isTyping) return;
  stopTypingEffect();
  const typingBubble = getEl('typing-bubble');
  const reactionLinesEl = getEl('reaction-lines');
  if (typingBubble) typingBubble.hidden = true;
  if (reactionLinesEl) {
    reactionLinesEl.innerHTML = '';
    currentTypingState.fullText.forEach(line => {
      const p = document.createElement('p');
      p.className = 'reaction-line';
      p.textContent = line;
      reactionLinesEl.appendChild(p);
    });
  }
}

export function renderTypingReaction(lines) {
  stopTypingEffect();
  currentTypingState = { isTyping: true, fullText: lines };

  const typingBubble = getEl('typing-bubble');
  const reactionLinesEl = getEl('reaction-lines');
  if (!reactionLinesEl) return;

  reactionLinesEl.innerHTML = '';

  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    if (typingBubble) typingBubble.hidden = true;
    currentTypingState.isTyping = false;
    lines.forEach(line => {
      const p = document.createElement('p');
      p.className = 'reaction-line';
      p.textContent = line;
      reactionLinesEl.appendChild(p);
    });
    return;
  }

  // Show typing bubble for 700ms first
  if (typingBubble) typingBubble.hidden = false;

  typingTimeoutId = setTimeout(() => {
    if (typingBubble) typingBubble.hidden = true;

    let lineIndex = 0;
    let charIndex = 0;
    let currentParagraph = null;

    function typeChar() {
      if (!currentTypingState.isTyping) return;

      if (lineIndex >= lines.length) {
        currentTypingState.isTyping = false;
        return;
      }

      if (charIndex === 0) {
        currentParagraph = document.createElement('p');
        currentParagraph.className = 'reaction-line';
        reactionLinesEl.appendChild(currentParagraph);
      }

      const currentLineText = lines[lineIndex];
      if (charIndex < currentLineText.length) {
        currentParagraph.textContent += currentLineText[charIndex];
        charIndex++;
        typingTimeoutId = setTimeout(typeChar, 25);
      } else {
        lineIndex++;
        charIndex = 0;
        typingTimeoutId = setTimeout(typeChar, 180);
      }
    }

    typeChar();
  }, 700);
}

// Render Profile and Basic Stats with count-up numbers
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
  currentVibeData = data;
  renderBasicResult(data);

  // Run Reaction Engine
  const analysis = analyzeProfile(data);
  currentAnalysis = analysis;

  // 1. Rarity Badges & Card Glow
  const resultContainer = getEl('result-container');
  const rarityBadge = getEl('rarity-badge');
  const rarityClasses = ['rarity-common', 'rarity-rare', 'rarity-epic', 'rarity-legendary'];

  if (resultContainer) {
    resultContainer.classList.remove(...rarityClasses);
    resultContainer.classList.add(`rarity-${analysis.rarity.toLowerCase()}`);
  }
  if (rarityBadge) {
    rarityBadge.classList.remove(...rarityClasses);
    rarityBadge.classList.add(`rarity-${analysis.rarity.toLowerCase()}`);
    rarityBadge.textContent = analysis.rarity;
  }

  // 2. Secret Title Banner & Unlock
  const secretBanner = getEl('secret-title-banner');
  if (analysis.isSecret) {
    if (secretBanner) secretBanner.hidden = false;
    recordSecretFound(analysis.title);
  } else {
    if (secretBanner) secretBanner.hidden = true;
  }
  updateSecretsUI();

  // 3. Dev Title, Score Ring, Aura & Archetype
  const scoreLabelEl = getEl('score-label');
  const devTitleEl = getEl('dev-title');
  const auraBadge = getEl('aura-points-badge');
  const archetypeLine = getEl('archetype-mix-line');

  if (scoreLabelEl) scoreLabelEl.textContent = analysis.label;
  if (devTitleEl) devTitleEl.textContent = analysis.title;
  if (auraBadge) {
    auraBadge.textContent = `${analysis.formattedAura} aura`;
    auraBadge.classList.toggle('aura-negative', analysis.aura < 0);
  }
  if (archetypeLine) {
    archetypeLine.textContent = analysis.archetypes.summaryLine || analysis.archetypes;
  }
  renderScoreRing(analysis.score);

  // 4. Typing Effect Reactions
  renderTypingReaction(analysis.reactionLines);

  // 5. Language Bar
  renderLanguageBar(data.languages);

  // 6. Contribution Heatmap
  renderHeatmap(data.calendar);

  // 7. Top 2 Repos
  renderTopRepos(data.topRepos);

  // 8. Verdict
  const verdictTextEl = getEl('verdict-text');
  if (verdictTextEl) {
    verdictTextEl.textContent = `"${analysis.verdict}"`;
  }

  // 9. Daily Vibe
  const dailyVibeText = getEl('daily-vibe-text');
  if (dailyVibeText) {
    dailyVibeText.textContent = analysis.dailyVibe;
  }

  // Staggered card animation
  animateCards();

  // 10. Audio & Confetti by Tier / Secret
  triggerHaptic(40);

  if (analysis.isSecret) {
    playFanfare();
    triggerGoldConfetti();
  } else if (analysis.rarity === 'Legendary') {
    playFanfare();
    triggerGoldConfetti();
  } else if (analysis.rarity === 'Epic') {
    playChime();
    if (analysis.score >= 80) {
      setTimeout(() => triggerConfetti(), 450);
    }
  } else if (analysis.rarity === 'Rare') {
    playChime();
  } else {
    playPop();
  }

  return analysis;
}

// Fetch vibe data from serverless API
export async function handleCheckVibe(rawInput) {
  const username = cleanInputUsername(rawInput);
  lastAttemptedUser = username;

  if (!username) {
    triggerInputShake('type something bestie');
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    showError("you're offline. touch grass, then come back", true);
    triggerInputShake("you're offline. touch grass, then come back");
    return;
  }

  startLoading();

  try {
    const res = await fetch(`/api/vibe?user=${encodeURIComponent(username)}`);
    const contentType = res.headers.get('content-type') || '';

    // If served via static Live Server (port 5500) where /api/vibe is missing
    if (!contentType.includes('application/json')) {
      stopLoading();
      showScreen('landing');
      showError("backend is not running! Run 'node server.js' in terminal and open http://localhost:3000", false);
      triggerInputShake("run: node server.js");
      return;
    }

    const data = await res.json();
    stopLoading();

    if (!res.ok || data.error) {
      showScreen('landing');
      if (data.error === 'not_found') {
        triggerInputShake("this id doesn't exist. did you make it up? 💀 try again");
        showError("this id doesn't exist. did you make it up? 💀 try again", false);
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

// --- SHARE CARD DOWNLOAD (1080 x 1350 PNG) ---
export async function downloadShareCard() {
  if (!currentVibeData || !currentAnalysis) return;
  const shareBtn = getEl('share-btn');
  const canvasNode = getEl('share-card-canvas');
  if (!canvasNode) return;

  const originalBtnText = shareBtn ? shareBtn.textContent : '';
  if (shareBtn) shareBtn.textContent = 'generating image... ⏳';

  const { profile, stats } = currentVibeData;
  const analysis = currentAnalysis;

  // Populate canvas fields
  const shareName = getEl('share-name');
  const shareHandle = getEl('share-handle');
  const shareTitle = getEl('share-title');
  const shareScoreLabel = getEl('share-score-label');
  const shareScoreNumber = getEl('share-score-number');
  const shareStatStars = getEl('share-stat-stars');
  const shareStatCommits = getEl('share-stat-commits');
  const shareStatStreak = getEl('share-stat-streak');
  const shareVerdict = getEl('share-verdict');
  const shareAvatarImg = getEl('share-avatar-img');
  const shareAvatarFallback = getEl('share-avatar-fallback');

  if (shareName) shareName.textContent = profile.name || profile.login;
  if (shareHandle) shareHandle.textContent = `@${profile.login}`;
  if (shareTitle) shareTitle.textContent = analysis.title;
  if (shareScoreLabel) shareScoreLabel.textContent = analysis.label;
  if (shareScoreNumber) shareScoreNumber.textContent = analysis.score;
  if (shareStatStars) shareStatStars.textContent = formatNumber(stats.stars || 0);
  if (shareStatCommits) shareStatCommits.textContent = formatNumber(stats.commits || 0);
  if (shareStatStreak) shareStatStreak.textContent = `${stats.longestStreak || 0}d`;
  if (shareVerdict) shareVerdict.textContent = `"${analysis.verdict}"`;

  // Always prepare fallback initial circle first
  if (shareAvatarFallback) {
    shareAvatarFallback.style.display = 'flex';
    shareAvatarFallback.textContent = (profile.login || 'V')[0].toUpperCase();
  }
  if (shareAvatarImg) {
    shareAvatarImg.style.display = 'none';
  }

  // Attempt to load avatar as local data URL to prevent canvas cross-origin taint
  if (profile.avatar) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const imgRes = await fetch(profile.avatar, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (imgRes.ok) {
        const blob = await imgRes.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });

        if (dataUrl && shareAvatarImg) {
          shareAvatarImg.src = dataUrl;
          shareAvatarImg.style.display = 'block';
          if (shareAvatarFallback) shareAvatarFallback.style.display = 'none';
        }
      }
    } catch (_) {
      // Fallback initial circle is already visible
    }
  }

  try {
    // Reveal canvasNode at (0, 0)
    canvasNode.style.display = 'flex';
    canvasNode.style.opacity = '1';
    canvasNode.style.visibility = 'visible';
    canvasNode.style.position = 'fixed';
    canvasNode.style.top = '0';
    canvasNode.style.left = '0';
    canvasNode.style.zIndex = '-9999';

    // Wait for DOM reflow
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    if (typeof window !== 'undefined' && window.htmlToImage) {
      const dataUrl = await window.htmlToImage.toPng(canvasNode, {
        width: 1080,
        height: 1350,
        canvasWidth: 1080,
        canvasHeight: 1350,
        pixelRatio: 1,
        backgroundColor: '#0F0B1E'
      });

      const link = document.createElement('a');
      link.download = `github-vibe-${profile.login}.png`;
      link.href = dataUrl;
      link.click();
      playPop();
    }
  } catch (err) {
    console.error('Failed to generate share image:', err);
  } finally {
    canvasNode.style.display = 'none';
    if (shareBtn) shareBtn.textContent = originalBtnText;
  }
}

// --- UPGRADED VIBE BATTLE ---
export async function handleCompareSubmit(user1Raw, user2Raw) {
  const user1 = cleanInputUsername(user1Raw);
  const user2 = cleanInputUsername(user2Raw);

  const errorBanner = getEl('compare-error-banner');
  const errorMsg = getEl('compare-error-message');
  const battleBtn = getEl('battle-btn');
  const resultContainer = getEl('compare-result');
  const introOverlay = getEl('battle-intro-overlay');

  const showCompareError = (msg) => {
    if (errorBanner && errorMsg) {
      errorMsg.textContent = msg;
      errorBanner.hidden = false;
    }
    if (resultContainer) resultContainer.hidden = true;
    if (introOverlay) introOverlay.hidden = true;
  };

  const hideCompareError = () => {
    if (errorBanner) errorBanner.hidden = true;
  };

  if (!user1 || !user2) {
    showCompareError('enter two usernames to battle bestie');
    return;
  }

  // Edge Case: Compare with same ID twice
  if (user1.toLowerCase() === user2.toLowerCase()) {
    showCompareError("you vs you? that's just self-love");
    return;
  }

  hideCompareError();
  const originalBattleText = battleBtn ? battleBtn.textContent : '';
  if (battleBtn) battleBtn.textContent = 'battling... ⚔️';

  // 1.2s "FIGHT" Intro Banner
  if (introOverlay) introOverlay.hidden = false;
  playPop();
  triggerHaptic(50);

  const startTime = Date.now();

  try {
    const [res1, res2] = await Promise.all([
      fetch(`/api/vibe?user=${encodeURIComponent(user1)}`),
      fetch(`/api/vibe?user=${encodeURIComponent(user2)}`)
    ]);

    const contentType1 = res1.headers.get('content-type') || '';
    const contentType2 = res2.headers.get('content-type') || '';
    if (!contentType1.includes('application/json') || !contentType2.includes('application/json')) {
      showCompareError("backend is not running! Run 'node server.js' and open http://localhost:3000");
      return;
    }

    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

    if (!res1.ok || data1.error) {
      showCompareError(`@${user1} doesn't exist. did you make it up? 💀`);
      return;
    }
    if (!res2.ok || data2.error) {
      showCompareError(`@${user2} doesn't exist. did you make it up? 💀`);
      return;
    }

    const a1 = analyzeProfile(data1);
    const a2 = analyzeProfile(data2);

    // Ensure intro overlay stays visible for at least 1200ms
    const elapsed = Date.now() - startTime;
    if (elapsed < 1200) {
      await new Promise(r => setTimeout(r, 1200 - elapsed));
    }

    if (introOverlay) introOverlay.hidden = true;
    renderCompareResults(data1, a1, data2, a2);
  } catch (err) {
    showCompareError('github is tired rn, try again in a minute');
  } finally {
    if (introOverlay) introOverlay.hidden = true;
    if (battleBtn) battleBtn.textContent = originalBattleText;
  }
}

export function renderCompareResults(data1, a1, data2, a2) {
  const resultContainer = getEl('compare-result');
  const winnerTitle = getEl('compare-winner-title');
  const winnerLine = getEl('compare-winner-line');
  const marginLineEl = getEl('compare-margin-line');
  const card1 = getEl('compare-card-1');
  const card2 = getEl('compare-card-2');

  if (!resultContainer || !card1 || !card2) return;

  const battle = evaluateBattle(data1, a1, data2, a2);
  const name1 = data1.profile.login;
  const name2 = data2.profile.login;

  let headerTitle = '';
  if (battle.winner === 1) {
    headerTitle = `@${name1} wins! 👑`;
  } else if (battle.winner === 2) {
    headerTitle = `@${name2} wins! 👑`;
  } else {
    headerTitle = "it's a dead tie! 🤝";
  }

  if (winnerTitle) winnerTitle.textContent = headerTitle;
  if (winnerLine) winnerLine.textContent = battle.reason;
  if (marginLineEl) marginLineEl.textContent = battle.marginLine;

  const buildUserCard = (data, a, isWinner) => `
    <div class="compare-user-card-inner ${isWinner ? 'is-winner' : ''}">
      <img class="compare-user-avatar" src="${data.profile.avatar || ''}" alt="${data.profile.login}" onerror="this.style.display='none'" />
      <h4 class="compare-user-name">${data.profile.name || data.profile.login}</h4>
      <span class="compare-user-handle">@${data.profile.login}</span>
      <div class="compare-user-score gradient-text">${a.score}</div>
      <div class="score-label" style="font-size:0.9rem;">${a.label} &bull; ${a.formattedAura} aura</div>
      <div class="compare-user-title gradient-text">${a.title}</div>
      <div style="font-size:0.8rem; color:var(--muted-text); margin-top:4px;">
        ⭐ ${formatNumber(data.stats.stars)} &bull; ${formatNumber(data.stats.commits)} commits &bull; ${data.stats.longestStreak}d streak
      </div>
    </div>
  `;

  card1.innerHTML = buildUserCard(data1, a1, battle.winner === 1);
  card2.innerHTML = buildUserCard(data2, a2, battle.winner === 2);

  card1.classList.toggle('is-winner', battle.winner === 1);
  card2.classList.toggle('is-winner', battle.winner === 2);

  resultContainer.hidden = false;

  // Sound and confetti for winner
  if (battle.winner !== 0) {
    playFanfare();
    triggerHaptic(50);
    if (Math.max(a1.score, a2.score) >= 70) {
      triggerConfetti();
    }
  } else {
    playChime();
  }
}

// Browser Initialization
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const themeToggleBtn = getEl('theme-toggle');
  const soundToggleBtn = getEl('sound-toggle');
  const vibeForm = getEl('vibe-form');
  const usernameInput = getEl('username-input');
  const tryAnotherBtn = getEl('try-another-btn');
  const retryBtn = getEl('retry-btn');
  const shareBtn = getEl('share-btn');
  const compareBtn = getEl('compare-btn');
  const compareForm = getEl('compare-form');
  const compareBackBtn = getEl('compare-back-btn');
  const compareUser1 = getEl('compare-user1');
  const compareUser2 = getEl('compare-user2');
  const reactionCard = getEl('reaction-card');

  // Top Controls
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', toggleSound);
  }

  // Skip Typing Effect when tapping reaction card
  if (reactionCard) {
    reactionCard.addEventListener('click', () => {
      skipTypingInstantly();
    });
  }

  // Form Submissions
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

  if (shareBtn) {
    shareBtn.addEventListener('click', downloadShareCard);
  }

  if (compareBtn) {
    compareBtn.addEventListener('click', () => {
      hideError();
      showScreen('compare');
      if (currentVibeData && compareUser1) {
        compareUser1.value = currentVibeData.profile.login;
      }
      if (compareUser2) {
        compareUser2.value = '';
        compareUser2.focus();
      }
    });
  }

  if (compareForm) {
    compareForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u1 = compareUser1?.value;
      const u2 = compareUser2?.value;
      handleCompareSubmit(u1, u2);
    });
  }

  if (compareBackBtn) {
    compareBackBtn.addEventListener('click', () => {
      if (currentVibeData) {
        showScreen('result');
      } else {
        showScreen('landing');
      }
    });
  }

  // Initialize Audio, Theme, and Secrets UI
  initAudio();
  initTheme();
  updateSecretsUI();
  showScreen('landing');
}
