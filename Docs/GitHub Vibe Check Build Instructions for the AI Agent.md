# GitHub Vibe Check: Build Instructions for the AI Agent

Read this together with the Project Details doc. This one removes the guesswork: design, rules, content, tech and checks.

## 1. Design Spec

**Vibe:** soft, glassy, playful but premium. Think Spotify Wrapped meets a pastel aesthetic app. Big rounded shapes, lots of breathing room, very little text.

- **Dark mode (default):** background #0F0B1E, card #1A1530, text #F5F3FF, muted text #A8A3C7
- **Light mode:** background #FAF7FF, card #FFFFFF, text #1E1B33, muted text #6B6690
- **Accent gradient:** #A78BFA to #F472B6 to #FB923C (purple, pink, peach). Use it on the title, the button, the score ring and highlights.
- **Fonts (Google Fonts):** Space Grotesk for headings and big numbers, Inter for small text.
- **Cards:** radius 24px, soft shadow, 1px translucent border, slight glass blur.
- **Motion:** cards fade and slide up one after another, numbers count up, score ring fills smoothly, buttons bounce slightly on hover or tap. Confetti only when the score is 80 or more. Keep every animation under 0.8 seconds.
- **Emoji:** use a few, one per card at most. Never a wall of emoji.

## 2. Screen-by-Screen Layout

**Landing**

- Centered big heading: "github vibe check" with the gradient
- One small line under it: "drop your github id, get read."
- One rounded input and one gradient button "check my vibe"
- Theme toggle in the top right corner. Nothing else.

**Loading**

- Pulsing gradient blob in the center
- One funny line that changes every 1.5 seconds: "stalking your commits...", "judging your commit messages...", "counting your stars, relax...", "asking your repos how they feel..."

**Result (top to bottom)**

1. Profile card: avatar, name, @id, one-line bio
2. Dev title in huge gradient text, with the vibe score ring (0 to 100) and its label beside it
3. Reaction text (2 to 3 short lines)
4. Stats row: repos, stars, commits, PRs, followers, streak (big number, tiny label)
5. Language bar: top 4 languages, colored
6. Contribution heatmap: last 12 months, mini size
7. Top 2 repos: name, stars, language
8. Badges: small pills
9. One-line verdict in quotes
10. Buttons: "try another", "share", "compare"

On mobile, everything stacks in a single column in the same order.

## 3. Scoring and Title Rules

Use the last 12 months of activity unless noted.

**Vibe score (0 to 100), rounded:**

- Commits: up to 30 points (1000 commits = full)
- Stars earned: up to 20 points (1000 stars = full, use a log scale so small numbers still count)
- Longest streak in the year: up to 15 points (30 days = full)
- Merged pull requests: up to 15 points (50 = full)
- Followers: up to 10 points (500 = full)
- Language variety: up to 10 points (5 languages = full)

**Score labels:** 0-29 "needs a glow-up", 30-54 "mid but loading", 55-79 "certified vibes", 80-100 "main character energy"

**Dev title (use the first rule that matches, top to bottom):**

| Title | Rule |
| --- | --- |
| Ghost Contributor | fewer than 10 commits and fewer than 3 repos |
| Star Magnet | more than 500 stars |
| Commit Goblin | more than 1500 commits |
| Streak Royalty | streak of 60 days or more |
| Open Source Hero | 30 or more merged PRs |
| Night Owl Coder | more than 50% of commits between 10pm and 4am |
| Language Hopper | 6 or more languages |
| Tutorial Hell Survivor | many small repos, almost no stars or PRs |
| Quiet Builder | none of the above (default) |

**Badges (show any that match, max 4):** Night Owl, Early Bird (most commits 5am to 9am), Streak King/Queen (30+ days), Open Source Hero, Language Hopper, Star Magnet, Fresh Account (joined under 1 year ago), OG (joined 8+ years ago).

Time of day comes from the commit timestamps of the most recent public repos. If it can't be found, skip the Night Owl and Early Bird logic.

## 4. Sample Reaction Lines

Match the tone below: short, confident, funny, never mean about the person, only about the stats. Write at least 6 lines per title and per score label, and pick randomly so every check feels fresh. Use slang naturally, not in every sentence.

- **Commit Goblin:** "bro is locked in. your commit graph is greener than my future." / "no cap, you commit like it's a personality."
- **Star Magnet:** "devs are actually fans of you. it's giving celebrity." / "your aura is unmatched, stars just show up."
- **Ghost Contributor:** "bestie, your repos are collecting dust. it's giving ghost town." / "github thinks you moved to another planet."
- **Night Owl Coder:** "sleep is optional and so are your bugs?? slay." / "3am commits, touch grass at some point."
- **Streak Royalty:** "that streak is crazy, you're not human. respect."
- **Open Source Hero:** "merging PRs for strangers, main character behavior."
- **Tutorial Hell Survivor:** "ten todo apps deep and still standing. the grind is real."
- **Quiet Builder:** "low-key cooking. not loud, but the code is mid-to-good."
- **Verdict examples:** "verdict: hire this person, then apologize to their sleep schedule." / "verdict: one more commit and you're cooked in a good way."

Roast lightly when the score is under 40, hype hard when it is 60 or more, and in between mix both. End with a small encouraging line when the score is low, so nobody leaves sad.

## 5. Edge Cases (all with a funny message, never a plain error)

| Situation | What to show |
| --- | --- |
| Username not found | "this id doesn't exist. did you make it up? 💀 try again" |
| Empty input | the input shakes and the placeholder says "type something bestie" |
| No public repos | Title "Mystery Person", line "no public repos. mysterious. we respect it." |
| Rate limit or server error | "github is tired rn, try again in a minute" with a retry button |
| No internet | "you're offline. touch grass, then come back" |
| Missing bio or name | use the username and hide the bio line |
| Very big accounts | cap displayed numbers (1.2k, 3.4M) so cards never break |
| Compare with same id twice | "you vs you? that's just self-love" |

Always trim spaces, remove a leading @, and accept pasted profile links by taking the last part of the URL.

## 6. GitHub API: Simple Explanation and Setup

**The problem in plain words:** GitHub lets anyone read basic public data for free, but only a few requests per hour. For commits and the contribution graph you must use a secret key called a token. If the token sits inside the website code, anyone can steal it. So the token must live on a tiny server function that the website calls.

**The solution:** one serverless function on Vercel, at `/api/vibe?user=USERNAME`. It holds the token privately, asks GitHub for everything, calculates the results, and sends one small JSON answer back to the page. The page never talks to GitHub directly and never sees the token.

**What the function calls:**

1. REST `GET /users/{username}`: name, avatar, bio, followers, following, join date, public repo count
2. REST `GET /users/{username}/repos?per_page=100&sort=pushed`: repos, stars, languages, top repos
3. REST `GET /search/issues?q=author:{username}+type:pr+is:merged`: merged PR count
4. GraphQL `contributionsCollection`: total commits, PRs, issues, and the daily contribution calendar (used for the heatmap and streak)

**Setup steps:**

- Create a GitHub Personal Access Token with read-only public access (no extra permissions)
- Add it in Vercel as an environment variable named `GITHUB_TOKEN`
- Never write the token in any file in the project or in the frontend code
- Add a small cache (about 10 minutes per username) so repeated checks don't waste the rate limit
- If a user has more than 100 repos, only the latest 100 are used. That's fine.

## 7. Tech Stack (simple on purpose)

**Choice: plain HTML + CSS + JavaScript, plus one Vercel serverless function.** No React, no build tools, no database, no framework to learn. It's fast, light, and easy to host for free.

```
vibe-check/
  index.html        (all three screens in one page)
  style.css         (design, themes, animations)
  app.js            (screens, fetching, rendering, share card, compare)
  reactions.js      (titles, badges, score rules, reaction lines)
  api/vibe.js       (serverless function with the token)
```

**Libraries (loaded from a CDN, nothing to install):**

- canvas-confetti for confetti
- html-to-image for the downloadable share card
- Everything else (charts, heatmap, ring) is drawn with plain CSS and SVG

**Hosting:** Vercel free plan, deployed straight from a GitHub repo.

## 8. Mobile First

- Design for a 390px wide phone screen first, then scale up for desktop
- Tap targets at least 44px, input and button full width on mobile
- No horizontal scrolling anywhere, heatmap scrolls inside its own card if needed
- Share card image sized for social posts (1080 x 1350)
- Test on a phone-sized screen before calling it done

## 9. Build Order

**Phase 1: MVP (must work perfectly first)**

1. Landing screen with input and the themes
2. Serverless function returning the data
3. Loading screen
4. Result screen with profile, stats, title, score, reaction

**Phase 2: Visual extras** 5. Language bar, heatmap, top repos, badges 6. Count-up numbers, card animations, confetti

**Phase 3: Fun extras** 7. Share card download 8. Compare mode (two ids, higher vibe score wins, funny winner line) 9. Polish: edge cases, random lines, final mobile check

Do not start a phase until the previous one works.

## 10. Must-Not-Do List

- No login, sign-up, accounts or database
- No extra pages, menus, footers, about sections or settings
- No long paragraphs. Maximum 3 short lines of reaction text on screen
- No generic AI look: no default blue buttons, plain white boxes, or system fonts
- No token in frontend code
- No cringe overload: slang must feel natural, not forced in every sentence
- No mean or personal insults. Roast the stats, never the human
- No placeholder text, "lorem ipsum", or broken buttons left in the final result

## 11. Definition of Done (test every item)

- Works for 3 different usernames: a big account, a small account, and an empty one
- Wrong or empty username shows the funny message, with no crash
- Every screen looks good at 390px and at desktop width
- Dark and light mode both look clean
- Reaction, title and score change based on the real stats
- Random lines change between two checks of the same user
- Share card downloads as a clean image
- Compare mode shows a clear winner
- No errors in the browser console, and the token is not visible anywhere in the page source
- Page loads under 3 seconds and results appear in under 6
- The first impression is: "this is cute, I want to share it"
