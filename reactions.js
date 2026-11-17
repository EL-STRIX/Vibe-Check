// reactions.js - Score rules, dev titles, badges, reaction lines, and verdicts

// --- REACTION LINES POOLS (At least 6 per title and per score label) ---

const TITLE_LINES = {
  'Mystery Person': [
    'no public repos. mysterious. we respect it.',
    'working in the shadows, absolute stealth mode.',
    'zero public repos? top secret government contractor vibes.',
    'keeping your code classified like area 51 files.',
    'all aura, zero public commits. enigmatic developer.',
    'undercover agent operating without a paper trail.'
  ],
  'Commit Goblin': [
    'bro is locked in. your commit graph is greener than my future.',
    'no cap, you commit like it\'s a personality.',
    'keyboard keys fighting for their lives daily.',
    'bro commits before breakfast, lunch, and dinner.',
    'git push is basically your muscle memory at this point.',
    'your green squares could power a small European country.'
  ],
  'Star Magnet': [
    'devs are actually fans of you. it\'s giving celebrity.',
    'your aura is unmatched, stars just show up.',
    'casual flex with repositories people actually bookmark.',
    'open source paparazzi following your every release.',
    'walking through GitHub with VIP backstage access.',
    'people clone your repos just to feel inspired.'
  ],
  'Ghost Contributor': [
    'bestie, your repos are collecting dust. it\'s giving ghost town.',
    'github thinks you moved to another planet.',
    'repos sitting there like abandoned Minecraft servers.',
    'you treat git push like a once-a-year holiday tradition.',
    'commit history emptier than my bank account.',
    'spooky vibes only in this repository neighborhood.'
  ],
  'Night Owl Coder': [
    'sleep is optional and so are your bugs?? slay.',
    '3am commits, touch grass at some point.',
    'your code runs on dark roast coffee and moonlight.',
    'debugging at 4am while normal people are dreaming.',
    'vampire developer energy, the sun is your compiler error.',
    'committing under the stars because day jobs are mid.'
  ],
  'Streak Royalty': [
    'that streak is crazy, you\'re not human. respect.',
    'unbroken streak queen/king behavior right here.',
    'a consistency demon. Duolingo bird is taking notes.',
    'never missed a day, your dedication is terrifying.',
    'streak longer than most modern relationships.',
    'clocking in on GitHub like it\'s your holy duty.'
  ],
  'Open Source Hero': [
    'merging PRs for strangers, main character behavior.',
    'carrying the open source ecosystem on your shoulders.',
    'selfless dev energy, fixing bugs for the greater good.',
    'merging PRs like Santa dropping off gifts.',
    'community builder aura, developers genuinely love you.',
    'making open source a friendlier place one review at a time.'
  ],
  'Language Hopper': [
    'six different languages? pick a struggle bestie.',
    'a polyglot flex, you speak in compiler dialects.',
    'never letting anyone predict your next syntax move.',
    'switching languages like changing outfits for fashion week.',
    'fluent in chaos and semicolons across multiple ecosystems.',
    'stack overflow search history must look like the UN.'
  ],
  'Tutorial Hell Survivor': [
    'ten todo apps deep and still standing. the grind is real.',
    'survived the tutorial trenches and ready to build real stuff.',
    'stack of half-finished clone apps with unmatched potential.',
    'you watched the 4-hour tutorial and actually made the repo.',
    'building the same calculator app in 5 styles. we respect it.',
    'ready to break free from boilerplate and rule the world.'
  ],
  'Quiet Builder': [
    'low-key cooking. not loud, but the code is mid-to-good.',
    'silent moves in private, shipping code without the noise.',
    'no drama, just clean lines and steady progress.',
    'calm dev aesthetic, minding your own pull requests.',
    'stealth mode developer, letting the releases do the talking.',
    'understated aura, building things that actually work.'
  ]
};

const SCORE_LINES = {
  'needs a glow-up': [
    'it\'s giving dormant potential, but we need some reps.',
    'light mode commits right now, time for a comeback arc.',
    'your terminal is lonely, give it a little attention.',
    'a quiet season, but the comeback story is going to hit different.',
    'starter pack vibes. one good weekend project will fix this.',
    'repos in hibernation. don\'t worry bestie, your time is coming.'
  ],
  'mid but loading': [
    'solid foundation, just needs that extra push to go viral.',
    'cooking on low heat. turn the burner up a notch.',
    'respectable grind, definitely not an NPC in the dev realm.',
    'the progress is real, you\'re one good hackathon away from 10x.',
    'decent rhythm, keeping the lights on in the repository.',
    'not bad at all, steady developer vibes loading in.'
  ],
  'certified vibes': [
    'certified clean code energy. very aesthetic contributions.',
    'aura is climbing fast, repos looking healthy and fed.',
    'impressive output, you definitely know your way around git.',
    'respectable stats across the board, devs definitely notice.',
    'smooth workflow and consistent heat in the terminal.',
    'high-tier developer energy, you\'re definitely doing it right.'
  ],
  'main character energy': [
    'unmatched aura. you basically own the terminal.',
    '10x developer detected, save some commits for the rest of us.',
    'absolute titan status, your profile belongs in a museum.',
    'top tier flex, this GitHub profile has celebrity gravity.',
    'god-tier consistency, you\'re carrying the team on your back.',
    'flawless victory. pure main character developer moment.'
  ]
};

const VERDICTS = {
  high: [
    'hire this person, then apologize to their sleep schedule.',
    'certified 10x aura. no notes.',
    'github is basically their primary residence.',
    'save some commits for the rest of open source bestie.',
    'unapologetic main character behavior.',
    'senior engineer energy straight out the box.'
  ],
  mid: [
    'one more commit and you\'re cooked in a good way.',
    'the foundation is solid, just don\'t ghost your repos.',
    'cooking with medium heat. smells promising.',
    'definitely knows how to exit vim on the first try.',
    'low-key building the future between coffee breaks.',
    'the vibes are immaculate, just ship that side project.'
  ],
  low: [
    'a sleeping giant. one push away from greatness.',
    'your repos are in hibernation, wake them up bestie.',
    'git commit -m "started caring" when?',
    'the potential is immense, your keyboard awaits.',
    'it\'s giving minimalist developer aesthetic.',
    'Rome wasn\'t built in a day, and neither is your repo graph.'
  ]
};

// Encouraging lines to append for low scores (<40)
const ENCOURAGING_LINES = [
  'we believe in your next repo arc.',
  'all it takes is one commit to start the fire.',
  'go push something today, you\'ve got this.',
  'every senior dev started with an empty grid.'
];

function getRandomItem(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- 1. VIBE SCORE CALCULATION (0 to 100) ---
export function calculateVibeScore(stats, profile, languages) {
  const commits = stats?.commits || 0;
  const stars = stats?.stars || 0;
  const longestStreak = stats?.longestStreak || 0;
  const prsMerged = stats?.prsMerged || 0;
  const followers = profile?.followers || 0;
  const langCount = Array.isArray(languages) ? languages.length : 0;

  // 1. Commits: up to 30 points (1000 commits = full)
  const commitPoints = Math.min(30, (commits / 1000) * 30);

  // 2. Stars: up to 20 points (1000 stars = full, log scale so small numbers count)
  let starsPoints = 0;
  if (stars > 0) {
    starsPoints = Math.min(20, (Math.log10(stars + 1) / Math.log10(1001)) * 20);
  }

  // 3. Longest streak: up to 15 points (30 days = full)
  const streakPoints = Math.min(15, (longestStreak / 30) * 15);

  // 4. Merged PRs: up to 15 points (50 = full)
  const prsPoints = Math.min(15, (prsMerged / 50) * 15);

  // 5. Followers: up to 10 points (500 = full)
  const followerPoints = Math.min(10, (followers / 500) * 10);

  // 6. Language variety: up to 10 points (5 languages = full)
  const langPoints = Math.min(10, (langCount / 5) * 10);

  const rawScore = commitPoints + starsPoints + streakPoints + prsPoints + followerPoints + langPoints;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  return score;
}

// --- 2. SCORE LABEL ---
export function getScoreLabel(score) {
  if (score >= 80) return 'main character energy';
  if (score >= 55) return 'certified vibes';
  if (score >= 30) return 'mid but loading';
  return 'needs a glow-up';
}

// --- 3. DEV TITLE (First matching rule, top to bottom) ---
export function getDevTitle(data) {
  const stats = data.stats || {};
  const profile = data.profile || {};
  const languages = data.languages || [];
  const commitHours = data.commitHours || [];

  const commits = stats.commits || 0;
  const stars = stats.stars || 0;
  const longestStreak = stats.longestStreak || 0;
  const prsMerged = stats.prsMerged || 0;
  const publicRepos = profile.publicRepos || 0;
  const distinctLanguages = languages.length;

  // Edge case: No public repos -> Mystery Person
  if (publicRepos === 0) {
    return 'Mystery Person';
  }

  // Ghost Contributor: fewer than 10 commits and fewer than 3 repos
  if (commits < 10 && publicRepos < 3) {
    return 'Ghost Contributor';
  }

  // Star Magnet: more than 500 stars
  if (stars > 500) {
    return 'Star Magnet';
  }

  // Commit Goblin: more than 1500 commits
  if (commits > 1500) {
    return 'Commit Goblin';
  }

  // Streak Royalty: streak of 60 days or more
  if (longestStreak >= 60) {
    return 'Streak Royalty';
  }

  // Open Source Hero: 30 or more merged PRs
  if (prsMerged >= 30) {
    return 'Open Source Hero';
  }

  // Night Owl Coder: more than 50% of commits between 10pm and 4am (hours 22, 23, 0, 1, 2, 3)
  if (commitHours && commitHours.length >= 3) {
    const nightCommits = commitHours.filter(h => h >= 22 || h <= 3).length;
    if (nightCommits / commitHours.length > 0.5) {
      return 'Night Owl Coder';
    }
  }

  // Language Hopper: 6 or more languages
  if (distinctLanguages >= 6) {
    return 'Language Hopper';
  }

  // Tutorial Hell Survivor: many small repos, almost no stars or PRs
  if (publicRepos >= 6 && stars <= 5 && prsMerged <= 1) {
    return 'Tutorial Hell Survivor';
  }

  // Quiet Builder: default
  return 'Quiet Builder';
}

// --- 4. BADGES (Max 4) ---
export function getBadges(data) {
  const stats = data.stats || {};
  const profile = data.profile || {};
  const languages = data.languages || [];
  const commitHours = data.commitHours || [];

  const longestStreak = stats.longestStreak || 0;
  const prsMerged = stats.prsMerged || 0;
  const stars = stats.stars || 0;
  const distinctLanguages = languages.length;
  const createdAt = profile.createdAt;

  const matchedBadges = [];

  // Night Owl / Early Bird (requires commit hours)
  if (commitHours && commitHours.length >= 3) {
    const nightCommits = commitHours.filter(h => h >= 22 || h <= 3).length;
    const earlyCommits = commitHours.filter(h => h >= 5 && h <= 9).length;

    if (nightCommits / commitHours.length > 0.5) {
      matchedBadges.push('Night Owl');
    } else if (earlyCommits / commitHours.length > 0.4) {
      matchedBadges.push('Early Bird');
    }
  }

  // Streak King/Queen: 30+ days
  if (longestStreak >= 30) {
    matchedBadges.push('Streak King/Queen');
  }

  // Open Source Hero: 15+ merged PRs
  if (prsMerged >= 15) {
    matchedBadges.push('Open Source Hero');
  }

  // Language Hopper: 4+ languages
  if (distinctLanguages >= 4) {
    matchedBadges.push('Language Hopper');
  }

  // Star Magnet: 100+ stars
  if (stars >= 100) {
    matchedBadges.push('Star Magnet');
  }

  // Fresh Account (<1 yr) or OG (>=8 yrs)
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365.25);

    if (diffYears < 1) {
      matchedBadges.push('Fresh Account');
    } else if (diffYears >= 8) {
      matchedBadges.push('OG');
    }
  }

  return matchedBadges.slice(0, 4);
}

// --- 5. REACTION TEXT & VERDICT ---
export function generateReaction(devTitle, score, label) {
  const titlePool = TITLE_LINES[devTitle] || TITLE_LINES['Quiet Builder'];
  const scorePool = SCORE_LINES[label] || SCORE_LINES['mid but loading'];

  let line1 = getRandomItem(titlePool);
  if (devTitle === 'Mystery Person') {
    line1 = 'no public repos. mysterious. we respect it.';
  }
  const line2 = getRandomItem(scorePool);

  const lines = [line1, line2];

  // If score is under 40, end with a small encouraging line so nobody leaves sad
  if (score < 40) {
    lines.push(getRandomItem(ENCOURAGING_LINES));
  }

  // Verdict selection
  let verdictPool = VERDICTS.mid;
  if (score >= 80) {
    verdictPool = VERDICTS.high;
  } else if (score < 40) {
    verdictPool = VERDICTS.low;
  }
  const verdict = getRandomItem(verdictPool);

  return {
    lines, // 2 to 3 short lines
    verdict
  };
}

// --- FULL ANALYSIS RUNNER ---
export function analyzeProfile(data) {
  const score = calculateVibeScore(data.stats, data.profile, data.languages);
  const label = getScoreLabel(score);
  const title = getDevTitle(data);
  const badges = getBadges(data);
  const { lines, verdict } = generateReaction(title, score, label);

  return {
    score,
    label,
    title,
    badges,
    reactionLines: lines,
    verdict
  };
}
