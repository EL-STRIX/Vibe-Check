# GitHub Vibe Check
 
Enter any GitHub username and get an instant, Gen-Z style read of that developer: a dev title, a vibe score, a rarity card and a reaction based on real stats.
 
One page. No login. No sign-up.
 
## Features
 
- **Profile analysis:** repos, stars, commits, pull requests, issues, followers, languages, streak and a 12-month contribution heatmap
- **Vibe score (0-100):** calculated from real activity, always the same for the same stats
- **Dev title:** a title made for each profile, such as Commit Goblin, Star Magnet or Ghost Contributor
- **Secret titles:** five hidden titles that unlock on unusual stats
- **Rarity card:** Common, Rare, Epic or Legendary, with a matching glowing border
- **Aura points:** a score-based number that goes positive or negative
- **Archetype mix:** for example "52% Grinder, 31% Night Owl, 17% Explorer"
- **Unique reactions:** built from the person's own numbers, with Soft, Medium and Savage roast levels
- **Guess the score:** guess your own score before the reveal
- **Vibe battle:** compare two usernames and see who wins
- **Share card:** download a 1080 x 1350 PNG of your result
- **Dark and light mode**, sound and haptics (with a mute button)
## How It Works
 
1. The visitor enters a GitHub username.
2. The page calls `/api/vibe`, a serverless function.
3. The function reads public data from the GitHub REST and GraphQL APIs using a secret token and returns one JSON response.
4. The frontend calculates the score, title, rarity, aura and reaction, then shows the result.
The token never reaches the browser.
 
## Vibe Score
 
| Part | Points |
|---|---|
| Commits (12 months) | 25 |
| Stars | 20 |
| Longest streak | 15 |
| Merged pull requests | 15 |
| Followers | 10 |
| Active days | 10 |
| Languages | 5 |
 
Square-root curves are used for activity and log curves for stars and followers, so one huge number cannot dominate. Accounts younger than 12 months are judged against a shorter target.
 
| Score | Label | Rarity |
|---|---|---|
| 0-29 | needs a glow-up | Common (0-39) |
| 30-54 | mid but loading | Rare (40-64) |
| 55-79 | certified vibes | Epic (65-84) |
| 80-100 | main character energy | Legendary (85-100) |
 
Aura is calculated as `(score - 50) x 100 + min(stars, 3000) + min(followers, 3000)`.
 
## Tech Stack
 
- **Frontend:** plain HTML, CSS and JavaScript
- **Backend:** one Node.js serverless function (`api/vibe.js`)
- **Data:** GitHub REST and GraphQL APIs
- **Hosting:** Vercel
- **Libraries (CDN):** canvas-confetti, html-to-image
No framework, no build step, no database.
 
## Project Structure

```text
vibe-check/
├── api/
│   └── vibe.js          # Serverless API: fetches & aggregates GitHub REST & GraphQL data
├── Docs/                # Project specifications and logic documentation
├── index.html           # Single-page UI containing all screens and canvas exporter
├── style.css            # Design tokens, themes (dark/light), animations & sleek scrollbars
├── app.js               # Client controller: navigation, state, audio, and share card export
├── reactions.js         # Core game engine: scoring curves, titles, archetypes & roast generator
├── server.js            # Zero-dependency local development HTTP server
├── .env.local           # Environment variables (GitHub Personal Access Token)
├── .gitignore           # Git ignore patterns
└── README.md            # Project overview and local setup guide
```
 
## Setup
 
**1. Create a GitHub token**
 
GitHub, then Settings, Developer settings, Personal access tokens, Tokens (classic), Generate new token. Name it `vibe-check` and select no scopes. Public data needs none.
 
**2. Run locally**
 
```bash
git clone https://github.com/<your-username>/github-vibe-check.git
cd github-vibe-check
echo "GITHUB_TOKEN=your_token_here" > .env.local
npx vercel dev
```
 
**3. Deploy**
 
1. Push the project to a GitHub repository.
2. Import it into Vercel. Leave build settings empty.
3. Add `GITHUB_TOKEN` under Project Settings, then Environment Variables.
4. Deploy.
## Notes
 
- Only public GitHub data is used.
- Results are cached for about 10 minutes per username.
- Never commit your token. `.env.local` is listed in `.gitignore`.
- If the token leaks, delete it on GitHub and create a new one.
## Credits
 
Built by [@EL-STRIX](https://github.com/EL-STRIX).
 