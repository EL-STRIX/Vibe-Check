# GitHub Vibe Check: Tech Stack

Everything the AI agent needs to know about what to use, why, and how the pieces connect. Simple on purpose: no frameworks, no database, no build tools.

## 1. Stack at a Glance

| Part | Choice | Why |
| --- | --- | --- |
| Frontend | HTML + CSS + JavaScript (plain) | One page only, no framework needed, fastest to load |
| Backend | One serverless function in Node.js | Hides the GitHub token, nothing else |
| Data source | GitHub REST API + GraphQL API | Built into GitHub, nothing to create |
| Auth to GitHub | One Personal Access Token (classic, no scopes) | Higher rate limit and required for contribution data |
| Hosting | Vercel (free plan) | Hosts the page and the function together, zero setup |
| Code storage | GitHub repository | Vercel deploys straight from it |
| Database | None | Nothing needs to be saved |
| Login | None | Not part of the project |

## 2. Frontend

**Technology:** plain HTML, CSS and JavaScript. No React, no Vue, no Tailwind, no bundler, no npm install for the frontend.

**Why plain and not React:** the project is one page with three screens (landing, loading, result). Plain JavaScript can show and hide those screens easily. React would add setup, build steps and files without any benefit here.

**Rules for the frontend code:**

- Use modern JavaScript (ES modules, `fetch`, `async/await`)
- Fonts come from Google Fonts: Space Grotesk and Inter
- Charts, the heatmap and the score ring are drawn with plain CSS and SVG, no chart library
- Themes (dark and light) work with CSS variables and a `data-theme` attribute on the page
- Remember the chosen theme with `localStorage` (this is the only thing ever saved, and only in the visitor's own browser)
- The page never calls GitHub directly. It only calls `/api/vibe`

**Libraries loaded from a CDN (no install, use a script tag):**

| Library | Used for |
| --- | --- |
| canvas-confetti (version 1.9.3) | Confetti when the score is 80 or more |
| html-to-image (version 1.11.11) | Turning the share card into a downloadable image |

That is the complete list. Do not add any other library.

## 3. Backend: One Serverless Function

**What it is:** a single small JavaScript file (`api/vibe.js`) that Vercel runs only when someone checks a username. It is not a server that stays on all day, and you never manage it.

**Language:** JavaScript (Node.js 20 or newer). Same language as the frontend, and `fetch` is built in, so no packages are needed.

**Why it is needed:** the GitHub token must stay secret. If the token is placed in the frontend, anyone can open the page source and steal it. The function keeps the token on Vercel's side, where nobody can see it.

**What the function does, in order:**

1. Reads the username from the request: `/api/vibe?user=USERNAME`
2. Cleans it (trim spaces, remove a leading `@`, keep only valid GitHub username characters) and rejects anything else
3. Calls GitHub using the secret token (see section 4)
4. Combines the answers into one small JSON object
5. Sends that JSON back with a cache header so repeated checks of the same user are fast
6. If anything fails, returns a clear error code the frontend can turn into a funny message: `not_found`, `rate_limited` or `server_error`

**What the function does not do:** no scoring, no titles, no reactions. It only returns raw stats. The scoring and reaction logic lives in the frontend file `reactions.js`, so the rules can be changed easily without touching the backend.

**Example of what the function returns (shortened):**

```json
{
  "profile": { "login": "octocat", "name": "The Octocat", "avatar": "https://...", "bio": "...", "followers": 120, "following": 8, "createdAt": "2011-01-25", "publicRepos": 8 },
  "stats": { "stars": 340, "commits": 812, "prsOpened": 40, "prsMerged": 31, "issues": 12, "longestStreak": 21, "currentStreak": 4 },
  "languages": [ { "name": "JavaScript", "percent": 52 }, { "name": "Python", "percent": 30 } ],
  "topRepos": [ { "name": "hello-world", "stars": 200, "language": "JavaScript" } ],
  "calendar": [ { "date": "2026-01-01", "count": 3 } ],
  "commitHours": [0, 0, 1, 3, 5]
}
```

## 4. GitHub APIs Used

Both APIs are built into GitHub. You do not create or host either of them. You only call them.

| Call | Type | Gives |
| --- | --- | --- |
| `GET /users/{username}` | REST | name, avatar, bio, followers, following, join date, repo count |
| `GET /users/{username}/repos?per_page=100&sort=pushed` | REST | repos, stars, languages, top repos |
| `GET /search/issues?q=author:{username}+type:pr+is:merged` | REST | number of merged pull requests |
| `contributionsCollection` query | GraphQL | total commits, PRs, issues, and the daily contribution calendar for the heatmap and streak |

**Streak:** calculated in the backend from the daily calendar. Longest streak in the last 12 months, and the current streak counting back from today.

**Commit hours (for Night Owl and Early Bird):** taken from the timestamps of recent commits in the user's latest public repos. If this cannot be found, the frontend simply skips those badges.

**Limits to respect:**

- Only the latest 100 repos are read. This is enough.
- Only public data is used. Private activity is never shown.
- With the token, the limit is 5,000 requests per hour. Without it, only 60 per hour, and GraphQL does not work at all.

## 5. The GitHub Token

**What it is:** a secret password that lets the function talk to GitHub at a higher limit.

**How to create it (about 2 minutes):**

1. GitHub: Settings, then Developer settings, then Personal access tokens, then Tokens (classic), then Generate new token
2. Name it `vibe-check`
3. Choose an expiry (90 days or no expiration)
4. Tick no scopes. Public data needs none
5. Generate it and copy it once, it will not be shown again

**Where it goes:**

- On Vercel: Project Settings, then Environment Variables, name `GITHUB_TOKEN`, paste the value
- For local testing: a file named `.env.local` in the project folder with one line, `GITHUB_TOKEN=your_token_here`

**Strict rules:**

- Never write the token inside any code file
- Add `.env.local` to `.gitignore` so it is never uploaded to GitHub
- Never paste the token in chat or share it
- If it ever leaks, delete it on GitHub and make a new one

## 6. Hosting and Deployment

**Platform:** Vercel, free plan. It serves the static page and runs the serverless function from the same project, on the same address, so there are no cross-site (CORS) problems.

**Accounts you need (all free):**

- A GitHub account (stores the code, and creates the token)
- A Vercel account (hosts the site)

**Deployment steps:**

1. Put the project folder in a new GitHub repository
2. On Vercel, click New Project and import that repository
3. Leave all build settings empty (there is no build step)
4. Add `GITHUB_TOKEN` under Environment Variables
5. Click Deploy. The site is live at a `.vercel.app` address
6. After that, every push to GitHub updates the live site automatically

**Local testing:** run `npx vercel dev` in the project folder. It runs the page and the function together on your computer, using `.env.local`.

## 7. Caching (keeps it fast and inside the limit)

- The function sends a cache header so Vercel remembers each username's result for about 10 minutes: `Cache-Control: s-maxage=600, stale-while-revalidate=300`
- This needs no database and no extra setup
- If the same user is checked again within 10 minutes, GitHub is not called at all
- Compare mode simply calls `/api/vibe` twice, once per username

## 8. How Everything Connects

1. The visitor types a GitHub id on the landing screen and presses the button
2. The page shows the loading screen and calls `/api/vibe?user=...`
3. The function calls GitHub with the secret token and builds one JSON answer
4. The page receives the JSON
5. `reactions.js` calculates the vibe score, dev title, badges, reaction and verdict from the stats
6. The page shows the result screen with cards, chart, heatmap and reaction
7. If the visitor taps share, `html-to-image` turns the share card into a PNG to download

## 9. Project Files

```
vibe-check/
  index.html        all three screens in one page
  style.css         design, dark and light themes, animations
  app.js            screen switching, fetching, rendering, share card, compare mode
  reactions.js      score rules, titles, badges, reaction lines
  api/
    vibe.js         the serverless function (holds the token logic)
  .gitignore        must include .env.local
  README.md         3 or 4 lines: what it is, how to run, how to set GITHUB_TOKEN
```

No `package.json` is required, because the function uses only built-in Node.js features and the frontend libraries come from a CDN.

## 10. Known Details the Agent Must Handle

- **Avatar in the share card:** GitHub avatars usually load fine, but if the image fails, draw a circle with the first letter of the username instead
- **Large accounts:** abbreviate numbers (1.2k, 3.4M) so cards never break
- **Data that is missing:** if the commit hours cannot be found, skip Night Owl and Early Bird; if the bio is empty, hide the bio line
- **Browser support:** latest Chrome, Safari, Edge and Firefox, on phone and desktop

## 11. What Is Not Used, On Purpose

- No React, Vue, Angular, Next.js or any frontend framework
- No Tailwind or CSS framework, only one hand-written CSS file
- No database, no accounts, no login, no cookies
- No Python, Java, PHP or any second backend language
- No chart library, no UI kit, no icon pack (use emoji and inline SVG)
- No paid services of any kind

If the agent feels something is missing, it must ask before adding anything outside this list.
