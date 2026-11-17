// api/vibe.js - GitHub Vibe Check Serverless Function
// Fetches raw GitHub data for a user using REST & GraphQL APIs.
// No scoring, titles, or reactions are computed here.

// Load environment variables if running in local Node environment without Vercel CLI
if (!process.env.GITHUB_TOKEN) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      try { process.loadEnvFile('.env.local'); } catch (_) {
        try { process.loadEnvFile('.env'); } catch (_) {}
      }
    }
  } catch (_) {}
}

const CACHE_HEADER = 's-maxage=600, stale-while-revalidate=300';

function sendJson(res, statusCode, data) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', CACHE_HEADER);
  }
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  if (typeof res.writeHead === 'function') {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Cache-Control': CACHE_HEADER
    });
    return res.end(JSON.stringify(data));
  }
  return data;
}

function cleanUsername(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.trim();

  // Handle pasted profile URLs (e.g., https://github.com/octocat or github.com/octocat/foo)
  if (cleaned.includes('github.com') || cleaned.includes('/')) {
    cleaned = cleaned.split('?')[0].split('#')[0];
    cleaned = cleaned.replace(/\/+$/, '');
    const parts = cleaned.split('/');
    cleaned = parts[parts.length - 1];
  }

  // Remove leading @ symbols
  cleaned = cleaned.replace(/^@+/, '').trim();

  // GitHub usernames: 1-39 chars, alphanumeric or single hyphens, not starting/ending with hyphen
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

function getAuthHeaders(token) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'github-vibe-check'
  };
  if (token && token !== 'your_token_here') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function calculateStreaks(calendar) {
  let longestStreak = 0;
  let tempStreak = 0;

  for (const day of calendar) {
    if (day.count > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  let currentStreak = 0;
  let idx = calendar.length - 1;

  // If today has 0 contributions so far, check if streak extends to yesterday
  if (idx >= 0 && calendar[idx].count === 0) {
    idx--;
  }

  while (idx >= 0 && calendar[idx].count > 0) {
    currentStreak++;
    idx--;
  }

  return { longestStreak, currentStreak };
}

export default async function handler(req, res) {
  // Read username from query params
  let rawUser = req.query?.user;
  if (!rawUser && req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      rawUser = url.searchParams.get('user');
    } catch (_) {}
  }

  const username = cleanUsername(rawUser);
  if (!username) {
    return sendJson(res, 404, { error: 'not_found' });
  }

  const token = process.env.GITHUB_TOKEN?.trim();
  const headers = getAuthHeaders(token);

  try {
    // 1. REST GET /users/{username}
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });

    if (userRes.status === 404) {
      return sendJson(res, 404, { error: 'not_found' });
    }
    if (userRes.status === 403 || userRes.status === 429) {
      return sendJson(res, 429, { error: 'rate_limited' });
    }
    if (!userRes.ok) {
      return sendJson(res, 500, { error: 'server_error' });
    }

    const userData = await userRes.json();

    // 2. REST GET /users/{username}/repos?per_page=100&sort=pushed
    const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, { headers });
    let reposData = [];
    if (reposRes.ok) {
      reposData = await reposRes.json();
    } else if (reposRes.status === 403 || reposRes.status === 429) {
      return sendJson(res, 429, { error: 'rate_limited' });
    }

    // Calculate stars, languages, and topRepos
    let totalStars = 0;
    const langCounts = {};
    let totalLangRepos = 0;

    for (const repo of reposData) {
      totalStars += (repo.stargazers_count || 0);
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        totalLangRepos++;
      }
    }

    // Top 4 languages with percentages
    const languages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({
        name,
        percent: totalLangRepos > 0 ? Math.round((count / totalLangRepos) * 100) : 0
      }));

    // Top 2 repos by stars (prefer non-forks, fallback to forks if needed)
    const sortedRepos = [...reposData].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
    const nonForks = sortedRepos.filter(r => !r.fork);
    const candidateRepos = nonForks.length >= 2 ? nonForks : sortedRepos;
    const topRepos = candidateRepos.slice(0, 2).map(r => ({
      name: r.name,
      stars: r.stargazers_count || 0,
      language: r.language || 'Plain Text'
    }));

    // Commit hours from recent commits of the latest pushed public repos
    let commitHours = [];
    const recentRepos = reposData.filter(r => !r.fork).slice(0, 2);
    for (const repo of recentRepos) {
      try {
        const commitsRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(repo.owner?.login || username)}/${encodeURIComponent(repo.name)}/commits?author=${encodeURIComponent(username)}&per_page=30`,
          { headers }
        );
        if (commitsRes.ok) {
          const commits = await commitsRes.json();
          if (Array.isArray(commits)) {
            for (const c of commits) {
              const dateStr = c.commit?.author?.date || c.commit?.committer?.date;
              if (dateStr) {
                // Git commit timestamp format: YYYY-MM-DDTHH:MM:SS+00:00
                // Use author's local wall-clock hour if available in ISO string, else Date hour
                const match = dateStr.match(/T(\d{2}):/);
                if (match) {
                  commitHours.push(parseInt(match[1], 10));
                } else {
                  commitHours.push(new Date(dateStr).getHours());
                }
              }
            }
          }
        }
      } catch (_) {}
      if (commitHours.length >= 20) break;
    }

    // 3. REST GET /search/issues?q=author:{username}+type:pr+is:merged
    let prsMerged = 0;
    try {
      const searchRes = await fetch(
        `https://api.github.com/search/issues?q=author:${encodeURIComponent(username)}+type:pr+is:merged`,
        { headers }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        prsMerged = searchData.total_count || 0;
      }
    } catch (_) {}

    // 4. GraphQL contributionsCollection
    let calendar = [];
    let commits = 0;
    let prsOpened = 0;
    let issues = 0;
    let longestStreak = 0;
    let currentStreak = 0;

    if (token && token !== 'your_token_here') {
      const graphqlQuery = {
        query: `
          query($username: String!) {
            user(login: $username) {
              contributionsCollection {
                totalCommitContributions
                restrictedContributionsCount
                totalIssueContributions
                totalPullRequestContributions
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      contributionCount
                      date
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { username }
      };

      try {
        const gqlRes = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(graphqlQuery)
        });

        if (gqlRes.ok) {
          const gqlData = await gqlRes.json();
          const collection = gqlData.data?.user?.contributionsCollection;
          if (collection) {
            commits = (collection.totalCommitContributions || 0) + (collection.restrictedContributionsCount || 0);
            prsOpened = collection.totalPullRequestContributions || 0;
            issues = collection.totalIssueContributions || 0;

            const weeks = collection.contributionCalendar?.weeks || [];
            for (const week of weeks) {
              for (const day of week.contributionDays || []) {
                calendar.push({
                  date: day.date,
                  count: day.contributionCount || 0
                });
              }
            }

            const streaks = calculateStreaks(calendar);
            longestStreak = streaks.longestStreak;
            currentStreak = streaks.currentStreak;
          }
        }
      } catch (_) {}
    }

    // Assemble profile data
    const createdAtDate = userData.created_at ? userData.created_at.split('T')[0] : '';
    const responsePayload = {
      profile: {
        login: userData.login,
        name: userData.name || userData.login,
        avatar: userData.avatar_url || '',
        bio: userData.bio || '',
        followers: userData.followers || 0,
        following: userData.following || 0,
        createdAt: createdAtDate,
        publicRepos: userData.public_repos || 0
      },
      stats: {
        stars: totalStars,
        commits,
        prsOpened,
        prsMerged,
        issues,
        longestStreak,
        currentStreak
      },
      languages,
      topRepos,
      calendar,
      commitHours
    };

    return sendJson(res, 200, responsePayload);
  } catch (err) {
    return sendJson(res, 500, { error: 'server_error' });
  }
}
