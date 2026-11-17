# GitHub Vibe Check: Project Details

A cute, Gen-Z style GitHub profile analyzer

## The Idea

A single-page website where anyone types a GitHub username and instantly gets a fun, Gen-Z style "vibe check" of that developer. It reads their public GitHub data, shows the important stats, then reacts to the profile like a Gen-Z friend would: roasting, hyping, and giving them a funny title.

## Core Rules

- One page only. No login, no sign-up, no extra pages.
- Very little text on screen. Only what matters.
- Clean, premium, aesthetic Gen-Z look (soft gradients, rounded cards, smooth animations, dark/light feel).
- Every moment should feel entertaining, never boring.

## How It Works

1. **Landing screen:** a big, cute heading, one input box ("drop your GitHub id"), and one button.
2. **Loading screen:** short funny messages while data loads, like "stalking your commits..." or "reading your code, no judgment...".
3. **Result screen:** the profile shown as a few clean cards plus the reaction.
4. **Try another:** a button to check a new username, plus a share button.

## Data Collected (GitHub API)

- Profile: name, avatar, bio, followers, following, join date
- Public repos count and top repos
- Total stars earned
- Most used languages
- Commits and contribution activity
- Pull requests (opened and merged)
- Issues
- Streak (how many days in a row they coded)
- Most active day or time (night owl or early bird)

## What the User Sees

- **Profile card:** avatar, name, and a short bio.
- **Stats cards:** repos, stars, commits, PRs, followers, in big clean numbers.
- **Language chart:** a simple colorful bar or donut chart.
- **Contribution heatmap:** a mini version of their activity.
- **Top repos:** the best 2 or 3 only.

## The Fun Part (Reactions)

Based on the analysis, the site gives:

- **A dev title** made just for them, like "Commit Goblin", "Night Owl Coder", "Star Magnet", "Tutorial Hell Survivor", "Ghost Contributor".
- **A vibe score** out of 100, with a label (for example "main character energy" or "needs a glow-up").
- **A Gen-Z reaction** in trending slang (no cap, it's giving, rizz, aura, cooked, slay, mid, locked in, touch grass). It can hype or lightly roast depending on the stats.
  - Many commits: "bro is locked in, your aura is unmatched."
  - Few commits: "bestie, your repos are collecting dust, it's giving ghost town."
  - Many stars: "no cap, devs are fans of you."
- **Fun badges** like "Night Owl", "Streak King/Queen", "Open Source Hero", "Language Hopper".
- **A funny one-line verdict** at the end.

## Small Extra Features

- Emoji reactions and small animations (confetti for high scores).
- Share card: a downloadable image of the result to post on social media.
- Compare mode: put two GitHub ids and see who wins the vibe battle.
- Dark/light mode toggle.
- Randomized reaction lines so every check feels fresh.

## Tech Plan

- **Frontend:** HTML, CSS, JavaScript (or React) in a single page.
- **Data:** GitHub REST API for profile, repos, stars, PRs; GitHub GraphQL API for contributions and commits.
- **Reactions:** rule-based logic that matches stats to a pool of Gen-Z lines and titles.
- **Hosting:** free hosting like Vercel or Netlify.
- **Note:** GitHub's API has rate limits, so a small token on a backend or serverless function may be needed for the contribution data.

## Final Goal

A cute, fast, shareable project where any developer enters their GitHub id, gets a quick Gen-Z style reaction and a fun title, and wants to share it with friends.
