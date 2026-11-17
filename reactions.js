// reactions.js - Game Features and Logic Engine
// Pure functions for score, titles, secrets, rarity, aura, archetypes, reactions, and daily vibe.
// No DOM references in core math. Runs in plain Node.js and the browser.

// --- 1. CURVES & SCORING (Section 3) ---

export function sqrtCurve(x, cap) {
  if (cap <= 0) return 0;
  return Math.min(1, Math.sqrt(Math.max(0, x) / cap));
}

export function logCurve(x, cap) {
  if (cap <= 0) return 0;
  const num = Math.log(1 + Math.max(0, x));
  const den = Math.log(1 + cap);
  return Math.min(1, num / den);
}

export function calculateVibeScore(stats, profile, languages) {
  const commits = stats?.commits || 0;
  const stars = stats?.stars || 0; // own non-fork stars
  const longestStreak = stats?.longestStreak || 0;
  const prsMerged = stats?.prsMerged || 0;
  const followers = profile?.followers || 0;
  const activeDays = stats?.activeDays || 0;
  const langCount = Array.isArray(languages) ? languages.length : 0;
  const monthsActive = profile?.monthsActive !== undefined ? profile.monthsActive : 12;

  // Fair to new accounts: if under 12 months, scale caps by max(monthsActive / 12, 0.25)
  const ageFactor = monthsActive < 12 ? Math.max(monthsActive / 12, 0.25) : 1;
  const capCommits = 1500 * ageFactor;
  const capPRs = 60 * ageFactor;
  const capActiveDays = 200 * ageFactor;

  const ptsCommits = 25 * sqrtCurve(commits, capCommits);
  const ptsStars = 20 * logCurve(stars, 1000);
  const ptsStreak = 15 * sqrtCurve(longestStreak, 45);
  const ptsPRs = 15 * sqrtCurve(prsMerged, capPRs);
  const ptsFollowers = 10 * logCurve(followers, 500);
  const ptsActiveDays = 10 * sqrtCurve(activeDays, capActiveDays);
  const ptsLanguages = 5 * (Math.min(langCount, 5) / 5);

  const rawTotal = ptsCommits + ptsStars + ptsStreak + ptsPRs + ptsFollowers + ptsActiveDays + ptsLanguages;
  return Math.min(100, Math.max(0, Math.round(rawTotal)));
}

export function getScoreLabel(score) {
  if (score >= 80) return 'main character energy';
  if (score >= 55) return 'certified vibes';
  if (score >= 30) return 'mid but loading';
  return 'needs a glow-up';
}

// --- 2. TITLES (SECRET & NORMAL) (Section 4) ---

export const SECRET_TITLES_LIST = [
  'The 4AM Menace',
  'Fork Collector',
  'One-Hit Wonder',
  'Weekend Warrior',
  'Comeback Kid'
];

export function getSecretTitle(data) {
  const stats = data?.stats || {};
  const calendar = data?.calendar || [];

  const lateNightShare = stats.lateNightShare;
  const ownRepos = stats.ownRepos !== undefined ? stats.ownRepos : (data.profile?.publicRepos || 0);
  const forkedRepos = stats.forkedRepos || 0;
  const totalRepos = ownRepos + forkedRepos;
  const stars = stats.stars || 0;
  const topRepoStarShare = stats.topRepoStarShare || 0;
  const weekendShare = stats.weekendShare || 0;
  const last30 = stats.last30 || 0;
  const prev90 = stats.prev90 || 0;

  let calendarTotal = 0;
  for (const d of calendar) calendarTotal += (d.count || 0);

  // 1. The 4AM Menace: lateNightShare 0.25 or more
  if (lateNightShare !== null && lateNightShare !== undefined && lateNightShare >= 0.25) {
    return 'The 4AM Menace';
  }

  // 2. Fork Collector: ownRepos + forkedRepos >= 10 and forks >= 60%
  if (totalRepos >= 10 && (forkedRepos / totalRepos) >= 0.6) {
    return 'Fork Collector';
  }

  // 3. One-Hit Wonder: stars >= 50 and topRepoStarShare >= 0.8
  if (stars >= 50 && topRepoStarShare >= 0.8) {
    return 'One-Hit Wonder';
  }

  // 4. Weekend Warrior: weekendShare >= 0.6 and calendar total >= 50
  if (weekendShare >= 0.6 && calendarTotal >= 50) {
    return 'Weekend Warrior';
  }

  // 5. Comeback Kid: last30 >= 30 and prev90 <= 5
  if (last30 >= 30 && prev90 <= 5) {
    return 'Comeback Kid';
  }

  return null;
}

export function getNormalTitle(data) {
  const stats = data?.stats || {};
  const profile = data?.profile || {};
  const languages = data?.languages || [];

  const commits = stats.commits || 0;
  const stars = stats.stars || 0;
  const longestStreak = stats.longestStreak || 0;
  const prsMerged = stats.prsMerged || 0;
  const ownRepos = stats.ownRepos !== undefined ? stats.ownRepos : (profile.publicRepos || 0);
  const distinctLanguages = Array.isArray(languages) ? languages.length : 0;
  const nightShare = stats.nightShare;

  // Ghost Contributor: fewer than 10 commits and fewer than 3 repos
  if (commits < 10 && ownRepos < 3) {
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

  // Night Owl Coder: nightShare above 0.5 (only when not null)
  if (nightShare !== null && nightShare !== undefined && nightShare > 0.5) {
    return 'Night Owl Coder';
  }

  // Language Hopper: 6 or more languages
  if (distinctLanguages >= 6) {
    return 'Language Hopper';
  }

  // Tutorial Hell Survivor: ownRepos 8 or more, stars 10 or fewer, merged PRs 2 or fewer
  if (ownRepos >= 8 && stars <= 10 && prsMerged <= 2) {
    return 'Tutorial Hell Survivor';
  }

  return 'Quiet Builder';
}

export function getDevTitle(data) {
  // Secret titles check first
  const secret = getSecretTitle(data);
  if (secret) {
    return { title: secret, isSecret: true };
  }
  return { title: getNormalTitle(data), isSecret: false };
}

// --- 3. RARITY & AURA (Section 4) ---

const RARITY_TIERS = ['Common', 'Rare', 'Epic', 'Legendary'];

export function calculateRarity(score, isSecret = false) {
  let baseRarity = 'Common';
  if (score >= 85) baseRarity = 'Legendary';
  else if (score >= 65) baseRarity = 'Epic';
  else if (score >= 40) baseRarity = 'Rare';
  else baseRarity = 'Common';

  if (!isSecret) return baseRarity;

  // Secret title moves card up one tier (max Legendary)
  const idx = RARITY_TIERS.indexOf(baseRarity);
  const upgradedIdx = Math.min(RARITY_TIERS.length - 1, idx + 1);
  return RARITY_TIERS[upgradedIdx];
}

export function calculateAura(score, stars, followers) {
  const roundedScore = Math.round(score);
  const s = Math.min(Math.max(0, stars || 0), 3000);
  const f = Math.min(Math.max(0, followers || 0), 3000);
  const aura = (roundedScore - 50) * 100 + s + f;
  return aura;
}

export function formatAura(aura) {
  const sign = aura > 0 ? '+' : (aura < 0 ? '-' : '+');
  const absVal = Math.abs(aura).toLocaleString();
  return `${sign}${absVal}`;
}

// --- 4. ARCHETYPE MIX (Section 4) ---

export function calculateArchetypes(stats, profile, languages) {
  const commits = stats?.commits || 0;
  const stars = stats?.stars || 0;
  const longestStreak = stats?.longestStreak || 0;
  const prsMerged = stats?.prsMerged || 0;
  const langCount = Array.isArray(languages) ? languages.length : 0;
  const nightShare = stats?.nightShare || 0;
  const monthsActive = profile?.monthsActive !== undefined ? profile.monthsActive : 12;

  const ageFactor = monthsActive < 12 ? Math.max(monthsActive / 12, 0.25) : 1;
  const capCommits = 1500 * ageFactor;
  const capPRs = 60 * ageFactor;

  const archetypes = [
    { name: 'Grinder', val: sqrtCurve(commits, capCommits) },
    { name: 'Night Owl', val: nightShare !== null && nightShare !== undefined ? nightShare : 0 },
    { name: 'Star Chaser', val: logCurve(stars, 1000) },
    { name: 'Team Player', val: sqrtCurve(prsMerged, capPRs) },
    { name: 'Explorer', val: Math.min(langCount, 5) / 5 },
    { name: 'Streaker', val: sqrtCurve(longestStreak, 45) }
  ];

  // Sort descending
  archetypes.sort((a, b) => b.val - a.val);
  const top3 = archetypes.slice(0, 3);
  const sum = top3.reduce((acc, a) => acc + a.val, 0);

  if (sum <= 0.001) {
    return '100% Mystery';
  }

  const pcts = top3.map(a => Math.round((a.val / sum) * 100));
  const totalPct = pcts.reduce((acc, p) => acc + p, 0);
  const leftover = 100 - totalPct;
  pcts[0] += leftover; // Give leftover to top one

  return `${pcts[0]}% ${top3[0].name}, ${pcts[1]}% ${top3[1].name}, ${pcts[2]}% ${top3[2].name}`;
}

// --- 5. UNIQUE REACTIONS POOLS (Tagged Soft, Medium, Savage) (Section 5) ---

export const OPENERS = {
  // Secret Titles
  'The 4AM Menace': {
    Soft: [
      'you code while the moon is out, keeping the servers company.',
      'vampire hours in the terminal, softly cooking.',
      'the late night quiet fuels your code rhythm.'
    ],
    Medium: [
      'committing at 4am like your bugs owe you rent money.',
      'sleep is optional and compiler errors are personal enemies.',
      'operating strictly in the dark roast timezone.'
    ],
    Savage: [
      '4am commits? your circadian rhythm packed its bags and left.',
      'bro is haunting the IDE like a Victorian ghost with wifi.',
      'your melatonin receptors have filed a class-action lawsuit.'
    ]
  },
  'Fork Collector': {
    Soft: [
      'collecting repositories like rare vintage postcards.',
      'curating the finest open source projects in your library.',
      'your profile is a museum of great developer ideas.'
    ],
    Medium: [
      'forking repos faster than a brunch buffet on Sunday.',
      'repos collected: plenty. original commits: loading.',
      'certified open source archivist, hoarding all the repos.'
    ],
    Savage: [
      'bro treats GitHub like Pinterest. just vibes and borrowed code.',
      'more forks than an Italian restaurant, zero original sauces.',
      'you didn\'t build the wheel, but you definitely forked it.'
    ]
  },
  'One-Hit Wonder': {
    Soft: [
      'that flagship repo is carrying your developer story.',
      'one golden project that found its audience in style.',
      'a standout repository that devs genuinely appreciate.'
    ],
    Medium: [
      'one repo doing 90% of the heavy lifting on your profile.',
      'living off that one viral side project like a retired pop star.',
      'all your stars are in one basket, but hey, it\'s a nice basket.'
    ],
    Savage: [
      'your other repos are basically backup dancers with no mic.',
      'one repo has main character energy, the rest are NPCs.',
      'peaked in that one release and never dropped the sequel.'
    ]
  },
  'Weekend Warrior': {
    Soft: [
      'coding for the pure joy of it when the weekend arrives.',
      'turning Saturday morning coffee into working software.',
      'weekend maker vibes, building passion projects on your own time.'
    ],
    Medium: [
      'clocking out of your week just to clock right into git push.',
      'your Saturday night plans consist of fixing merge conflicts.',
      'weekdays are quiet, but Saturday your terminal catches fire.'
    ],
    Savage: [
      'bestie spends Saturday night battling CSS flexbox. touch grass.',
      'the club couldn\'t handle you, so you opened visual studio code.',
      'who needs a weekend social life when you have git rebase?'
    ]
  },
  'Comeback Kid': {
    Soft: [
      'back in the terminal and building with fresh momentum.',
      'the comeback season has officially begun on your graph.',
      'stepping back to the keyboard with clear intent.'
    ],
    Medium: [
      'woke up from a 90-day hibernation and chose git violence.',
      'the comeback arc is heating up, green squares multiplying.',
      'suddenly remembered your GitHub login and went crazy.'
    ],
    Savage: [
      'ghosted GitHub for months, now acting like you never left.',
      'three months of radio silence followed by manic commit energy.',
      'your repos thought you died, but look at you locking in.'
    ]
  },

  // Normal Titles
  'Ghost Contributor': {
    Soft: [
      'a quiet developer profile waiting for its moment to shine.',
      'taking the minimalist approach to public version control.',
      'repos resting peacefully until the right idea strikes.'
    ],
    Medium: [
      'bestie, your repos are collecting dust. it\'s giving ghost town.',
      'github thinks you moved to another planet without leaving a note.',
      'repos sitting there like abandoned Minecraft survival servers.'
    ],
    Savage: [
      'commit history emptier than my bank account on Monday.',
      'bro treats git push like a once-a-decade planetary event.',
      'cobwebs in the terminal, spiders have built homes in your repos.'
    ]
  },
  'Star Magnet': {
    Soft: [
      'developers admire your work and stargaze your projects.',
      'curating repos that developers genuinely bookmark and share.',
      'clean projects that attract quiet appreciation across GitHub.'
    ],
    Medium: [
      'devs are actually fans of you. it\'s giving celebrity developer.',
      'your aura is unmatched, stars just show up in your inbox.',
      'open source paparazzi bookmarking your releases in bulk.'
    ],
    Savage: [
      'flexing stars like designer logos while other devs starve.',
      'walking through GitHub with VIP backstage passes and security.',
      'stop hogging all the stars, save some bookmark energy for the rest.'
    ]
  },
  'Commit Goblin': {
    Soft: [
      'steady, daily dedication to shipping and refining code.',
      'consistency that keeps the repository engine running clean.',
      'steady green tiles telling a story of daily craftsmanship.'
    ],
    Medium: [
      'bro is locked in. your commit graph is greener than my future.',
      'no cap, you commit like it\'s a full-time personality trait.',
      'keyboard switches fighting for their lives against your fingers.'
    ],
    Savage: [
      'are you okay? your commit count is a cry for psychological help.',
      'committing 10 times a day just to change variable names. be real.',
      'git push is your only coping mechanism and it honestly shows.'
    ]
  },
  'Streak Royalty': {
    Soft: [
      'unshakable daily habits that build long-term mastery.',
      'a steady developer rhythm that keeps momentum alive.',
      'consistency is your quiet superpower in the terminal.'
    ],
    Medium: [
      'that streak is crazy, you\'re not human. pure discipline.',
      'unbroken streak queen/king behavior right here on display.',
      'a consistency demon. the Duolingo bird is taking notes.'
    ],
    Savage: [
      'not missing a single day is slightly unhinged. seek fresh air.',
      'streak longer than your last three relationships combined.',
      'committing a single period just to save the streak. we see you.'
    ]
  },
  'Open Source Hero': {
    Soft: [
      'generously helping maintainers and strangers solve problems.',
      'making open source a little kinder and more reliable.',
      'community-first mindset that strengthens shared tooling.'
    ],
    Medium: [
      'merging PRs for strangers, certified main character behavior.',
      'carrying the open source ecosystem on your tired shoulders.',
      'fixing upstream bugs for free because you\'re built different.'
    ],
    Savage: [
      'unpaid digital janitor for billion-dollar tech corporations. slay.',
      'solving bugs for free while your own side projects collect dust.',
      'working two full-time jobs, one pays in imaginary karma.'
    ]
  },
  'Night Owl Coder': {
    Soft: [
      'finding focus when the world sleeps and distractions fade.',
      'nighttime developer calm, coding under quiet moonlight.',
      'thoughtful late-night sessions where architecture comes together.'
    ],
    Medium: [
      'sleep is optional and so are your compiler warnings.',
      '3am commits detected, touch grass at some point bestie.',
      'your code runs exclusively on dark roast espresso and vibes.'
    ],
    Savage: [
      'the sun is your compiler error. daylight repels you instantly.',
      'your sleep schedule looks like a barcode from a dollar store.',
      'debugging at 3am because your life decisions led you here.'
    ]
  },
  'Language Hopper': {
    Soft: [
      'versatile multilingual developer curious about many platforms.',
      'speaking multiple paradigms across the modern software stack.',
      'broad engineering horizon that adapts to every technical need.'
    ],
    Medium: [
      'six different languages? pick a struggle bestie, you\'re chaotic.',
      'a polyglot flex, switching paradigms like a seasonal wardrobe.',
      'stack overflow search history must look like the United Nations.'
    ],
    Savage: [
      'jack of all trades, master of missing semicolons in 6 syntaxes.',
      'switching languages every week to avoid finishing any project.',
      'you know how to print "hello world" in 8 languages and stop there.'
    ]
  },
  'Tutorial Hell Survivor': {
    Soft: [
      'putting in the foundational reps and ready to build real tools.',
      'a solid learning phase preparing for breakout independent builds.',
      'every senior engineer built those same starter repositories.'
    ],
    Medium: [
      'ten todo apps deep and still standing. the grind is real.',
      'survived the tutorial trenches, now time to ship real products.',
      'stack of boilerplate repos with immense untapped potential.'
    ],
    Savage: [
      'bro watched 80 hours of YouTube courses just to make a counter app.',
      'ten todo apps, zero users, and an empty netlify deploy queue.',
      'tutorial boilerplate holding your entire portfolio together.'
    ]
  },
  'Quiet Builder': {
    Soft: [
      'steady, honest craftsmanship without the social media noise.',
      'shipping practical code at a calm, sustainable developer pace.',
      'unpretentious engineering that quietly gets the job done.'
    ],
    Medium: [
      'low-key cooking. not loud, but the code is mid-to-good.',
      'silent moves in private, shipping code without the Twitter drama.',
      'calm aesthetic, minding your own business and your pull requests.'
    ],
    Savage: [
      'stealth mode? or just afraid to show the code to other humans?',
      'quietly coding, quietly mid, quietly keeping expectations low.',
      'neither a menace nor a celebrity, just peacefully existing.'
    ]
  }
};

// CLOSERS (Verdict lines tagged Soft, Medium, Savage)
export const CLOSERS = {
  'needs a glow-up': {
    Soft: [
      'we believe in your next repo arc. one push starts the fire.',
      'a quiet season, but the comeback story is going to hit different.',
      'every senior developer once stared at an empty contribution grid.'
    ],
    Medium: [
      'starter pack vibes. one solid weekend project will fix this.',
      'your repos are in hibernation, wake them up bestie.',
      'the potential is immense, your keyboard awaits your return.'
    ],
    Savage: [
      'git commit -m "started caring" when? we\'re waiting.',
      'it\'s giving minimalist developer aesthetic taken way too far.',
      'Rome wasn\'t built in a day, but at least Rome had workers.'
    ]
  },
  'mid but loading': {
    Soft: [
      'solid rhythm. you\'re closer to your breakout project than you think.',
      'reliable foundation that continues to grow with every commit.',
      'the progress is undeniable, keep building with quiet confidence.'
    ],
    Medium: [
      'cooking with medium heat. turn the burner up a notch.',
      'the vibes are immaculate, just ship that side project.',
      'one more commit and you\'re cooked in a good way.'
    ],
    Savage: [
      'respectable NPC developer energy, not bad but not breaking records.',
      'definitely knows how to exit vim on the first try, nothing more.',
      'safe and steady, the beige Honda Civic of developer profiles.'
    ]
  },
  'certified vibes': {
    Soft: [
      'high-tier developer energy, inspiring consistency and clean craft.',
      'a profile that reflects seasoned experience and pride in code.',
      'healthy, flourishing repositories that command developer respect.'
    ],
    Medium: [
      'smooth workflow and consistent heat in the terminal.',
      'certified clean code energy. very aesthetic contributions.',
      'aura is climbing fast, repos looking nourished and active.'
    ],
    Savage: [
      'hire this person, then apologize to their sleep schedule.',
      'cooking so hard the fire alarm in your terminal went off.',
      'clearly addicted to git push, but at least you\'re good at it.'
    ]
  },
  'main character energy': {
    Soft: [
      'an inspiring beacon of mastery and leadership across open source.',
      'extraordinary craftsmanship that elevates the developer community.',
      'masterclass in software discipline and high-impact contributions.'
    ],
    Medium: [
      'unmatched aura. you basically own the command line terminal.',
      '10x developer detected, save some commits for the rest of us.',
      'pure main character behavior. the terminal bows before you.'
    ],
    Savage: [
      'certified 10x aura. no notes, just terrified of your dedication.',
      'github is basically your legal residence at this point.',
      'unapologetic titan status, you broke the grading scale entirely.'
    ]
  }
};

// CALLOUT TEMPLATES (Strongest & Weakest with placeholders)
export const CALLOUTS = {
  commits: {
    strong: [
      '{commits} commits in a year? your keyboard is begging for mercy.',
      'pushing {commits} commits is certified workhorse behavior.',
      '{commits} commits deep, your commit graph is a green wall.',
      '{commits} contributions logged, absolute consistency demon.'
    ],
    weak: [
      'only {commits} commits this year? repos feeling lonely bestie.',
      'with {commits} commits, the terminal is collecting dust.',
      '{commits} commits logged, running on extreme battery saver mode.',
      'just {commits} commits, taking the minimalist developer path.'
    ]
  },
  stars: {
    strong: [
      '{stars} stars earned! developers actually bookmark your creations.',
      '{stars} stars on your repos, that aura is genuinely heavy.',
      'casual flex with {stars} stars, people admire your work.',
      '{stars} stars collected, open source paparazzi is watching.'
    ],
    weak: [
      '{stars} stars on own repos, building strictly for the shadows.',
      'sitting on {stars} stars, underground indie developer aesthetic.',
      '{stars} stars total, pure stealth mode without the vanity metrics.',
      'only {stars} stars, but hey, true art is often misunderstood.'
    ]
  },
  streak: {
    strong: [
      '{streak}-day streak? you don\'t take days off, pure machine.',
      '{streak} days unbroken, that dedication is slightly terrifying.',
      '{streak} days straight of coding, Duolingo bird respects you.',
      'a {streak}-day continuous run, you unlocked royal consistency.'
    ],
    weak: [
      'longest streak was {streak} days, vacations are important bestie.',
      'peaked at a {streak}-day streak, developer hibernations are real.',
      '{streak} days of streak, sporadic burst coding is valid too.',
      '{streak} days in a row max, taking pacing very seriously.'
    ]
  },
  prsMerged: {
    strong: [
      '{prsMerged} PRs merged into the wild, open source community hero.',
      '{prsMerged} merged pull requests, shipping changes for the culture.',
      'merging {prsMerged} PRs, maintainers genuinely appreciate you.',
      '{prsMerged} PRs crossed the finish line, collaborative powerhouse.'
    ],
    weak: [
      '{prsMerged} merged PRs, keeping your code close to the chest.',
      'only {prsMerged} merged PRs, strictly a solo developer operator.',
      '{prsMerged} PRs merged, avoiding other people\'s codebases like the plague.',
      '{prsMerged} PRs merged, keeping pull requests strictly personal.'
    ]
  },
  followers: {
    strong: [
      '{followers} followers watching your moves, developer influencer status.',
      '{followers} devs follow you, your releases have an audience.',
      '{followers} followers strong, you have actual GitHub spectators.',
      '{followers} developers tapped follow, certified technical aura.'
    ],
    weak: [
      '{followers} followers on GitHub, building away from the crowd.',
      '{followers} followers total, peace and quiet in the notifications tab.',
      '{followers} followers, flying under the social radar completely.',
      '{followers} followers, zero influencer noise, just pure builds.'
    ]
  },
  activeDays: {
    strong: [
      '{activeDays} active days this year, you practically live on GitHub.',
      '{activeDays} days logged in green, relentless daily presence.',
      '{activeDays} days showing up, you built a fortress of consistency.',
      '{activeDays} days of activity, making every month count.'
    ],
    weak: [
      '{activeDays} active days out of 365, quality over quantity surely.',
      'coded on {activeDays} days, respecting the offline life.',
      '{activeDays} active days logged, seasonal developer cycle.',
      '{activeDays} days on the calendar, plenty of room for an arc.'
    ]
  },
  languages: {
    strong: [
      '{languages} languages on deck, speaking fluent polyglot.',
      '{languages} languages in rotation, fearless with new syntax.',
      '{languages} distinct languages, compiler chameleon.',
      '{languages} languages used, never locked into one ecosystem.'
    ],
    weak: [
      'focused on {languages} language(s), specialization over chaos.',
      'sticking to {languages} language(s), loyal to the chosen stack.',
      '{languages} language(s) found, mastering the core toolkit.',
      '{languages} language(s) in use, no unnecessary syntax hopping.'
    ]
  }
};

// Daily Vibe Predictions (Section 6: Hash of username + YYYY-MM-DD)
export const DAILY_VIBE_PREDICTIONS = [
  'today your code will compile on the first try without warnings.',
  'a merge conflict is waiting, but your git rebase skills will prevail.',
  'today is the day to push directly to main and feel the adrenaline.',
  'a stranger will star your oldest repository before midnight.',
  'your terminal will grant you enlightenment after one more coffee.',
  'today\'s vibe: clean commits, zero bugs, infinite aura.',
  'a junior developer will learn from your pull request today.',
  'someone is secretly reading your commit messages and laughing.',
  'your next side project idea will hit you in the shower.',
  'today your tests will pass, even the flaky ones.',
  'the universe recommends refactoring that 400-line function.',
  'today you will close that issue that\'s been open for 3 months.',
  'a sudden burst of 10x developer energy is heading your way.',
  'your coffee to commit ratio today will achieve perfect balance.',
  'an open source maintainer will approve your PR with no comments.',
  'today you will finally understand why that regex works.',
  'your code aura is shining especially bright in the IDE today.',
  'a mysterious bug will vanish the moment you add a console.log.',
  'the developer gods smile upon your indentation choices today.',
  'you are one commit away from unlocking a new technical superpower.',
  'today your git diff will look like modern art.',
  'beware of missing semicolons, but embrace bold architectural moves.',
  'your favorite language will release an update you actually like.',
  'today is ideal for clearing your desktop of 40 screenshot files.',
  'a breakthrough realization about async code will strike at lunch.',
  'your commit graph will shine brighter than your screen brightness.',
  'someone will bookmark your repo and tell their team about it.',
  'today the compiler is your friend, not your enemy.',
  'a side project you abandoned will suddenly sound genius again.',
  'high vibes in the terminal today: ship it and don\'t look back.',
  'today you will exit vim on your first attempt with zero panic.'
];

export function getDailyVibe(username, dateStr) {
  const seedStr = `${(username || 'vibe').toLowerCase()}-${dateStr || new Date().toISOString().split('T')[0]}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_VIBE_PREDICTIONS.length;
  return DAILY_VIBE_PREDICTIONS[index];
}

// Helper: Simple deterministic hash for history tracking
function getUniqueLine(pool, historySet) {
  if (!pool || pool.length === 0) return '';
  const fresh = pool.filter(line => !historySet.has(line));
  const candidatePool = fresh.length > 0 ? fresh : pool;
  const picked = candidatePool[Math.floor(Math.random() * candidatePool.length)];
  historySet.add(picked);
  return picked;
}

// Generate unique 3-line reaction matching Section 5
export function generateReaction(titleInfo, score, label, data, roastLevel = 'Medium', historySet = new Set()) {
  const stats = data?.stats || {};
  const profile = data?.profile || {};
  const languages = data?.languages || [];

  const title = typeof titleInfo === 'object' ? titleInfo.title : titleInfo;
  const isSecret = typeof titleInfo === 'object' ? titleInfo.isSecret : false;

  const level = ['Soft', 'Medium', 'Savage'].includes(roastLevel) ? roastLevel : 'Medium';

  // 1. OPENER
  // From dev title (or score label for secret titles)
  let openerPool = null;
  if (isSecret && OPENERS[title]) {
    openerPool = OPENERS[title][level] || OPENERS[title]['Medium'];
  } else if (OPENERS[title]) {
    openerPool = OPENERS[title][level] || OPENERS[title]['Medium'];
  } else {
    openerPool = OPENERS['Quiet Builder'][level] || OPENERS['Quiet Builder']['Medium'];
  }
  const line1 = getUniqueLine(openerPool, historySet);

  // 2. CALLOUT (Strongest vs Weakest Stat)
  const commits = stats.commits || 0;
  const stars = stats.stars || 0;
  const longestStreak = stats.longestStreak || 0;
  const prsMerged = stats.prsMerged || 0;
  const followers = profile.followers || 0;
  const activeDays = stats.activeDays || 0;
  const langCount = Array.isArray(languages) ? languages.length : 0;
  const monthsActive = profile.monthsActive !== undefined ? profile.monthsActive : 12;

  const ageFactor = monthsActive < 12 ? Math.max(monthsActive / 12, 0.25) : 1;

  const statScores = [
    { key: 'commits', val: sqrtCurve(commits, 1500 * ageFactor), raw: commits },
    { key: 'stars', val: logCurve(stars, 1000), raw: stars },
    { key: 'streak', val: sqrtCurve(longestStreak, 45), raw: longestStreak },
    { key: 'prsMerged', val: sqrtCurve(prsMerged, 60 * ageFactor), raw: prsMerged },
    { key: 'followers', val: logCurve(followers, 500), raw: followers },
    { key: 'activeDays', val: sqrtCurve(activeDays, 200 * ageFactor), raw: activeDays },
    { key: 'languages', val: Math.min(langCount, 5) / 5, raw: langCount }
  ];

  statScores.sort((a, b) => b.val - a.val);
  const strongest = statScores[0];
  const weakest = statScores[statScores.length - 1];

  let chosenStat = strongest;
  let useStrong = true;

  if (score >= 60) {
    chosenStat = strongest;
    useStrong = true;
  } else if (score < 40) {
    chosenStat = weakest;
    useStrong = false;
  } else {
    useStrong = Math.random() > 0.5;
    chosenStat = useStrong ? strongest : weakest;
  }

  const calloutTemplates = (CALLOUTS[chosenStat.key] && CALLOUTS[chosenStat.key][useStrong ? 'strong' : 'weak'])
    || CALLOUTS.commits[useStrong ? 'strong' : 'weak'];

  let line2Template = getUniqueLine(calloutTemplates, historySet);
  // Replace tokens
  const line2 = line2Template
    .replace('{commits}', (commits || 0).toLocaleString())
    .replace('{stars}', (stars || 0).toLocaleString())
    .replace('{streak}', (longestStreak || 0).toString())
    .replace('{prsMerged}', (prsMerged || 0).toString())
    .replace('{followers}', (followers || 0).toLocaleString())
    .replace('{activeDays}', (activeDays || 0).toString())
    .replace('{languages}', (langCount || 0).toString());

  // 3. CLOSER (Verdict line)
  const closerGroup = CLOSERS[label] || CLOSERS['mid but loading'];
  const closerPool = closerGroup[level] || closerGroup['Medium'];
  const line3 = getUniqueLine(closerPool, historySet);

  return {
    lines: [line1, line2, line3],
    verdict: line3
  };
}

// --- 6. GUESS THE SCORE EVALUATION (Section 6) ---
export function evaluateGuess(actualScore, guessedScore) {
  if (guessedScore === null || guessedScore === undefined) return null;
  const diff = guessedScore - actualScore;
  const absDiff = Math.abs(diff);

  if (absDiff <= 5) {
    const lines = [
      'locked in, you know yourself flawlessly.',
      'dead accurate self-awareness, no notes.',
      'you called the score to the digit. legendary intuition.'
    ];
    return {
      band: 'spot_on',
      title: 'locked in',
      comment: lines[Math.floor(Math.random() * lines.length)],
      diff
    };
  }

  if (absDiff <= 15) {
    const lines = [
      'close, not bad at all.',
      'solid intuition, just a few points off.',
      'respectable call, you know your general league.'
    ];
    return {
      band: 'close',
      title: 'close, not bad',
      comment: lines[Math.floor(Math.random() * lines.length)],
      diff
    };
  }

  if (absDiff <= 35) {
    if (diff > 0) {
      const lines = [
        'delulu is the solulu, but stats don\'t lie.',
        'a little optimistic bestie, we respect the confidence.',
        'aimed for the stars, landed a few galaxies closer.'
      ];
      return {
        band: 'delulu',
        title: 'delulu',
        comment: lines[Math.floor(Math.random() * lines.length)],
        diff
      };
    } else {
      const lines = [
        'underrated! you code way harder than you give yourself credit for.',
        'humble king/queen, your stats are significantly louder than your guess.',
        'selling yourself short bestie, your vibe is higher than you thought.'
      ];
      return {
        band: 'underrated',
        title: 'underrated',
        comment: lines[Math.floor(Math.random() * lines.length)],
        diff
      };
    }
  }

  const lines = [
    'not even in the same universe, but we love the mystery.',
    'completely disconnected from reality, pure chaos energy.',
    'were you guessing your battery percentage? wild call.'
  ];
  return {
    band: 'galaxy',
    title: 'not even close',
    comment: lines[Math.floor(Math.random() * lines.length)],
    diff
  };
}

// --- 7. VIBE BATTLE EVALUATION (Section 6) ---
export function evaluateBattle(data1, a1, data2, a2) {
  const score1 = a1.score;
  const score2 = a2.score;
  const aura1 = a1.aura;
  const aura2 = a2.aura;
  const user1 = data1.profile?.login || 'Player 1';
  const user2 = data2.profile?.login || 'Player 2';

  let winner = null;
  let reason = '';
  let marginLine = '';
  const scoreDiff = Math.abs(score1 - score2);

  if (scoreDiff <= 5 && score1 !== score2) {
    marginLine = 'close fight! razor thin margin.';
  } else if (scoreDiff >= 30) {
    marginLine = 'not even close. total blowout victory.';
  } else if (score1 !== score2) {
    marginLine = 'solid battle between two distinct developers.';
  }

  if (score1 > score2) {
    winner = 1;
    reason = `@${user1} cleared with pure main character energy. @${user2} take notes bestie.`;
  } else if (score2 > score1) {
    winner = 2;
    reason = `@${user2} cleared with pure main character energy. @${user1} take notes bestie.`;
  } else {
    // Tie breaker: higher aura wins
    if (aura1 > aura2) {
      winner = 1;
      reason = `tied on vibe score, but @${user1} takes the crown on raw aura power!`;
      marginLine = 'decided by aura tiebreaker!';
    } else if (aura2 > aura1) {
      winner = 2;
      reason = `tied on vibe score, but @${user2} takes the crown on raw aura power!`;
      marginLine = 'decided by aura tiebreaker!';
    } else {
      winner = 0; // Absolute tie
      reason = 'a draw. you two are the same person.';
      marginLine = 'identical frequencies across every metric.';
    }
  }

  return {
    winner, // 1, 2, or 0 (tie)
    winnerUser: winner === 1 ? user1 : (winner === 2 ? user2 : null),
    reason,
    marginLine
  };
}

// --- 8. FULL PROFILE ANALYSIS RUNNER ---
export function analyzeProfile(data, roastLevel = 'Medium', historySet = new Set()) {
  const stats = data?.stats || {};
  const profile = data?.profile || {};
  const languages = data?.languages || [];

  const score = calculateVibeScore(stats, profile, languages);
  const label = getScoreLabel(score);
  const titleInfo = getDevTitle(data);
  const rarity = calculateRarity(score, titleInfo.isSecret);
  const aura = calculateAura(score, stats.stars, profile.followers);
  const formattedAura = formatAura(aura);
  const archetypesRaw = calculateArchetypes(stats, profile, languages);
  const archetypes = {
    summaryLine: typeof archetypesRaw === 'string' ? archetypesRaw : '100% Mystery',
    toString() { return this.summaryLine; }
  };
  const { lines, verdict } = generateReaction(titleInfo, score, label, data, roastLevel, historySet);

  const today = new Date().toISOString().split('T')[0];
  const dailyVibe = getDailyVibe(profile.login, today);

  return {
    score,
    label,
    title: titleInfo.title,
    isSecret: titleInfo.isSecret,
    rarity,
    aura,
    formattedAura,
    archetypes,
    reactionLines: lines,
    verdict,
    dailyVibe
  };
}
